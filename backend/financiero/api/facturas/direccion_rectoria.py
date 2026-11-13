"""Etapas de dirección financiera y rectoría."""
from rest_framework.decorators import action
from ... import flujo_factura


class DireccionRectoriaFactura:
    """Etapas de dirección financiera y rectoría."""

    @action(detail=True, methods=['post'], url_path='cargar_direccion_financiera')
    def cargar_direccion_financiera(self, request, pk=None):
        """Registrar el cargue formal en Dirección Financiera antes de rectoría."""
        return self._aplicar_paso(request, flujo_factura.cargar_direccion_financiera)

    @action(detail=True, methods=['post'], url_path='enviar_rectoria')
    def enviar_rectoria(self, request, pk=None):
        """Enviar una factura cargada a Rectoría para autorización final."""
        return self._aplicar_paso(request, flujo_factura.enviar_rectoria)

    @action(detail=True, methods=['post'], url_path='autorizar_rectoria')
    def autorizar_rectoria(self, request, pk=None):
        """Autorizar una factura desde Rectoría para continuar con tesorería."""
        return self._aplicar_paso(request, flujo_factura.autorizar_rectoria)

    @action(detail=True, methods=['post'], url_path='rechazar_rectoria')
    def rechazar_rectoria(self, request, pk=None):
        """Rechazar una factura desde Rectoría y devolverla a Dirección Financiera."""
        return self._aplicar_paso(request, flujo_factura.rechazar_rectoria)
