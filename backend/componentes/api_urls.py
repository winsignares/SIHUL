from django.urls import path

from .api_views import (
    ComponenteDetailAPIView,
    ComponenteListCreateAPIView,
    ComponenteRolDetailAPIView,
    ComponenteRolListCreateAPIView,
)

urlpatterns = [
    path('', ComponenteListCreateAPIView.as_view(), name='api-componente-list-create'),
    path('<int:pk>/', ComponenteDetailAPIView.as_view(), name='api-componente-detail'),
    path('roles/', ComponenteRolListCreateAPIView.as_view(), name='api-componente-rol-list-create'),
    path('roles/<int:pk>/', ComponenteRolDetailAPIView.as_view(), name='api-componente-rol-detail'),
]
