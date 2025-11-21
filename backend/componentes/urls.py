from django.urls import path
from .views import (
    create_componente,
    list_componentes,
    retrieve_componente,
    update_componente,
    delete_componente
)

urlpatterns = [
    path('crear/', create_componente, name='create_componente'),
    path('listar/', list_componentes, name='list_componentes'),
    path('obtener/<int:id>/', retrieve_componente, name='retrieve_componente'),
    path('actualizar/', update_componente, name='update_componente'),
    path('eliminar/', delete_componente, name='delete_componente'),
]
