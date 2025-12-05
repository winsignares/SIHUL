from django.urls import path
from . import views

urlpatterns = [
    # Prestamo endpoints
    path('', views.create_prestamo, name='create_prestamo'),
    path('update/', views.update_prestamo, name='update_prestamo'),
    path('delete/', views.delete_prestamo, name='delete_prestamo'),
    path('<int:id>/', views.get_prestamo, name='get_prestamo'),
    path('list/', views.list_prestamos, name='list_prestamos'),
    path('list/todos/', views.list_prestamos_todos_admin, name='list_prestamos_todos_admin'),  # Combina auth + públicos
    path('usuario/<int:usuario_id>/', views.list_prestamos_by_user, name='list_prestamos_by_user'),
    
    # TipoActividad endpoints
    path('tipos-actividad/', views.list_tipos_actividad, name='list_tipos_actividad'),
    path('tipos-actividad/create/', views.create_tipo_actividad, name='create_tipo_actividad'),
    
    # Endpoints públicos
    path('public/solicitar/', views.create_prestamo_publico, name='create_prestamo_publico'),
    path('public/espacios-disponibles/', views.list_espacios_disponibles_publico, name='list_espacios_disponibles_publico'),
    path('public/<int:id>/', views.get_prestamo_publico, name='get_prestamo_publico'),
    path('public/update/', views.update_prestamo_publico, name='update_prestamo_publico'),
]