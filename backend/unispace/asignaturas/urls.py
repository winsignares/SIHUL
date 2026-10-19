from django.urls import path
from . import views

urlpatterns = [
    # Asignatura endpoints
    path('', views.create_asignatura, name='create_asignatura'),
    path('update/', views.update_asignatura, name='update_asignatura'),
    path('delete/', views.delete_asignatura, name='delete_asignatura'),
    path('<int:id>/', views.get_asignatura, name='get_asignatura'),
    path('list/', views.list_asignaturas, name='list_asignaturas'),
    
    # AsignaturaPrograma endpoints
    path('programa/', views.create_asignatura_programa, name='create_asignatura_programa'),
    path('programa/update/', views.update_asignatura_programa, name='update_asignatura_programa'),
    path('programa/delete/', views.delete_asignatura_programa, name='delete_asignatura_programa'),
    path('programa/<int:id>/', views.get_asignatura_programa, name='get_asignatura_programa'),
    path('programa/list/', views.list_asignaturas_programa, name='list_asignaturas_programa'),
]