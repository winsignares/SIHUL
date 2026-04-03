from django.urls import path

from .api_views import (
    AgenteDetailAPIView,
    AgenteListCreateAPIView,
    ConversacionDetailAPIView,
    ConversacionListCreateAPIView,
    PreguntaSugeridaDetailAPIView,
    PreguntaSugeridaListCreateAPIView,
)

urlpatterns = [
    path('agentes/', AgenteListCreateAPIView.as_view(), name='api-agente-list-create'),
    path('agentes/<int:pk>/', AgenteDetailAPIView.as_view(), name='api-agente-detail'),
    path('preguntas/', PreguntaSugeridaListCreateAPIView.as_view(), name='api-pregunta-list-create'),
    path('preguntas/<int:pk>/', PreguntaSugeridaDetailAPIView.as_view(), name='api-pregunta-detail'),
    path('conversaciones/', ConversacionListCreateAPIView.as_view(), name='api-conversacion-list-create'),
    path('conversaciones/<int:pk>/', ConversacionDetailAPIView.as_view(), name='api-conversacion-detail'),
]
