"""Vistas del chat: consulta al RAG, historial y acceso público."""
from ..sedes import FASTAPI_SEDES  # noqa: F401
from ..sedes import normalizar_sede as _normalize_sede_value  # noqa: F401
from .rag import RAG_ERROR_MESSAGE, fastapi_base_url, _fastapi_chat_url, _enviar_pregunta_fastapi, _consultar_rag  # noqa: F401
from .comunes import _resolve_user_sede_value, _anexos_de_respuesta, _registrar_uso_pregunta_sugerida, _agentes_activos_json  # noqa: F401
from .chat import enviar_pregunta, obtener_historial  # noqa: F401
from .publico import _rechazo_publico, desafio_publico, sesion_publica, list_agentes_publico, enviar_pregunta_publico  # noqa: F401
