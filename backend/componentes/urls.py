from django.urls import path
from .views import (
    create_componente,
    list_componentes,
    retrieve_componente,
    update_componente,
    delete_componente,
    create_componente_rol,
    list_componente_roles,
    retrieve_componente_rol,
    update_componente_rol,
    delete_componente_rol,
)

urlpatterns = [
    # Componente routes
    path('', create_componente, name='create_componente'),
    path('list/', list_componentes, name='list_componentes'),
    path('<int:id>/', retrieve_componente, name='retrieve_componente'),
    path('update/', update_componente, name='update_componente'),
    path('delete/', delete_componente, name='delete_componente'),
    
    # ComponenteRol routes
    path('rol/', create_componente_rol, name='create_componente_rol'),
    path('rol/list/', list_componente_roles, name='list_componente_roles'),
    path('rol/<int:id>/', retrieve_componente_rol, name='retrieve_componente_rol'),
    path('rol/update/', update_componente_rol, name='update_componente_rol'),
    path('rol/delete/', delete_componente_rol, name='delete_componente_rol'),
]
