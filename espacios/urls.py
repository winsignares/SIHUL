from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_espacio, name='create_espacio'),
    path('update/', views.update_espacio, name='update_espacio'),
    path('delete/', views.delete_espacio, name='delete_espacio'),
    path('<int:id>/', views.get_espacio, name='get_espacio'),
    path('list/', views.list_espacios, name='list_espacios'),
]