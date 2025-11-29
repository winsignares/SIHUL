from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_programas, name='list_programas'),
    path('create/', views.create_programa, name='create_programa'),
    path('update/', views.update_programa, name='update_programa'),
    path('delete/', views.delete_programa, name='delete_programa'),
    path('<int:id>/', views.get_programa, name='get_programa'),
]