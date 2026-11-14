from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.catalogos import BancoViewSet, CentroCostoViewSet, CiudadViewSet, CuentaContableViewSet, DepartamentoGeograficoViewSet, DepartamentoViewSet, PaisViewSet, TipoCuentaViewSet
from .api.documentos import DocumentoAdjuntoViewSet
from .api.facturas import FacturaViewSet
from .api.historial import ComentarioFacturaViewSet, HistorialFacturaViewSet, RechazoDevolacionViewSet
from .api.parametros import ParametroSLAViewSet, ParametrosFinancieroViewSet
from .api.proveedores import ProveedorViewSet
from .api.reportes import ReporteGeneradoViewSet

# Crear router
router = DefaultRouter()
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'paises', PaisViewSet, basename='pais')
router.register(r'departamentos-geograficos', DepartamentoGeograficoViewSet, basename='departamento-geografico')
router.register(r'ciudades', CiudadViewSet, basename='ciudad')
router.register(r'departamentos', DepartamentoViewSet, basename='departamento')
router.register(r'cuentas-contables', CuentaContableViewSet, basename='cuenta-contable')
router.register(r'centros-costo', CentroCostoViewSet, basename='centro-costo')
router.register(r'parametros-sla', ParametroSLAViewSet, basename='parametro-sla')
router.register(r'parametros-financiero', ParametrosFinancieroViewSet, basename='parametro-financiero')
router.register(r'reportes', ReporteGeneradoViewSet, basename='reporte')
router.register(r'documentos', DocumentoAdjuntoViewSet, basename='documento')
router.register(r'historial', HistorialFacturaViewSet, basename='historial')
router.register(r'comentarios', ComentarioFacturaViewSet, basename='comentario')
router.register(r'rechazos', RechazoDevolacionViewSet, basename='rechazo')
router.register(r'facturas', FacturaViewSet, basename='factura')
router.register(r'bancos', BancoViewSet, basename='banco')
router.register(r'tipos-cuenta', TipoCuentaViewSet, basename='tipo-cuenta')

app_name = 'financiero'

urlpatterns = [
    path('', include(router.urls)),
]
