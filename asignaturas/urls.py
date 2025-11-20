from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_asignatura, name='create_asignatura'),
    path('update/', views.update_asignatura, name='update_asignatura'),
    path('delete/', views.delete_asignatura, name='delete_asignatura'),
    path('<int:id>/', views.get_asignatura, name='get_asignatura'),
    path('list/', views.list_asignaturas, name='list_asignaturas'),
]