from django.urls import path
from . import views

urlpatterns = [
    # TipoEspacio routes
    path('tipos/list/', views.list_tipos_espacio, name='list_tipos_espacio'),
    path('tipos/<int:id>/', views.get_tipo_espacio, name='get_tipo_espacio'),
    
    # EspacioFisico routes
    path('', views.create_espacio, name='create_espacio'),
    path('update/', views.update_espacio, name='update_espacio'),
    path('delete/', views.delete_espacio, name='delete_espacio'),
    path('<int:id>/', views.get_espacio, name='get_espacio'),
    path('list/', views.list_espacios, name='list_espacios'),
    
    # EspacioPermitido routes
    path('permitido/', views.create_espacio_permitido, name='create_espacio_permitido'),
    path('permitido/list/', views.list_espacios_permitidos, name='list_espacios_permitidos'),
    path('permitido/<int:id>/', views.get_espacio_permitido, name='get_espacio_permitido'),
    path('permitido/delete/', views.delete_espacio_permitido, name='delete_espacio_permitido'),
    path('permitido/usuario/<int:usuario_id>/', views.list_espacios_by_usuario, name='list_espacios_by_usuario'),
]