from rest_framework import viewsets, filters, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import IntegrityError
from django.db.models import Q
import json
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from . import models, serializers
from usuarios.models import Usuario
from notificaciones.signals import crear_notificacion


DEFAULT_CUENTAS_CONTABLES = [
    {
        'codigo': '513505',
        'nombre': 'Servicios públicos',
        'tipo_cuenta': 'Gasto',
        'nivel': 4,
        'cuenta_padre': '5135',
        'naturaleza': 'Débito',
        'acepta_movimiento': True,
        'requiere_tercero': True,
        'requiere_centro_costo': True,
        'estado': 'Activo',
    },
    {
        'codigo': '513595',
        'nombre': 'Otros servicios administrativos',
        'tipo_cuenta': 'Gasto',
        'nivel': 4,
        'cuenta_padre': '5135',
        'naturaleza': 'Débito',
        'acepta_movimiento': True,
        'requiere_tercero': True,
        'requiere_centro_costo': True,
        'estado': 'Activo',
    },
    {
        'codigo': '220505',
        'nombre': 'Proveedores nacionales',
        'tipo_cuenta': 'Pasivo',
        'nivel': 4,
        'cuenta_padre': '2205',
        'naturaleza': 'Crédito',
        'acepta_movimiento': True,
        'requiere_tercero': True,
        'requiere_centro_costo': False,
        'estado': 'Activo',
    },
]

DEFAULT_CENTROS_COSTO = [
    {'codigo': 'CC-ADM-001', 'nombre': 'Administración General', 'tipo': 'Administrativo', 'estado': 'Activo'},
    {'codigo': 'CC-ACA-001', 'nombre': 'Gestión Académica', 'tipo': 'Académico', 'estado': 'Activo'},
    {'codigo': 'CC-OPE-001', 'nombre': 'Operación Institucional', 'tipo': 'Operativo', 'estado': 'Activo'},
]


