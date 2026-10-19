from rest_framework.routers import DefaultRouter
from django.urls import path, include

from .proveedores.urls import registrations as _prov
from .contabilidad.urls import registrations as _cont
from .parametros.urls import registrations as _param
from .reportes.urls import registrations as _rep
from .facturas.urls import registrations as _fact

router = DefaultRouter()
for prefix, viewset, basename in (_prov + _cont + _param + _rep + _fact):
    router.register(prefix, viewset, basename=basename)

app_name = 'financiero'

urlpatterns = [
    path('', include(router.urls)),
]
