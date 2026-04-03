from django.urls import path

from .api_views import (
    EspacioRecursoByIdsAPIView,
    EspacioRecursoDetailAPIView,
    EspacioRecursoListCreateAPIView,
    RecursoDetailAPIView,
    RecursoListCreateAPIView,
)

urlpatterns = [
    path('', RecursoListCreateAPIView.as_view(), name='api-recurso-list-create'),
    path('<int:pk>/', RecursoDetailAPIView.as_view(), name='api-recurso-detail'),
    path('espacios-recursos/', EspacioRecursoListCreateAPIView.as_view(), name='api-espacio-recurso-list-create'),
    path('espacios-recursos/<int:pk>/', EspacioRecursoDetailAPIView.as_view(), name='api-espacio-recurso-detail'),
    path(
        'espacios-recursos/por-ids/<int:espacio_id>/<int:recurso_id>/',
        EspacioRecursoByIdsAPIView.as_view(),
        name='api-espacio-recurso-by-ids',
    ),
]
