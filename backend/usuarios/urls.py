from django.urls import path
from . import views

urlpatterns = [
    # Rol endpoints
    path('roles/', views.create_rol, name='create_rol'),
    path('roles/update/', views.update_rol, name='update_rol'),
    path('roles/delete/', views.delete_rol, name='delete_rol'),
    path('roles/<int:id>/', views.get_rol, name='get_rol'),
    path('roles/list/', views.list_roles, name='list_roles'),
    
    # Usuario endpoints
    path('', views.create_usuario, name='create_usuario'),
    path('update/', views.update_usuario, name='update_usuario'),
    path('delete/', views.delete_usuario, name='delete_usuario'),
    path('<int:id>/', views.get_usuario, name='get_usuario'),
    path('list/', views.list_usuarios, name='list_usuarios'),
    path('login/', views.login, name='login_usuario'),
    path('logout/', views.logout, name='logout_usuario'),
    path('change-password/', views.change_password, name='change_password'),
]