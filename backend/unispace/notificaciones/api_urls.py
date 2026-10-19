from django.urls import path

from .api_views import (
    NotificacionDetailAPIView,
    NotificacionEstadisticasAPIView,
    NotificacionListAPIView,
    NotificacionListCreateAPIView,
    NotificacionMarcarLeidaAPIView,
    NotificacionMarcarTodasLeidasAPIView,
    NotificacionMisNotificacionesAPIView,
)

urlpatterns = [
    path('', NotificacionListCreateAPIView.as_view(), name='api-notificacion-list-create'),
    path('list/', NotificacionListAPIView.as_view(), name='api-notificacion-list'),
    path('estadisticas/', NotificacionEstadisticasAPIView.as_view(), name='api-notificacion-estadisticas'),
    path('mis-notificaciones/', NotificacionMisNotificacionesAPIView.as_view(), name='api-notificacion-mis-notificaciones'),
    path('marcar-leida/<int:id>/', NotificacionMarcarLeidaAPIView.as_view(), name='api-notificacion-marcar-leida'),
    path('marcar-todas-leidas/', NotificacionMarcarTodasLeidasAPIView.as_view(), name='api-notificacion-marcar-todas-leidas'),
    path('<int:pk>/', NotificacionDetailAPIView.as_view(), name='api-notificacion-detail'),
]
