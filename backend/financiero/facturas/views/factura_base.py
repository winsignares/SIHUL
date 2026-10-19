from rest_framework import filters, parsers
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
import logging
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from financiero.proveedores.models import Proveedor
from financiero.facturas.models import Factura, HistorialFactura, RechazoDevolucion
from financiero.facturas.serializers import FacturaCreateSerializer, FacturaDetailSerializer, FacturaListSerializer
from financiero.facturas.sla import actualizar_sla_factura, build_parametros_sla_map
from unispace.usuarios.models import Usuario
from unispace.notificaciones.signals import crear_notificacion


from .helpers import FacturaPagination, _documento_es_sensible, _documentos_queryset_ciclo_actual, _usuario_puede_ver_documentos_sensibles

logger = logging.getLogger(__name__)


class FacturaBaseMixin:
    """Atributos, consultas y utilidades comunes de FacturaViewSet."""

    permission_classes = [IsAuthenticated]

    pagination_class = FacturaPagination

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    filterset_fields = ['estado', 'indicador_riesgo', 'proveedor', 'departamento', 'urgente']

    search_fields = ['numero_factura', 'numero_radicado', 'proveedor__razon_social']

    ordering_fields = ['fecha_recepcion', 'valor_total', 'estado']

    ordering = ['-fecha_recepcion']

    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]


    def get_queryset(self):
        user = self.request.user
        queryset = Factura.objects.all()

        if self.action == 'list':
            queryset = queryset.select_related(
                'proveedor', 'departamento', 'cuenta_contable', 'centro_costo',
            ).prefetch_related('items')

        rol_nombre = (user.rol.nombre if getattr(user, 'rol', None) else '').strip()
        if rol_nombre == 'Funcionario':
            queryset = queryset.filter(
                Q(creado_por=user) |
                Q(usuario_responsable=user) |
                Q(historial__usuario=user) |
                Q(usuario_responsable__isnull=True, estado='Recibida')
            ).distinct()
        elif rol_nombre == 'Proveedor':
            # Proveedor solo ve sus propias facturas (por vínculo directo o email)
            proveedor = Proveedor.objects.filter(usuario=user).first()
            if not proveedor and user.correo:
                proveedor = Proveedor.objects.filter(email__iexact=user.correo).first()

            if proveedor and not proveedor.usuario_id:
                proveedor.usuario = user
                proveedor.save(update_fields=['usuario'])

            if proveedor:
                queryset = queryset.filter(proveedor=proveedor)
            else:
                queryset = queryset.filter(creado_por=user)

        return queryset


    def _usuarios_por_rol(self, roles):
        if not roles:
            return []
        return list(
            Usuario.objects.filter(rol__nombre__in=roles, activo=True).values_list('id', flat=True)
        )


    def _ruta_factura_por_rol(self, factura, usuario):
        rol_nombre = (getattr(getattr(usuario, 'rol', None), 'nombre', '') or '').strip().lower()
        if rol_nombre == 'proveedor':
            return f'/financiero/proveedor/mis-facturas/{factura.id}'
        return f'/financiero/funcionario/consultar?factura={factura.id}'


    def _notificar_transicion(self, factura, estado_anterior, estado_nuevo):
        numero = factura.numero_factura
        creador_id = factura.creado_por_id

        siguientes_roles = {
            'Recibida': ['Contabilidad'],
            'Registrada': ['Contabilidad'],
            'Radicada': ['Contabilidad'],
            'Causada': ['Tesorería'],
            'Alistada': ['Auditoría'],
            'Aprobada Auditoría': ['Dirección Financiera'],
            'Rechazada Auditoría': ['Tesorería'],
            'Revisada Dir. Financiera': ['Dirección Financiera'],
            'Cargada': ['Rectoría'],
            'Enviada Rectoría': ['Rectoría'],
            'Rechazada por Rectoría': ['Dirección Financiera'],
            'Devuelta': ['Dirección Financiera'],
            'Pago Aplicado': ['Tesorería'],
        }

        destinatarios = set()
        if creador_id:
            destinatarios.add(creador_id)

        for user_id in self._usuarios_por_rol(siguientes_roles.get(estado_nuevo, [])):
            destinatarios.add(user_id)

        usuarios_destino = {
            usuario.id: usuario
            for usuario in Usuario.objects.filter(id__in=destinatarios).select_related('rol')
        }

        es_devolucion = estado_nuevo == 'Devuelta' or factura.etapa_actual == 'Corrección Funcionario'
        motivo_devolucion = None
        if es_devolucion:
            motivo_devolucion = (
                RechazoDevolucion.objects
                .filter(factura=factura)
                .order_by('-fecha_rechazo')
                .values_list('motivo', flat=True)
                .first()
            )

        for user_id in destinatarios:
            usuario_destino = usuarios_destino.get(user_id)
            enlace = self._ruta_factura_por_rol(factura, usuario_destino)

            tipo_notificacion = 'FACTURA_ETAPA_ACTUALIZADA'
            mensaje = (
                f'La factura {numero} ha avanzado en su proceso de revisión. '
                f'Estado anterior: {estado_anterior or "Sin estado"}. '
                f'Estado actual: {estado_nuevo}. '
                f'Puedes revisar los detalles en tu panel de facturas.'
            )
            prioridad = 'alta' if estado_nuevo in ['Recibida', 'Devuelta', 'Rechazada', 'Rechazada por Rectoría'] else 'media'

            if es_devolucion and user_id == creador_id:
                tipo_notificacion = 'FACTURA_DEVUELTA'
                mensaje = (
                    f'La factura {numero} ha sido devuelta para corrección. '
                    f'Motivo: {motivo_devolucion or "Revisar observaciones en el historial de cambios"}. '
                    f'Por favor, realiza los ajustes necesarios y vuelve a enviarla.'
                )
                prioridad = 'alta'

            crear_notificacion(
                id_usuario=user_id,
                tipo=tipo_notificacion,
                mensaje=mensaje,
                prioridad=prioridad,
            )


    def _generar_numero_confirmacion(self):
        year = timezone.now().year
        prefix = f"CONF-{year}-"
        last_number = (
            Factura.objects
            .filter(numero_confirmacion__startswith=prefix)
            .order_by('-numero_confirmacion')
            .values_list('numero_confirmacion', flat=True)
            .first()
        )

        next_seq = 1
        if last_number:
            try:
                next_seq = int(str(last_number).split('-')[-1]) + 1
            except (TypeError, ValueError):
                next_seq = 1

        return f"{prefix}{next_seq:04d}"


    def _texto_normalizado(self, value):
        return str(value or '').strip().lower()


    def _doc_cumple_tipo(self, documento, tipo_requerido, keywords):
        tipo_doc = self._texto_normalizado(getattr(documento, 'tipo_documento', ''))
        nombre_doc = self._texto_normalizado(getattr(documento, 'nombre_archivo', ''))
        tipo_ref = self._texto_normalizado(tipo_requerido)

        if tipo_doc == tipo_ref:
            return True

        return any(keyword in nombre_doc for keyword in keywords)


    def _obtener_faltantes_radicacion(self, factura):
        requeridos = {
            'Factura': ['factura'],
            'Orden de Compra': ['orden', 'compra', 'contrato'],
            'Certificación Bancaria': ['certif', 'bancari'],
        }

        documentos = list(_documentos_queryset_ciclo_actual(factura))
        faltantes = []

        for tipo_requerido, keywords in requeridos.items():
            existe = any(
                self._doc_cumple_tipo(doc, tipo_requerido, keywords)
                for doc in documentos
            )
            if not existe:
                faltantes.append(tipo_requerido)

        return faltantes


    def _scope_documental_por_rol(self, request):
        rol_nombre = (getattr(getattr(request.user, 'rol', None), 'nombre', '') or '').strip().lower()
        if rol_nombre == 'funcionario':
            return 'funcionario'
        if rol_nombre == 'contabilidad':
            return 'contabilidad'
        return 'all'


    def _resolve_scope_documental(self, request):
        requested_scope = (request.query_params.get('scope') or '').strip()
        return requested_scope or self._scope_documental_por_rol(request)


    def _factura_response_data(self, factura):
        return FacturaDetailSerializer(
            factura,
            context={'request': self.request},
        ).data


    def _roles_hasta_scope(self, scope):
        scope_normalizado = (scope or 'all').strip().lower()
        if scope_normalizado == 'proveedor':
            return {'proveedor'}
        if scope_normalizado == 'funcionario':
            return {'proveedor', 'funcionario'}
        if scope_normalizado == 'contabilidad':
            return {'proveedor', 'funcionario', 'contabilidad'}
        return None


    def _documentos_filtrados_por_scope(self, factura, scope):
        allowed_roles = self._roles_hasta_scope(scope)
        queryset = (
            _documentos_queryset_ciclo_actual(factura)
            .select_related('cargado_por__rol')
            .order_by('fecha_carga', 'id')
        )

        if allowed_roles is None:
            documentos = list(queryset)
        else:
            documentos = []
            for documento in queryset:
                usuario = getattr(documento, 'cargado_por', None)
                rol = (getattr(getattr(usuario, 'rol', None), 'nombre', '') or '').strip().lower()
                if not rol or rol in allowed_roles:
                    documentos.append(documento)

        # Deduplicar por tipo_documento: conservar solo el más reciente de cada tipo
        seen_tipos = {}
        for doc in documentos:
            if not _usuario_puede_ver_documentos_sensibles(self.request.user) and _documento_es_sensible(doc):
                continue
            seen_tipos[doc.tipo_documento] = doc  # sobrescribe con el más reciente (orden ASC por fecha)
        return list(seen_tipos.values())


    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FacturaDetailSerializer
        elif self.action == 'create':
            return FacturaCreateSerializer
        elif self.action == 'list':
            return FacturaListSerializer
        return FacturaDetailSerializer


    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action == 'list':
            context['parametros_map'] = build_parametros_sla_map()
        return context


    def perform_create(self, serializer):
        factura = serializer.save(creado_por=self.request.user)

        if not factura.etapa_actual:
            factura.etapa_actual = 'Recepción y Registro'
        if not factura.fecha_inicio_etapa:
            factura.fecha_inicio_etapa = factura.fecha_recepcion or timezone.now().date()

        factura.save(update_fields=['etapa_actual', 'fecha_inicio_etapa', 'fecha_modificacion'])
        
        # Crear entrada en historial
        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura registrada',
            estado_nuevo='Recibida',
            usuario=self.request.user,
            usuario_nombre=self.request.user.nombre,
            usuario_rol=self.request.user.rol.nombre if self.request.user.rol else 'Sin rol'
        )

        actualizar_sla_factura(factura)
        self._notificar_transicion(factura, None, factura.estado)
