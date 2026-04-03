from django.urls import path

from .api_views import (
    PrestamoEspacioDetailAPIView,
    PrestamoEspacioListCreateAPIView,
    PrestamoEspacioPublicoDetailAPIView,
    PrestamoEspacioPublicoListCreateAPIView,
    PrestamoRecursoDetailAPIView,
    PrestamoRecursoListCreateAPIView,
    TipoActividadDetailAPIView,
    TipoActividadListCreateAPIView,
)

urlpatterns = [
    path('tipos-actividad/', TipoActividadListCreateAPIView.as_view(), name='api-tipo-actividad-list-create'),
    path('tipos-actividad/<int:pk>/', TipoActividadDetailAPIView.as_view(), name='api-tipo-actividad-detail'),
    path('espacios/', PrestamoEspacioListCreateAPIView.as_view(), name='api-prestamo-espacio-list-create'),
    path('espacios/<int:pk>/', PrestamoEspacioDetailAPIView.as_view(), name='api-prestamo-espacio-detail'),
    path('publicos/', PrestamoEspacioPublicoListCreateAPIView.as_view(), name='api-prestamo-publico-list-create'),
    path('publicos/<int:pk>/', PrestamoEspacioPublicoDetailAPIView.as_view(), name='api-prestamo-publico-detail'),
    path('recursos/', PrestamoRecursoListCreateAPIView.as_view(), name='api-prestamo-recurso-list-create'),
    path('recursos/<int:pk>/', PrestamoRecursoDetailAPIView.as_view(), name='api-prestamo-recurso-detail'),
]
