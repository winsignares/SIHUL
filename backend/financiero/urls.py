from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Crear router
router = DefaultRouter()
router.register(r'proveedores', views.ProveedorViewSet, basename='proveedor')
router.register(r'departamentos', views.DepartamentoViewSet, basename='departamento')
router.register(r'cuentas-contables', views.CuentaContableViewSet, basename='cuenta-contable')
router.register(r'centros-costo', views.CentroCostoViewSet, basename='centro-costo')
router.register(r'parametros-sla', views.ParametroSLAViewSet, basename='parametro-sla')
router.register(r'parametros-financiero', views.ParametrosFinancieroViewSet, basename='parametro-financiero')
router.register(r'reportes', views.ReporteGeneradoViewSet, basename='reporte')
router.register(r'documentos', views.DocumentoAdjuntoViewSet, basename='documento')
router.register(r'historial', views.HistorialFacturaViewSet, basename='historial')
router.register(r'comentarios', views.ComentarioFacturaViewSet, basename='comentario')
router.register(r'rechazos', views.RechazoDevolacionViewSet, basename='rechazo')
router.register(r'facturas', views.FacturaViewSet, basename='factura')
router.register(r'bancos', views.BancoViewSet, basename='banco')
router.register(r'tipos-cuenta', views.TipoCuentaViewSet, basename='tipo-cuenta')

app_name = 'financiero'

urlpatterns = [
    path('', include(router.urls)),
]
