"""Conexión con el servicio de chat (FastAPI) y consulta del RAG."""
import logging
import requests
from django.conf import settings


logger = logging.getLogger(__name__)


# Lo que ve el usuario cuando el RAG no responde. El detalle técnico va al log, no
# a la respuesta ni al historial.
RAG_ERROR_MESSAGE = 'Lo siento, en este momento no puedo responder tu pregunta. Intenta de nuevo en unos minutos.'


def fastapi_base_url():
    return getattr(settings, 'CHATBOT_FASTAPI_URL', 'http://chatbot:8001/api/v1').rstrip('/')


def _fastapi_chat_url():
    return f"{fastapi_base_url()}/chat/ask"


def _enviar_pregunta_fastapi(nombre, chatbot_id, sede, pregunta, chat_id=None, id_usuario=None):
    response = requests.post(
        _fastapi_chat_url(),
        json={
            'nombre': nombre,
            'chatbot_id': chatbot_id,
            'sede': sede,
            'question': pregunta,
            'chat_id': str(chat_id) if chat_id else None,
            'id_usuario': id_usuario,
        },
        headers={'Content-Type': 'application/json'},
        timeout=30,
    )
    response.raise_for_status()
    return response


def _consultar_rag(nombre, chatbot_id, sede, pregunta, chat_id=None, id_usuario=None):
    """
    Pregunta al servicio RAG. Devuelve (respuesta, None, ids_de_anexos) o, si no se pudo
    obtener una respuesta válida, (RAG_ERROR_MESSAGE, código_de_error, []). Quien llama no
    debe guardar en el historial un intercambio que terminó en error.

    `ids_de_anexos` son los anexos (documentos de soporte) de la pregunta-respuesta
    registrada que corresponde a lo preguntado; vacío si no hay ninguna.
    """
    try:
        response = _enviar_pregunta_fastapi(nombre, chatbot_id, sede, pregunta, chat_id=chat_id, id_usuario=id_usuario)
        data = response.json()
    except requests.exceptions.RequestException:
        logger.warning('El servicio RAG no respondió correctamente', exc_info=True)
        return RAG_ERROR_MESSAGE, 'servicio_no_disponible', []
    except ValueError:
        logger.warning('El servicio RAG devolvió una respuesta que no es JSON', exc_info=True)
        return RAG_ERROR_MESSAGE, 'respuesta_invalida', []

    respuesta = data.get('answer') or data.get('respuesta')
    if not respuesta:
        logger.warning('El servicio RAG devolvió una respuesta vacía: %s', data)
        return RAG_ERROR_MESSAGE, 'respuesta_vacia', []
    ids_anexos = [a.get('id') for a in data.get('anexos') or [] if isinstance(a, dict) and isinstance(a.get('id'), int)]
    return respuesta, None, ids_anexos
