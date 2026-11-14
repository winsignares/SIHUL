from django.urls import path

from .auth_views import ErrorClienteView, LoginSuccessView, LogoutView, UserView

urlpatterns = [
    path('user/', UserView.as_view(), name='auth_user'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('error-cliente/', ErrorClienteView.as_view(), name='auth_error_cliente'),
    path('login-success/', LoginSuccessView.as_view(), name='auth_login_success'),
]
