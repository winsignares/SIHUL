from django.urls import path
from .views import (
    create_componente,
    list_componentes,
    retrieve_componente,
    update_componente,
    delete_componente
)

urlpatterns = [
    path('', create_componente, name='create_componente'),
    path('list/', list_componentes, name='list_componentes'),
    path('<int:id>/', retrieve_componente, name='retrieve_componente'),
    path('update/', update_componente, name='update_componente'),
    path('delete/', delete_componente, name='delete_componente'),
]
