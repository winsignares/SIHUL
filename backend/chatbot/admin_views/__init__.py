"""Vistas de administración de chatbots y su documentación."""
from .permisos import COMPONENTE_GESTION_CHATBOTS, COMPONENTE_DOCUMENTACION_CHATBOTS, PuedeGestionarChatbots, PuedeGestionarDocumentosChatbots, puede_todas_las_sedes, ids_chatbots_permitidos, _chatbot_permitido
from .proxy import _proxy_error_response, _forward_response
from .documentos import MAX_UPLOAD_MB, _sede_para_documentos, _datos_documento, _autorizar_documento, ChatbotDocumentosProxyView, ChatbotDocumentoDetalleProxyView, ChatbotDocumentoPrioridadProxyView, UsuarioAutenticado, ChatbotDocumentoArchivoView
from .catalogos import ChatbotSedesProxyView, ResponsablesCandidatosView
