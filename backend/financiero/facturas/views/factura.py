from rest_framework import viewsets
from .factura_aprobacion import FacturaAprobacionMixin
from .factura_base import FacturaBaseMixin
from .factura_consultas import FacturaConsultasMixin
from .factura_pdf import FacturaPdfMixin
from .factura_registro import FacturaRegistroMixin
from .factura_tesoreria import FacturaTesoreriaMixin


class FacturaViewSet(
    FacturaRegistroMixin,
    FacturaAprobacionMixin,
    FacturaTesoreriaMixin,
    FacturaConsultasMixin,
    FacturaPdfMixin,
    FacturaBaseMixin,
    viewsets.ModelViewSet,
):
    """Facturas: ciclo de vida completo. La logica esta repartida en mixins por flujo."""
