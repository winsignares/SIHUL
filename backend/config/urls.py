from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, re_path, include
from django.views.static import serve
from rest_framework.routers import DefaultRouter

from config.api_views import (
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
    RecursoViewSet,
    EspacioRecursoViewSet,
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
router.register(r'recursos', RecursoViewSet, basename='recurso-api')
router.register(r'espacios-recursos', EspacioRecursoViewSet, basename='espacio-recurso-api')
router.register(r'roles', RolViewSet, basename='rol-api')
router.register(r'usuarios', UsuarioViewSet, basename='usuario-api')

urlpatterns = [
    path('panel-sihul-gestion/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('config.auth_urls')),
    path('api/periodos/', include('unispace.periodos.api_urls')),
    path('api/componentes/', include('unispace.componentes.api_urls')),
    path('api/prestamos/', include('unispace.prestamos.api_urls')),
    path('api/chatbot/', include('chatbot.api_urls')),
    path('api/notificaciones/', include('unispace.notificaciones.api_urls')),
    path('api/financiero/', include('financiero.urls')),  # Rutas API Financiero
    path('usuarios/', include('unispace.usuarios.urls')),
    path('sedes/', include('unispace.sedes.urls')),
    path('facultades/', include('unispace.facultades.urls')),
    path('programas/', include('unispace.programas.urls')),
    path('periodos/', include('unispace.periodos.urls')),
    path('grupos/', include('unispace.grupos.urls')),
    path('asignaturas/', include('unispace.asignaturas.urls')),
    path('espacios/', include('unispace.espacios.urls')),
    path('recursos/', include('unispace.recursos.urls')),
    path('componentes/', include('unispace.componentes.urls')),
    path('horario/', include('unispace.horario.urls')),
    path('prestamos/', include('unispace.prestamos.urls')),
    path('chatbot/', include('chatbot.urls')),
    path('notificaciones/', include('unispace.notificaciones.urls')),
]

if settings.MICROSOFT_OAUTH_ENABLED:
    urlpatterns.insert(1, path('accounts/', include('allauth.urls')))

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# En local corremos gunicorn dentro de Docker sin nginx delante, así que nadie
# sirve /static/. En producción nginx toma ese rol (ver deploy/nginx/sihul.conf), por eso
# esto solo se activa con DEBUG=True.
if settings.DEBUG:
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
    ]
