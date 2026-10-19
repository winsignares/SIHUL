from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_sede, name='create_sede'),
    path('update/', views.update_sede, name='update_sede'),
    path('delete/', views.delete_sede, name='delete_sede'),
    path('<int:id>/', views.get_sede, name='get_sede'),
    path('list/', views.list_sedes, name='list_sedes'),
]