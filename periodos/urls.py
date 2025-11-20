from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_periodo, name='create_periodo'),
    path('update/', views.update_periodo, name='update_periodo'),
    path('delete/', views.delete_periodo, name='delete_periodo'),
    path('<int:id>/', views.get_periodo, name='get_periodo'),
    path('list/', views.list_periodos, name='list_periodos'),
]