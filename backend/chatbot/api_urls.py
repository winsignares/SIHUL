from django.urls import path

from .admin_views import (
    ChatbotDocumentoPrioridadProxyView,
    ChatbotDocumentoArchivoView,
    ChatbotDocumentoDetalleProxyView,
    ChatbotDocumentosProxyView,
    ChatbotSedesProxyView,
    ResponsablesCandidatosView,
)
from .preguntas_respuestas_views import (
    AnexoDescargaView,
    PreguntaRespuestaDetalleView,
    PreguntasRespuestasView,
)
from .api_views import (
    AgenteDetailAPIView,
    AgenteListCreateAPIView,
    ConversacionDetailAPIView,
    ConversacionListCreateAPIView,
    PreguntaSugeridaDetailAPIView,
    PreguntaSugeridaListCreateAPIView,
)
from .views import (
    enviar_pregunta,
    enviar_pregunta_publico,
    list_agentes_publico,
    obtener_historial,
)

urlpatterns = [
    # Endpoints privados (requieren autenticacion)
    path('agentes/', AgenteListCreateAPIView.as_view(), name='api-agente-list-create'),
    path('agentes/<int:pk>/', AgenteDetailAPIView.as_view(), name='api-agente-detail'),
    path('preguntas/', PreguntaSugeridaListCreateAPIView.as_view(), name='api-pregunta-list-create'),
    path('preguntas/<int:pk>/', PreguntaSugeridaDetailAPIView.as_view(), name='api-pregunta-detail'),
    path('conversaciones/', ConversacionListCreateAPIView.as_view(), name='api-conversacion-list-create'),
    path('conversaciones/<int:pk>/', ConversacionDetailAPIView.as_view(), name='api-conversacion-detail'),

    # Gestión de documentos del RAG por chatbot/sede (proxy autenticado hacia FastAPI)
    path('admin/documentos/', ChatbotDocumentosProxyView.as_view(), name='api-admin-documentos'),
    path('admin/documentos/<int:pk>/', ChatbotDocumentoDetalleProxyView.as_view(), name='api-admin-documento-detalle'),
    path('admin/documentos/<int:pk>/prioridad/', ChatbotDocumentoPrioridadProxyView.as_view(), name='api-admin-documento-prioridad'),
    path('admin/sedes/', ChatbotSedesProxyView.as_view(), name='api-admin-sedes'),

    # Personas a las que se puede asignar la carga de documentación de un chatbot (búsqueda)
    path('responsables/candidatos/', ResponsablesCandidatosView.as_view(), name='api-responsables-candidatos'),

    # Preguntas-respuestas con anexos (documentos de soporte) por chatbot/sede
    path('admin/preguntas-respuestas/', PreguntasRespuestasView.as_view(), name='api-admin-preguntas-respuestas'),
    path('admin/preguntas-respuestas/<int:pk>/', PreguntaRespuestaDetalleView.as_view(), name='api-admin-pregunta-respuesta-detalle'),

    # Descarga de un anexo entregado en una respuesta (enlace firmado; también en el chat público)
    path('anexos/<int:pk>/descargar/', AnexoDescargaView.as_view(), name='api-anexo-descargar'),

    # PDF original citado en una respuesta (cualquier usuario autenticado, sede propia)
    path('documentos/archivo/', ChatbotDocumentoArchivoView.as_view(), name='api-documento-archivo'),

    # Endpoints publicos (sin autenticacion)
    path('public/agentes/', list_agentes_publico, name='api-public-agentes'),
    path('public/pregunta/', enviar_pregunta_publico, name='api-public-pregunta'),

    # Endpoints legacy usados por el frontend
    path('pregunta/', enviar_pregunta, name='api-legacy-pregunta'),
    path('historial/', obtener_historial, name='api-legacy-historial'),
]