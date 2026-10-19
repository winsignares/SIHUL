from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
import logging
from django_filters.rest_framework import DjangoFilterBackend

from financiero.facturas.models import ComentarioFactura, HistorialFactura, RechazoDevolucion
from financiero.facturas.serializers import ComentarioFacturaSerializer, HistorialFacturaSerializer, RechazoDevolacionSerializer



logger = logging.getLogger(__name__)


class HistorialFacturaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HistorialFacturaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['factura', 'accion']
    ordering = ['-fecha_accion']

    def get_queryset(self):
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            return HistorialFactura.objects.filter(factura_id=factura_id)
        return HistorialFactura.objects.all()


class ComentarioFacturaViewSet(viewsets.ModelViewSet):
    serializer_class = ComentarioFacturaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['factura', 'tipo']
    ordering = ['fecha_creacion']

    def get_queryset(self):
        queryset = ComentarioFactura.objects.select_related('usuario').prefetch_related(
            'respuestas__usuario', 'respuestas__respuestas__usuario',
        )
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            queryset = queryset.filter(factura_id=factura_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class RechazoDevolacionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RechazoDevolacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['factura', 'tipo', 'estado_devolucion']

    def get_queryset(self):
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            return RechazoDevolucion.objects.filter(factura_id=factura_id)
        return RechazoDevolucion.objects.all()
