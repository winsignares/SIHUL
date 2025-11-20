from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_grupo, name='create_grupo'),
    path('update/', views.update_grupo, name='update_grupo'),
    path('delete/', views.delete_grupo, name='delete_grupo'),
    path('<int:id>/', views.get_grupo, name='get_grupo'),
    path('list/', views.list_grupos, name='list_grupos'),
]