from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_prestamo, name='create_prestamo'),
    path('update/', views.update_prestamo, name='update_prestamo'),
    path('delete/', views.delete_prestamo, name='delete_prestamo'),
    path('<int:id>/', views.get_prestamo, name='get_prestamo'),
    path('list/', views.list_prestamos, name='list_prestamos'),
]