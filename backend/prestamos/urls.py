from django.urls import path
from . import views

urlpatterns = [
    # Prestamo endpoints
    path('', views.create_prestamo, name='create_prestamo'),
    path('update/', views.update_prestamo, name='update_prestamo'),
    path('delete/', views.delete_prestamo, name='delete_prestamo'),
    path('<int:id>/', views.get_prestamo, name='get_prestamo'),
    path('list/', views.list_prestamos, name='list_prestamos'),
    path('usuario/<int:usuario_id>/', views.list_prestamos_by_user, name='list_prestamos_by_user'),
    
    # TipoActividad endpoints
    path('tipos-actividad/', views.list_tipos_actividad, name='list_tipos_actividad'),
    path('tipos-actividad/create/', views.create_tipo_actividad, name='create_tipo_actividad'),
]