from django.urls import path
from . import views

# Rutas de sesión. nginx las publica como /api/usuarios/<ruta>/ y las reescribe a /usuarios/<ruta>/
# (ver despliegue/nginx/). El resto de la gestión de usuarios y roles vive en /api/usuarios/ y /api/roles/.
urlpatterns = [
    path('login/', views.login, name='login_usuario'),
    path('logout/', views.logout, name='logout_usuario'),
    path('session-auth-state/', views.session_auth_state, name='session_auth_state'),
    path('change-password/', views.change_password, name='change_password'),
]
