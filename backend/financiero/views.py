from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from . import models, serializers


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


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = models.Departamento.objects.all()
    serializer_class = serializers.DepartamentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']


class CuentaContableViewSet(viewsets.ModelViewSet):
    queryset = models.CuentaContable.objects.all()
    serializer_class = serializers.CuentaContableSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo_cuenta', 'nivel', 'estado']
    search_fields = ['codigo', 'nombre']


class CentroCostoViewSet(viewsets.ModelViewSet):
    queryset = models.CentroCosto.objects.all()
    serializer_class = serializers.CentroCostoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']


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

    def get_queryset(self):
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            return models.DocumentoAdjunto.objects.filter(factura_id=factura_id)
        return models.DocumentoAdjunto.objects.all()

    def perform_create(self, serializer):
        serializer.save(cargado_por=self.request.user)


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

    def get_queryset(self):
        user = self.request.user
        # Filtrar según rol del usuario
        queryset = models.Factura.objects.all()
        
        # TODO: Implementar lógica de filtrado por rol
        # if user.rol.nombre == 'Funcionario':
        #     queryset = queryset.filter(estado='Recibida')
        
        return queryset

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
        
        # Crear entrada en historial
        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura registrada',
            estado_nuevo='Recibida',
            usuario=self.request.user,
            usuario_nombre=self.request.user.nombre,
            usuario_rol=self.request.user.rol.nombre if self.request.user.rol else 'Sin rol'
        )

    @action(detail=True, methods=['post'])
    def radicar(self, request, pk=None):
        """Radicar una factura"""
        factura = self.get_object()
        
        if factura.estado != 'Recibida':
            return Response(
                {'error': 'La factura debe estar en estado Recibida'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        factura.estado = 'Radicada'
        factura.fecha_radicacion = timezone.now().date()
        factura.numero_radicado = f"RAD-{factura.id:06d}"
        factura.etapa_actual = 'Radicación'
        factura.usuario_responsable = request.user
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura radicada',
            estado_anterior='Recibida',
            estado_nuevo='Radicada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol'
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
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol'
        )

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def alistar(self, request, pk=None):
        """Alistar una factura"""
        factura = self.get_object()
        
        if factura.estado != 'Causada':
            return Response(
                {'error': 'La factura debe estar causada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        factura.estado = 'Alistada'
        factura.fecha_alistamiento = timezone.now().date()
        factura.etapa_actual = 'Alistamiento'
        factura.usuario_responsable = request.user
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura alistada',
            estado_anterior='Causada',
            estado_nuevo='Alistada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol'
        )

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar una factura con motivo"""
        factura = self.get_object()
        motivo = request.data.get('motivo', 'Sin especificar')
        
        models.RechazoDevolucion.objects.create(
            factura=factura,
            tipo='Rechazo',
            etapa_rechazo=factura.etapa_actual,
            motivo=motivo,
            estado_devolucion='Pendiente Corrección',
            usuario_rechaza=request.user
        )

        factura.estado = 'Devuelta'
        factura.etapa_actual = 'Devolución'
        factura.usuario_responsable = None
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura devuelta',
            estado_anterior=factura.estado,
            estado_nuevo='Devuelta',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=motivo
        )

        return Response(
            {'mensaje': 'Factura rechazada y devuelta'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Obtener facturas pendientes del usuario"""
        user = request.user
        pendientes = models.Factura.objects.filter(
            usuario_responsable=user,
            estado__in=['Recibida', 'Radicada', 'Causada', 'Alistada']
        )
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
        return Response({
            'factura': serializers.FacturaDetailSerializer(factura).data,
            'historial': serializers.HistorialFacturaSerializer(
                factura.historial.all(), 
                many=True
            ).data,
            'comentarios': serializers.ComentarioFacturaSerializer(
                factura.comentarios.all(),
                many=True
            ).data
        })
