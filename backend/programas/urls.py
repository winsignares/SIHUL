from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_programa, name='create_programa'),
    path('update/', views.update_programa, name='update_programa'),
    path('delete/', views.delete_programa, name='delete_programa'),
    path('<int:id>/', views.get_programa, name='get_programa'),
    path('list/', views.list_programas, name='list_programas'),
]