"""Etapa de auditoría: aprobar, rechazar y enviar a dirección financiera."""
from rest_framework.decorators import action
from ... import flujo_factura


class AuditoriaFactura:
    """Etapa de auditoría: aprobar, rechazar y enviar a dirección financiera."""

    @action(detail=True, methods=['post'], url_path='aprobar_auditoria')
    def aprobar_auditoria(self, request, pk=None):
        """Aprobar una factura en control previo de auditoría."""
        return self._aplicar_paso(request, flujo_factura.aprobar_auditoria)

    @action(detail=True, methods=['post'], url_path='rechazar_auditoria')
    def rechazar_auditoria(self, request, pk=None):
        """Rechazar una factura en auditoría y devolverla a tesorería."""
        return self._aplicar_paso(request, flujo_factura.rechazar_auditoria)

    @action(detail=True, methods=['post'], url_path='enviar_direccion_financiera')
    def enviar_direccion_financiera(self, request, pk=None):
        """Enviar una factura aprobada a Dirección Financiera."""
        return self._aplicar_paso(request, flujo_factura.enviar_direccion_financiera)
