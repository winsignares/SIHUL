from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from mysite.api_views import (
    AsignaturaProgramaViewSet,
    AsignaturaViewSet,
    EspacioFisicoViewSet,
    EspacioPermitidoViewSet,
    FacultadViewSet,
    GrupoViewSet,
    HorarioEstudianteViewSet,
    HorarioFusionadoViewSet,
    HorarioViewSet,
    ProgramaViewSet,
    RolViewSet,
    SeccionalViewSet,
    SedeViewSet,
    SolicitudEspacioViewSet,
    TipoEspacioViewSet,
    UsuarioViewSet,
)

router = DefaultRouter()
router.register(r'seccionales', SeccionalViewSet, basename='seccional')
router.register(r'sedes', SedeViewSet, basename='sede-api')
router.register(r'facultades', FacultadViewSet, basename='facultad-api')
router.register(r'programas', ProgramaViewSet, basename='programa-api')
router.register(r'grupos', GrupoViewSet, basename='grupo-api')
router.register(r'asignaturas', AsignaturaViewSet, basename='asignatura-api')
router.register(r'asignaturas-programa', AsignaturaProgramaViewSet, basename='asignatura-programa-api')
router.register(r'tipos-espacio', TipoEspacioViewSet, basename='tipo-espacio-api')
router.register(r'espacios', EspacioFisicoViewSet, basename='espacio-api')
router.register(r'espacios-permitidos', EspacioPermitidoViewSet, basename='espacio-permitido-api')
router.register(r'horarios', HorarioViewSet, basename='horario-api')
router.register(r'horarios-fusionados', HorarioFusionadoViewSet, basename='horario-fusionado-api')
router.register(r'horarios-estudiante', HorarioEstudianteViewSet, basename='horario-estudiante-api')
router.register(r'solicitudes-espacio', SolicitudEspacioViewSet, basename='solicitud-espacio-api')
router.register(r'roles', RolViewSet, basename='rol-api')
router.register(r'usuarios', UsuarioViewSet, basename='usuario-api')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/periodos/', include('periodos.api_urls')),
    path('api/recursos/', include('recursos.api_urls')),
    path('api/componentes/', include('componentes.api_urls')),
    path('api/prestamos/', include('prestamos.api_urls')),
    path('api/chatbot/', include('chatbot.api_urls')),
    path('api/notificaciones/', include('notificaciones.api_urls')),
    path('usuarios/', include('usuarios.urls')),
    path('sedes/', include('sedes.urls')),
    path('facultades/', include('facultades.urls')),
    path('programas/', include('programas.urls')),
    path('periodos/', include('periodos.urls')),
    path('grupos/', include('grupos.urls')),
    path('asignaturas/', include('asignaturas.urls')),
    path('espacios/', include('espacios.urls')),
    path('recursos/', include('recursos.urls')),
    path('componentes/', include('componentes.urls')),
    path('horario/', include('horario.urls')),
    path('prestamos/', include('prestamos.urls')),
    path('chatbot/', include('chatbot.urls')),
    path('notificaciones/', include('notificaciones.urls')),
]
