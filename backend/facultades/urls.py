from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_facultad, name='create_facultad'),
    path('update/', views.update_facultad, name='update_facultad'),
    path('delete/', views.delete_facultad, name='delete_facultad'),
    path('<int:id>/', views.get_facultad, name='get_facultad'),
    path('list/', views.list_facultades, name='list_facultades'),
]