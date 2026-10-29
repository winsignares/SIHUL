from django.urls import path

from .auth_views import error_cliente, login_success, logout_view, user_view

urlpatterns = [
    path('user/', user_view, name='auth_user'),
    path('logout/', logout_view, name='auth_logout'),
    path('error-cliente/', error_cliente, name='auth_error_cliente'),
    path('login-success/', login_success, name='auth_login_success'),
]
