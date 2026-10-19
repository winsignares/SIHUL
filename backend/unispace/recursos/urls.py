from django.urls import path
from . import views

urlpatterns = [
    # Recurso endpoints
    path('', views.create_recurso, name='create_recurso'),
    path('update/', views.update_recurso, name='update_recurso'),
    path('delete/', views.delete_recurso, name='delete_recurso'),
    path('<int:id>/', views.get_recurso, name='get_recurso'),
    path('list/', views.list_recursos, name='list_recursos'),
    
    # EspacioRecurso endpoints
    path('espacio-recurso/', views.create_espacio_recurso, name='create_espacio_recurso'),
    path('espacio-recurso/update/', views.update_espacio_recurso, name='update_espacio_recurso'),
    path('espacio-recurso/delete/', views.delete_espacio_recurso, name='delete_espacio_recurso'),
    path('espacio-recurso/<int:espacio_id>/<int:recurso_id>/', views.get_espacio_recurso, name='get_espacio_recurso'),
    path('espacio-recurso/list/', views.list_espacio_recursos, name='list_espacio_recursos'),
]