from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('usuarios/', include('usuarios.urls')),
    path('sedes/', include('sedes.urls')),
    path('facultades/', include('facultades.urls')),
    path('programas/', include('programas.urls')),
    path('periodos/', include('periodos.urls')),
    path('grupos/', include('grupos.urls')),
    path('asignaturas/', include('asignaturas.urls')),
    path('espacios/', include('espacios.urls')),
    path('recursos/', include('recursos.urls')),
    path('horario/', include('horario.urls')),
    path('prestamos/', include('prestamos.urls')),
]
