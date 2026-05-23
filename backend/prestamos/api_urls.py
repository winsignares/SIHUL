from django.urls import path

from .api_views import (
    PublicAccessRecaptchaVerifyAPIView,
    PrestamoEspacioDetailAPIView,
    PrestamoEspacioListCreateAPIView,
    PrestamoEspacioPublicoDetailAPIView,
    PrestamoEspacioPublicoListCreateAPIView,
    PrestamoRecursoDetailAPIView,
    PrestamoRecursoListCreateAPIView,
    TipoActividadDetailAPIView,
    TipoActividadListCreateAPIView,
    SupervisorEspaciosPermitidosPrestamosAPIView,
)
from .views import list_espacios_disponibles_publico

urlpatterns = [
    path('tipos-actividad/', TipoActividadListCreateAPIView.as_view(), name='api-tipo-actividad-list-create'),
    path('tipos-actividad/<int:pk>/', TipoActividadDetailAPIView.as_view(), name='api-tipo-actividad-detail'),
    path('public/espacios-disponibles/', list_espacios_disponibles_publico, name='api-public-espacios-disponibles'),
    path('public/recaptcha/', PublicAccessRecaptchaVerifyAPIView.as_view(), name='api-public-recaptcha-verify'),
    path('espacios/', PrestamoEspacioListCreateAPIView.as_view(), name='api-prestamo-espacio-list-create'),
    path('espacios/<int:pk>/', PrestamoEspacioDetailAPIView.as_view(), name='api-prestamo-espacio-detail'),
    path('supervisor/espacios-prestamos/', SupervisorEspaciosPermitidosPrestamosAPIView.as_view(), name='api-supervisor-espacios-prestamos'),
    path('publicos/', PrestamoEspacioPublicoListCreateAPIView.as_view(), name='api-prestamo-publico-list-create'),
    path('publicos/<int:pk>/', PrestamoEspacioPublicoDetailAPIView.as_view(), name='api-prestamo-publico-detail'),
    path('recursos/', PrestamoRecursoListCreateAPIView.as_view(), name='api-prestamo-recurso-list-create'),
    path('recursos/<int:pk>/', PrestamoRecursoDetailAPIView.as_view(), name='api-prestamo-recurso-detail'),
]