# ============================================================
# VIEWSETS SIMPLES
# ============================================================

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = models.Proveedor.objects.all()
    serializer_class = serializers.ProveedorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'tipo_proveedor']
    search_fields = ['nit', 'razon_social', 'email']
    ordering_fields = ['fecha_creacion', 'razon_social']
    ordering = ['-fecha_creacion']

    @action(detail=False, methods=['get'], url_path='mi_perfil')
    def mi_perfil(self, request):
        """Encuentra el proveedor asociado al usuario actual por vínculo directo, email o NIT."""
        user = request.user
        proveedor = models.Proveedor.objects.filter(usuario=user).first()

        # 1. Fallback por email del usuario
        if not proveedor and user.correo:
            proveedor = models.Proveedor.objects.filter(email__iexact=user.correo).first()

        # 2. Fallback por NIT pasado como query param
        if not proveedor:
            nit = (request.query_params.get('nit') or '').strip()
            if nit:
                proveedor = models.Proveedor.objects.filter(nit=nit).first()

        if proveedor and proveedor.usuario_id and proveedor.usuario_id != user.id:
            return Response(
                {'detail': 'Este proveedor ya está vinculado a otro usuario.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Auto-vincular en primer acceso para consolidar la relación usuario <-> proveedor
        if proveedor and not proveedor.usuario_id:
            proveedor.usuario = user
            proveedor.save(update_fields=['usuario'])

        if proveedor:
            return Response(serializers.ProveedorSerializer(proveedor).data)

        return Response(
            {'detail': 'No se encontró un proveedor asociado a este usuario.'},
            status=status.HTTP_404_NOT_FOUND
        )


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = models.Departamento.objects.all()
    serializer_class = serializers.DepartamentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']

    @action(detail=False, methods=['get'])
    def areas_solicitantes(self, request):
        """Lista de áreas solicitantes para registro inicial (excluye áreas del flujo financiero)."""
        excluded_default = [
            'Financiero',
            'Contabilidad',
            'Tesorería',
            'Auditoría',
            'Dirección Financiera',
            'Rectoría',
        ]

        excluded = excluded_default
        config = models.ParametrosFinanciero.objects.filter(
            clave='areas_solicitantes_excluidas'
        ).first()

        if config and config.valor:
            try:
                parsed = json.loads(config.valor)
                if isinstance(parsed, list):
                    excluded = [str(item).strip() for item in parsed if str(item).strip()]
            except (TypeError, ValueError, json.JSONDecodeError):
                excluded = excluded_default

        queryset = models.Departamento.objects.filter(estado='Activo').exclude(nombre__in=excluded).order_by('nombre')
        serializer = serializers.DepartamentoSerializer(queryset, many=True)
        return Response(serializer.data)


class CuentaContableViewSet(viewsets.ModelViewSet):
    queryset = models.CuentaContable.objects.all()
    serializer_class = serializers.CuentaContableSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo_cuenta', 'nivel', 'estado']
    search_fields = ['codigo', 'nombre']

    def list(self, request, *args, **kwargs):
        if not models.CuentaContable.objects.exists():
            for cuenta in DEFAULT_CUENTAS_CONTABLES:
                models.CuentaContable.objects.get_or_create(codigo=cuenta['codigo'], defaults=cuenta)
        return super().list(request, *args, **kwargs)


class CentroCostoViewSet(viewsets.ModelViewSet):
    queryset = models.CentroCosto.objects.all()
    serializer_class = serializers.CentroCostoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']

    def list(self, request, *args, **kwargs):
        if not models.CentroCosto.objects.exists():
            for centro in DEFAULT_CENTROS_COSTO:
                models.CentroCosto.objects.get_or_create(codigo=centro['codigo'], defaults=centro)
        return super().list(request, *args, **kwargs)


class ParametroSLAViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.ParametroSLA.objects.filter(activo=True)
    serializer_class = serializers.ParametroSLASerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['etapa', 'rol_responsable']


class ParametrosFinancieroViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.ParametrosFinanciero.objects.all()
    serializer_class = serializers.ParametrosFinancieroSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categoria']

    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """Obtener parámetros agrupados por categoría"""
        params = models.ParametrosFinanciero.objects.all()
        grouped = {}
        for param in params:
            if param.categoria not in grouped:
                grouped[param.categoria] = []
            grouped[param.categoria].append({
                'clave': param.clave,
                'valor': param.valor,
                'tipo_dato': param.tipo_dato
            })
        return Response(grouped)


class ReporteGeneradoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.ReporteGenerado.objects.all()
    serializer_class = serializers.ReporteGeneradoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['tipo_reporte', 'formato']
    ordering = ['-fecha_generacion']

    def get_queryset(self):
        # Cada usuario ve solo sus reportes
        return models.ReporteGenerado.objects.filter(generado_por=self.request.user)


# ============================================================
# VIEWSETS COMPLEJOS
# ============================================================

class DocumentoAdjuntoViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.DocumentoAdjuntoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['factura', 'tipo_documento']
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            return models.DocumentoAdjunto.objects.filter(factura_id=factura_id)
        return models.DocumentoAdjunto.objects.all()

    def perform_create(self, serializer):
        archivo = self.request.FILES.get('archivo')
        url_storage = self.request.data.get('url_storage', '') or ''
        instance = serializer.save(cargado_por=self.request.user, url_storage=url_storage)
        if archivo and instance.archivo:
            try:
                instance.url_storage = instance.archivo.url
                instance.save(update_fields=['url_storage'])
            except Exception:
                pass


class HistorialFacturaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.HistorialFacturaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['factura', 'accion']
    ordering = ['-fecha_accion']

    def get_queryset(self):
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            return models.HistorialFactura.objects.filter(factura_id=factura_id)
        return models.HistorialFactura.objects.all()


class ComentarioFacturaViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.ComentarioFacturaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['factura', 'tipo']
    ordering = ['fecha_creacion']

    def get_queryset(self):
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            return models.ComentarioFactura.objects.filter(factura_id=factura_id)
        return models.ComentarioFactura.objects.all()

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class RechazoDevolacionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.RechazoDevolacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['factura', 'tipo', 'estado_devolucion']

    def get_queryset(self):
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            return models.RechazoDevolucion.objects.filter(factura_id=factura_id)
        return models.RechazoDevolucion.objects.all()


# ============================================================
# FACTURA VIEWSET (PRINCIPAL)
# ============================================================

class FacturaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'indicador_riesgo', 'proveedor', 'departamento', 'urgente']
    search_fields = ['numero_factura', 'numero_radicado', 'proveedor__razon_social']
    ordering_fields = ['fecha_recepcion', 'valor_total', 'estado']
    ordering = ['-fecha_recepcion']
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        user = self.request.user
        queryset = models.Factura.objects.all()

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
            proveedor = models.Proveedor.objects.filter(usuario=user).first()
            if not proveedor and user.correo:
                proveedor = models.Proveedor.objects.filter(email__iexact=user.correo).first()

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
            'Autorizada': ['Tesorería'],
            'Rechazada por Rectoría': ['Dirección Financiera'],
            'Devuelta': ['Dirección Financiera'],
            'Pago Aplicado': ['Tesorería'],
        }

        destinatarios = set()
        if creador_id:
            destinatarios.add(creador_id)

        for user_id in self._usuarios_por_rol(siguientes_roles.get(estado_nuevo, [])):
            destinatarios.add(user_id)

        enlace = f'/financiero/funcionario/consultar?factura={factura.id}'
        mensaje = (
            f'Factura actualizada: {numero} cambió de etapa '
            f'{estado_anterior or "Sin estado"} -> {estado_nuevo}. '
            f'Enlace: {enlace}'
        )

        for user_id in destinatarios:
            crear_notificacion(
                id_usuario=user_id,
                tipo='FACTURA_ETAPA_ACTUALIZADA',
                mensaje=mensaje,
                prioridad='alta' if estado_nuevo in ['Recibida', 'Devuelta', 'Rechazada', 'Rechazada por Rectoría'] else 'media',
            )

    def _generar_numero_confirmacion(self):
        year = timezone.now().year
        prefix = f"CONF-{year}-"
        last_number = (
            models.Factura.objects
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

        documentos = list(models.DocumentoAdjunto.objects.filter(factura=factura))
        faltantes = []

        for tipo_requerido, keywords in requeridos.items():
            existe = any(
                self._doc_cumple_tipo(doc, tipo_requerido, keywords)
                for doc in documentos
            )
            if not existe:
                faltantes.append(tipo_requerido)

        return faltantes

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return serializers.FacturaDetailSerializer
        elif self.action == 'create':
            return serializers.FacturaCreateSerializer
        elif self.action == 'list':
            return serializers.FacturaListSerializer
        return serializers.FacturaDetailSerializer

    def perform_create(self, serializer):
        factura = serializer.save(creado_por=self.request.user)

        if not factura.etapa_actual:
            factura.etapa_actual = 'Recepción y Registro'
            factura.save(update_fields=['etapa_actual', 'fecha_modificacion'])
        
        # Crear entrada en historial
        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura registrada',
            estado_nuevo='Recibida',
            usuario=self.request.user,
            usuario_nombre=self.request.user.nombre,
            usuario_rol=self.request.user.rol.nombre if self.request.user.rol else 'Sin rol'
        )

        self._notificar_transicion(factura, None, factura.estado)

    @action(detail=False, methods=['get'])
    def numero_sugerido(self, request):
        """Retorna el próximo número sugerido de factura con formato FAC-YYYY-####."""
        year = timezone.now().year
        prefix = f"FAC-{year}-"
        
        # Obtener todas las facturas del año para ordenarlas numéricamente
        all_facturas = (
            models.Factura.objects
            .filter(numero_factura__startswith=prefix)
            .values_list('numero_factura', flat=True)
        )
        
        next_seq = 1
        if all_facturas:
            try:
                # Extraer secuencias numéricas y encontrar la máxima
                sequences = []
                for num in all_facturas:
                    seq_str = str(num).split('-')[-1]
                    try:
                        seq = int(seq_str)
                        sequences.append(seq)
                    except (TypeError, ValueError):
                        continue
                
                if sequences:
                    next_seq = max(sequences) + 1
            except Exception:
                next_seq = 1
        
        numero_sugerido = f"{prefix}{next_seq:04d}"
        return Response({'numero_factura': numero_sugerido})

    @action(detail=True, methods=['post'])
    def radicar(self, request, pk=None):
        """Radicar una factura"""
        factura = self.get_object()

        if factura.estado not in ['Recibida', 'Registrada']:
            return Response(
                {'error': 'La factura debe estar en estado Recibida o Registrada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        faltantes = self._obtener_faltantes_radicacion(factura)
        if faltantes:
            return Response(
                {
                    'error': 'No se puede radicar: faltan soportes obligatorios.',
                    'faltantes': faltantes,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        observaciones = (request.data.get('observaciones') or '').strip()
        
        factura.estado = 'Radicada'
        factura.fecha_radicacion = timezone.now().date()
        factura.numero_radicado = f"RAD-{factura.id:06d}"
        factura.etapa_actual = 'Radicación'
        factura.usuario_responsable = request.user
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura radicada',
            estado_anterior=estado_anterior,
            estado_nuevo='Radicada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Radicada')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='autorizar_rectoria')
    def autorizar_rectoria(self, request, pk=None):
        """Autorizar una factura desde Rectoría para continuar con tesorería."""
        factura = self.get_object()

        if factura.estado != 'Enviada Rectoría':
            return Response(
                {'error': 'La factura debe estar enviada a Rectoría para autorizarla'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        factura.estado = 'Autorizada'
        factura.fecha_autorizacion = timezone.now().date()
        factura.etapa_actual = 'Autorización Rectoría'
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Rectoría] {observaciones}"]))

        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura autorizada por rectoría',
            estado_anterior=estado_anterior,
            estado_nuevo='Autorizada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Autorizada')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='rechazar_rectoria')
    def rechazar_rectoria(self, request, pk=None):
        """Rechazar una factura desde Rectoría y devolverla a Dirección Financiera."""
        factura = self.get_object()

        if factura.estado != 'Enviada Rectoría':
            return Response(
                {'error': 'La factura debe estar enviada a Rectoría para rechazarla'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = (request.data.get('motivo') or '').strip()
        if len(motivo) < 10:
            return Response(
                {'error': 'Debe registrar un motivo de rechazo (mínimo 10 caracteres)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        factura.estado = 'Rechazada por Rectoría'
        factura.etapa_actual = 'Corrección Dirección Financiera'
        factura.usuario_responsable = None
        factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Rectoría - Rechazo] {motivo}"]))
        factura.save()

        models.RechazoDevolucion.objects.create(
            factura=factura,
            tipo='Rechazo',
            etapa_rechazo='Rectoría',
            motivo=motivo,
            estado_devolucion='Pendiente Corrección',
            usuario_rechaza=request.user,
        )

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura rechazada por rectoría',
            estado_anterior=estado_anterior,
            estado_nuevo='Rechazada por Rectoría',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=motivo,
        )

        self._notificar_transicion(factura, estado_anterior, 'Rechazada por Rectoría')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='confirmar_control_pago')
    def confirmar_control_pago(self, request, pk=None):
        """Registrar control de pago sin cerrar la etapa de pago aplicado."""
        factura = self.get_object()

        if factura.estado != 'Autorizada':
            return Response(
                {'error': 'La factura debe estar autorizada para confirmar control de pago'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()

        if not factura.numero_confirmacion:
            for _ in range(5):
                factura.numero_confirmacion = self._generar_numero_confirmacion()
                try:
                    factura.save(update_fields=['numero_confirmacion'])
                    break
                except IntegrityError:
                    factura.numero_confirmacion = None

            if not factura.numero_confirmacion:
                return Response(
                    {'error': 'No fue posible generar un número de confirmación único'},
                    status=status.HTTP_409_CONFLICT
                )

        factura.etapa_actual = 'Control de Pago Confirmado'
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Control Pago] {observaciones}"]))

        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Control de pago confirmado',
            estado_anterior='Autorizada',
            estado_nuevo='Autorizada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
            datos_adicionales={'numero_confirmacion': factura.numero_confirmacion},
        )

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def causar(self, request, pk=None):
        """Causar una factura"""
        factura = self.get_object()
        
        if factura.estado != 'Radicada':
            return Response(
                {'error': 'La factura debe estar radicada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cuenta_contable_id = request.data.get('cuenta_contable_id')
        centro_costo_id = request.data.get('centro_costo_id')
        observaciones = request.data.get('observaciones', '')

        if not cuenta_contable_id:
            return Response({'error': 'Debe seleccionar una cuenta contable'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            factura.cuenta_contable = models.CuentaContable.objects.get(pk=cuenta_contable_id)
        except models.CuentaContable.DoesNotExist:
            return Response({'error': 'Cuenta contable no encontrada'}, status=status.HTTP_400_BAD_REQUEST)

        if centro_costo_id:
            try:
                factura.centro_costo = models.CentroCosto.objects.get(pk=centro_costo_id)
            except models.CentroCosto.DoesNotExist:
                return Response({'error': 'Centro de costo no encontrado'}, status=status.HTTP_400_BAD_REQUEST)

        factura.estado = 'Causada'
        factura.fecha_causacion = timezone.now().date()
        factura.etapa_actual = 'Causación'
        factura.usuario_responsable = request.user
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura causada',
            estado_anterior='Radicada',
            estado_nuevo='Causada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None
        )

        self._notificar_transicion(factura, 'Radicada', 'Causada')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def alistar(self, request, pk=None):
        """Alistar una factura"""
        factura = self.get_object()
        
        if factura.estado not in ['Causada', 'Detenida']:
            return Response(
                {'error': 'La factura debe estar causada o detenida en tesorería'},
                status=status.HTTP_400_BAD_REQUEST
            )

        numero_proceso_pago = (request.data.get('numero_proceso_pago') or '').strip()
        archivo_plano_generado = (request.data.get('archivo_plano_generado') or '').strip()
        observaciones = (request.data.get('observaciones') or '').strip()

        if not numero_proceso_pago and not archivo_plano_generado:
            return Response(
                {'error': 'Debe registrar el número de proceso de pago o un archivo plano generado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado

        if numero_proceso_pago:
            factura.numero_proceso_pago = numero_proceso_pago
        if archivo_plano_generado:
            factura.archivo_plano_generado = archivo_plano_generado
        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería] {observaciones}"]))

        factura.estado = 'Alistada'
        factura.fecha_alistamiento = timezone.now().date()
        factura.etapa_actual = 'Alistamiento'
        factura.usuario_responsable = request.user
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura alistada',
            estado_anterior=estado_anterior,
            estado_nuevo='Alistada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Alistada')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='aprobar_auditoria')
    def aprobar_auditoria(self, request, pk=None):
        """Aprobar una factura en control previo de auditoría."""
        factura = self.get_object()

        if factura.estado != 'Alistada':
            return Response(
                {'error': 'La factura debe estar alistada para auditoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        factura.estado = 'Aprobada Auditoría'
        factura.fecha_aprobacion_auditoria = timezone.now().date()
        factura.etapa_actual = 'Control Previo'
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Auditoría] {observaciones}"]))

        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura aprobada por auditoría',
            estado_anterior=estado_anterior,
            estado_nuevo='Aprobada Auditoría',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Aprobada Auditoría')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='rechazar_auditoria')
    def rechazar_auditoria(self, request, pk=None):
        """Rechazar una factura en auditoría y devolverla a tesorería."""
        factura = self.get_object()

        if factura.estado != 'Alistada':
            return Response(
                {'error': 'La factura debe estar alistada para auditoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = (request.data.get('motivo') or '').strip()
        if len(motivo) < 10:
            return Response(
                {'error': 'Debe registrar un motivo de rechazo (mínimo 10 caracteres)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        factura.estado = 'Rechazada Auditoría'
        factura.etapa_actual = 'Tesorería - Ajustes internos'
        factura.usuario_responsable = None
        factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Auditoría - Rechazo] {motivo}"]))
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura rechazada por auditoría',
            estado_anterior=estado_anterior,
            estado_nuevo='Rechazada Auditoría',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=motivo,
        )

        self._notificar_transicion(factura, estado_anterior, 'Rechazada Auditoría')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='enviar_direccion_financiera')
    def enviar_direccion_financiera(self, request, pk=None):
        """Enviar una factura aprobada a Dirección Financiera."""
        factura = self.get_object()

        if factura.estado != 'Aprobada Auditoría':
            return Response(
                {'error': 'La factura debe estar aprobada por Auditoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        factura.estado = 'Revisada Dir. Financiera'
        factura.fecha_revision_direccion = timezone.now().date()
        factura.etapa_actual = 'Envío a Dirección Financiera'
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería] {observaciones}"]))

        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura enviada a Dirección Financiera',
            estado_anterior=estado_anterior,
            estado_nuevo='Revisada Dir. Financiera',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Revisada Dir. Financiera')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='registrar_pago_aplicado')
    def registrar_pago_aplicado(self, request, pk=None):
        """Registrar pago aplicado en tesorería."""
        factura = self.get_object()

        if factura.estado != 'Autorizada':
            return Response(
                {'error': 'La factura debe estar autorizada para pago'},
                status=status.HTTP_400_BAD_REQUEST
            )

        numero_transaccion = (request.data.get('numero_transaccion') or '').strip()
        observaciones = (request.data.get('observaciones') or '').strip()
        fecha_pago = request.data.get('fecha_pago_aplicado')
        comprobante_bancario = request.FILES.get('comprobante_bancario')

        if not numero_transaccion:
            return Response(
                {'error': 'Debe registrar el número de transacción bancaria'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not comprobante_bancario:
            return Response(
                {'error': 'Debe adjuntar el comprobante bancario en archivo (PDF/XML/PNG/JPG).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado

        factura.numero_transaccion = numero_transaccion
        factura.fecha_pago_aplicado = fecha_pago or timezone.now().date()
        factura.estado = 'Pago Aplicado'
        factura.etapa_actual = 'Pago Aplicado'
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería] {observaciones}"]))

        factura.save()

        documento_data = {
            'factura': factura.id,
            'nombre_archivo': comprobante_bancario.name,
            'tipo_documento': 'Comprobante de Pago',
            'url_storage': comprobante_bancario.name,
            'tamano_bytes': comprobante_bancario.size,
            'tipo_mime': getattr(comprobante_bancario, 'content_type', '') or None,
            'archivo': comprobante_bancario,
        }
        documento_serializer = serializers.DocumentoAdjuntoSerializer(data=documento_data, context={'request': request})
        if not documento_serializer.is_valid():
            return Response(documento_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        documento_serializer.save(cargado_por=request.user)

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Pago aplicado registrado',
            estado_anterior=estado_anterior,
            estado_nuevo='Pago Aplicado',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Pago Aplicado')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='generar_comprobante')
    def generar_comprobante(self, request, pk=None):
        """Generar comprobante de egreso y cerrar la factura."""
        factura = self.get_object()

        if factura.estado != 'Pago Aplicado':
            return Response(
                {'error': 'La factura debe estar con pago aplicado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        numero_comprobante = (request.data.get('numero_comprobante') or '').strip()
        observaciones = (request.data.get('observaciones') or '').strip()

        if not numero_comprobante:
            return Response(
                {'error': 'Debe registrar el número de comprobante de egreso'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado

        factura.numero_comprobante = numero_comprobante
        factura.fecha_comprobante = timezone.now().date()
        factura.estado = 'Pagada'
        factura.etapa_actual = 'Comprobante de Egreso'
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería] {observaciones}"]))

        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Comprobante de egreso generado',
            estado_anterior=estado_anterior,
            estado_nuevo='Pagada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Pagada')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='detener_en_tesoreria')
    def detener_en_tesoreria(self, request, pk=None):
        """Detener una factura en tesorería por inconsistencias sin enviarla a auditoría."""
        factura = self.get_object()

        if factura.estado not in ['Causada', 'Detenida']:
            return Response(
                {'error': 'Solo se pueden detener facturas en estado Causada o Detenida'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        if len(observaciones) < 10:
            return Response(
                {'error': 'Debe registrar una observación de al menos 10 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        factura.estado = 'Detenida'
        factura.etapa_actual = 'Tesorería - Ajustes internos'
        factura.usuario_responsable = request.user
        factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería - Detenida] {observaciones}"]))
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura detenida en tesorería',
            estado_anterior=estado_anterior,
            estado_nuevo='Detenida',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones,
        )

        self._notificar_transicion(factura, estado_anterior, 'Detenida')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar una factura con motivo"""
        factura = self.get_object()
        motivo = (request.data.get('motivo') or '').strip()

        if len(motivo) < 10:
            return Response(
                {'error': 'El motivo de rechazo/devolución es obligatorio (mínimo 10 caracteres).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado

        if estado_anterior in ['Recibida', 'Registrada', 'Radicada']:
            estado_destino = 'Registrada'
            etapa_destino = 'Corrección Funcionario'
            responsable_destino = factura.creado_por
        else:
            estado_destino = 'Devuelta'
            etapa_destino = 'Devolución'
            responsable_destino = None
        
        models.RechazoDevolucion.objects.create(
            factura=factura,
            tipo='Rechazo',
            etapa_rechazo=factura.etapa_actual,
            motivo=motivo,
            estado_devolucion='Pendiente Corrección',
            usuario_rechaza=request.user
        )

        factura.estado = estado_destino
        factura.etapa_actual = etapa_destino
        factura.usuario_responsable = responsable_destino
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura devuelta',
            estado_anterior=estado_anterior,
            estado_nuevo=estado_destino,
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=motivo
        )

        self._notificar_transicion(factura, estado_anterior, estado_destino)

        return Response(
            {'mensaje': f'Factura rechazada y enviada a {estado_destino}'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """
        Obtener SOLO facturas NUEVAS pendientes de registro.
        Estas son facturas en estado 'Recibida' sin responsable asignado.
        Una vez el usuario las registra/procesa completamente, desaparecen de aquí.
        """
        user = request.user
        rol_nombre = (user.rol.nombre if getattr(user, 'rol', None) else '').strip()
        
        # Solo Funcionario ve sus pendientes
        if rol_nombre != 'Funcionario':
            return Response([])
        
        # Pendientes = SOLO facturas sin responsable en estado Recibida
        # (facturas nuevas que vienen del proveedor y deben ser procesadas)
        pendientes = models.Factura.objects.filter(
            usuario_responsable__isnull=True, 
            estado='Recibida'
        ).order_by('-fecha_recepcion', '-id')
        
        serializer = serializers.FacturaListSerializer(pendientes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de facturas"""
        total = models.Factura.objects.count()
        por_estado = {}
        estados = [choice[0] for choice in models.Factura.ESTADO_CHOICES]
        
        for estado in estados:
            count = models.Factura.objects.filter(estado=estado).count()
            if count > 0:
                por_estado[estado] = count

        vencidas = models.Factura.objects.filter(indicador_riesgo='vencida').count()
        atrasadas = models.Factura.objects.filter(indicador_riesgo='atrasada').count()

        return Response({
            'total_facturas': total,
            'por_estado': por_estado,
            'vencidas': vencidas,
            'atrasadas': atrasadas
        })

    @action(detail=True, methods=['get'])
    def seguimiento(self, request, pk=None):
        """Obtener seguimiento completo de una factura"""
        factura = self.get_object()
        ctx = {'request': request}
        return Response({
            'factura': serializers.FacturaDetailSerializer(factura, context=ctx).data,
            'historial': serializers.HistorialFacturaSerializer(
                factura.historial.all(), many=True, context=ctx
            ).data,
            'comentarios': serializers.ComentarioFacturaSerializer(
                factura.comentarios.all(), many=True, context=ctx
            ).data
        })

    @action(detail=True, methods=['patch'], url_path='completar_registro')
    def completar_registro(self, request, pk=None):
        """Completar registro de una factura pendiente (desde Mis Pendientes)"""
        factura = self.get_object()
        estado_anterior = factura.estado
        
        # Permitir facturas en estado 'Recibida', 'Registrada' o 'Devuelta' para reproceso.
        if factura.estado not in ['Recibida', 'Registrada', 'Devuelta']:
            return Response(
                {'error': f'Solo se pueden completar facturas en estado Recibida, Registrada o Devuelta. Estado actual: {factura.estado}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Permitir actualización de campos específicos sin validaciones estrictas
        serializer = serializers.FacturaDetailSerializer(
            factura, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            # Cambiar estado a 'Registrada' al completar el registro
            factura.estado = 'Registrada'
            # Asignar responsable si no está asignado
            if not factura.usuario_responsable:
                factura.usuario_responsable = request.user
            
            serializer.save()
            factura.save(update_fields=['estado', 'usuario_responsable'])
            
            # Crear registro en historial
            from .models import HistorialFactura
            HistorialFactura.objects.create(
                factura=factura,
                accion='Completar Registro',
                estado_anterior=estado_anterior,
                estado_nuevo='Registrada',
                usuario=request.user,
                usuario_nombre=request.user.get_full_name() or request.user.username,
                usuario_rol='Funcionario',
                observacion='Factura registrada correctamente por el funcionario'
            )

            self._notificar_transicion(factura, estado_anterior, 'Registrada')
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
