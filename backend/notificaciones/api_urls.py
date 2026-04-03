from django.urls import path

from .api_views import NotificacionDetailAPIView, NotificacionListCreateAPIView

urlpatterns = [
    path('', NotificacionListCreateAPIView.as_view(), name='api-notificacion-list-create'),
    path('<int:pk>/', NotificacionDetailAPIView.as_view(), name='api-notificacion-detail'),
]
