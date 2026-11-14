from django.urls import path

from .administracion import (
    ChatbotDocumentoPrioridadProxyView,
    ChatbotDocumentoArchivoView,
    ChatbotDocumentoDetalleProxyView,
    ChatbotDocumentosProxyView,
    ChatbotSedesProxyView,
    ResponsablesCandidatosView,
)
from .preguntas_respuestas import (
    AnexoDescargaView,
    PreguntaRespuestaDetalleView,
    PreguntasRespuestasView,
)
from .agentes import (
    AnexosEnlacesView,
    SeccionalesChatbotView,
    TokenDirectoView,
    AgenteDetailAPIView,
    AgenteListCreateAPIView,
    ConversacionDetailAPIView,
    ConversacionListCreateAPIView,
    PreguntaSugeridaDetailAPIView,
    PreguntaSugeridaListCreateAPIView,
)
from .chat import (
    EnviarPreguntaView,
    EnviarPreguntaPublicoView,
    DesafioPublicoView,
    SesionPublicaView,
    ListAgentesPublicoView,
    ObtenerHistorialView,
)

urlpatterns = [
    # Endpoints privados (requieren autenticacion)
    path('agentes/', AgenteListCreateAPIView.as_view(), name='api-agente-list-create'),
    path('seccionales/', SeccionalesChatbotView.as_view(), name='api-chatbot-seccionales'),
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

    # Acceso directo al servicio del chatbot: token firmado y enlaces de los anexos que entrega (ver acceso_directo.py)
    path('token/', TokenDirectoView.as_view(), name='api-chatbot-token'),
    path('anexos/enlaces/', AnexosEnlacesView.as_view(), name='api-anexos-enlaces'),

    # Endpoints publicos (sin autenticacion)
    path('public/desafio/', DesafioPublicoView.as_view(), name='api-public-desafio'),
    path('public/sesion/', SesionPublicaView.as_view(), name='api-public-sesion'),
    path('public/agentes/', ListAgentesPublicoView.as_view(), name='api-public-agentes'),
    path('public/pregunta/', EnviarPreguntaPublicoView.as_view(), name='api-public-pregunta'),

    # Endpoints legacy usados por el frontend
    path('pregunta/', EnviarPreguntaView.as_view(), name='api-legacy-pregunta'),
    path('historial/', ObtenerHistorialView.as_view(), name='api-legacy-historial'),
]