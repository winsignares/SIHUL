"""ViewSet de facturas: configuración común, consulta base y acciones de cada etapa."""
from rest_framework import viewsets, filters, parsers, status
from rest_framework.response import Response
from ...permissions import EsUsuarioFinanciero
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from ... import flujo_factura, models, serializers
from ...sla import build_parametros_sla_map
from ...documentos_sensibles import (
    documento_es_sensible as _documento_es_sensible,
    usuario_puede_ver_documentos_sensibles as _usuario_puede_ver_documentos_sensibles,
)
from ..archivos_documentos import _documentos_queryset_ciclo_actual
from .consultas import ConsultasFactura
from .documentos import DocumentosFactura
from .registro import RegistroFactura
from .contabilidad import ContabilidadFactura
from .auditoria import AuditoriaFactura
from .direccion_rectoria import DireccionRectoriaFactura
from .tesoreria import TesoreriaFactura
from .devolucion import DevolucionFactura


class FacturaPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class FacturaViewSet(
    ConsultasFactura,
    DocumentosFactura,
    RegistroFactura,
    ContabilidadFactura,
    AuditoriaFactura,
    DireccionRectoriaFactura,
    TesoreriaFactura,
    DevolucionFactura,
    viewsets.ModelViewSet,
):
    permission_classes = [EsUsuarioFinanciero]
    pagination_class = FacturaPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'indicador_riesgo', 'proveedor', 'departamento', 'urgente']
    search_fields = ['numero_factura', 'numero_radicado', 'proveedor__razon_social']
    ordering_fields = ['fecha_recepcion', 'valor_total', 'estado']
    ordering = ['-fecha_recepcion']
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]


    def get_queryset(self):
        user = self.request.user
        queryset = models.Factura.objects.all()

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

    def _aplicar_paso(self, request, paso):
        """Aplica un paso de flujo_factura a la factura y responde su detalle, o el error del paso."""
        factura = self.get_object()
        try:
            paso(factura, request.user, request.data)
        except flujo_factura.PasoRechazado as rechazo:
            return Response(rechazo.respuesta, status=rechazo.codigo)
        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )

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
        return serializers.FacturaDetailSerializer(
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
            return serializers.FacturaDetailSerializer
        elif self.action == 'create':
            return serializers.FacturaCreateSerializer
        elif self.action == 'list':
            return serializers.FacturaListSerializer
        return serializers.FacturaDetailSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action == 'list':
            context['parametros_map'] = build_parametros_sla_map()
        return context

    def perform_create(self, serializer):
        factura = serializer.save(creado_por=self.request.user)
        flujo_factura.registrar_creacion(factura, self.request.user)
