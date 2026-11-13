"""Documentos de los chatbots: listado, carga, prioridad, descarga y borrado."""
import requests
from django.http import HttpResponse
from mysite.auth_helpers import is_authenticated_user
from rest_framework import permissions
from rest_framework.parsers import FormParser
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import Agente
from ..models import ChatbotDocument
from ..views import _normalize_sede_value
from ..views import _resolve_user_sede_value
from ..views import fastapi_base_url
from .permisos import PuedeGestionarDocumentosChatbots
from .permisos import _chatbot_permitido
from .permisos import ids_chatbots_permitidos
from .permisos import puede_todas_las_sedes
from .proxy import _forward_response
from .proxy import _proxy_error_response


MAX_UPLOAD_MB = 25  # mismo tope que MAX_UPLOAD_MB del servicio RAG


def _sede_para_documentos(request, solicitada):
    """Seccional con la que se trabaja: la del propio usuario.

    Solo un admin global/de sistema puede indicar otra. Devuelve (sede, respuesta_de_error).
    """
    user = request.user
    propia = _resolve_user_sede_value(user)
    if solicitada:
        sede = _normalize_sede_value(solicitada)
        if not sede:
            return None, Response({'error': 'Sede no válida'}, status=400)
        if sede != propia and not puede_todas_las_sedes(user):
            return None, Response(
                {'error': 'Solo puedes gestionar la documentación de la seccional de tu usuario'}, status=403,
            )
        return sede, None
    if not propia:
        return None, Response({'error': 'El usuario no tiene seccional configurada'}, status=400)
    return propia, None


def _datos_documento(pk):
    """Chatbot y sede de un documento del RAG (la tabla la crea y mantiene FastAPI)."""
    return ChatbotDocument.objects.filter(pk=pk).values('chatbot_id', 'sede').first()


def _autorizar_documento(request, pk):
    """El documento debe ser de la seccional del usuario y de un chatbot que pueda gestionar.

    Devuelve (existe, respuesta_de_error). Si el documento no existe, `existe` es False y no
    hay error: el borrado es idempotente y la prioridad la rechaza el RAG con su 404.
    """
    datos = _datos_documento(pk)
    if datos is None:
        return False, None
    user = request.user
    if not puede_todas_las_sedes(user) and datos['sede'] != _resolve_user_sede_value(user):
        return True, Response({'error': 'Documento no encontrado'}, status=404)
    if not _chatbot_permitido(ids_chatbots_permitidos(request), datos['chatbot_id']):
        return True, Response({'error': 'No tienes asignado el chatbot de este documento'}, status=403)
    return True, None


class ChatbotDocumentosProxyView(APIView):
    """Lista y sube documentos del RAG (FastAPI), asociados a un chatbot y una sede."""

    permission_classes = [PuedeGestionarDocumentosChatbots]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        solicitada = request.query_params.get('sede')
        if not solicitada and puede_todas_las_sedes(request.user):
            sede = None  # un admin global sin filtro ve todas las seccionales
        else:
            sede, error = _sede_para_documentos(request, solicitada)
            if error:
                return error

        permitidos = ids_chatbots_permitidos(request)
        chatbot_id = request.query_params.get('chatbot_id')
        if chatbot_id and not _chatbot_permitido(permitidos, chatbot_id):
            return Response({'error': 'No tienes asignado este chatbot'}, status=403)

        params = {}
        if sede:
            params['sede'] = sede
        for key in ('chatbot_id', 'limit'):
            value = request.query_params.get(key)
            if value:
                params[key] = value

        try:
            resp = requests.get(f'{fastapi_base_url()}/documents/', params=params, timeout=30)
        except requests.exceptions.RequestException as exc:
            return _proxy_error_response(exc)

        if permitidos is not None and resp.status_code == 200:
            # Quien solo carga documentos ve únicamente los de sus chatbots asignados.
            try:
                datos = resp.json()
            except ValueError:
                datos = None
            if isinstance(datos, list):
                return Response([d for d in datos if _chatbot_permitido(permitidos, d.get('chatbot_id'))])
        return _forward_response(resp)

    def post(self, request):
        chatbot_id = request.data.get('chatbot_id')
        file_obj = request.FILES.get('file')
        replace_id = request.data.get('replace_document_id')

        if not chatbot_id or not file_obj:
            return Response({'error': 'chatbot_id y file son requeridos'}, status=400)
        # La seccional sale del usuario; solo un admin global puede indicar otra.
        sede, error = _sede_para_documentos(request, request.data.get('sede'))
        if error:
            return error
        if not _chatbot_permitido(ids_chatbots_permitidos(request), chatbot_id):
            return Response({'error': 'No tienes asignado este chatbot'}, status=403)
        agente = Agente.objects.filter(pk=int(chatbot_id)).first() if str(chatbot_id).isdigit() else None
        if agente and not agente.disponible_en(sede):
            return Response({'error': 'Este chatbot no está disponible en la seccional %s.' % sede}, status=400)
        if file_obj.size > MAX_UPLOAD_MB * 1024 * 1024:
            return Response({'error': f'El archivo supera el máximo de {MAX_UPLOAD_MB} MB.'}, status=413)

        try:
            resp = requests.post(
                f'{fastapi_base_url()}/documents/upload',
                params={'chatbot_id': chatbot_id, 'sede': sede, **({'replace_document_id': replace_id} if replace_id else {})},
                files={'file': (file_obj.name, file_obj.read(), file_obj.content_type)},
                timeout=120,
            )
        except requests.exceptions.RequestException as exc:
            return _proxy_error_response(exc)
        return _forward_response(resp)


class ChatbotDocumentoDetalleProxyView(APIView):
    """Elimina un documento (y sus chunks, por cascada) del RAG."""

    permission_classes = [PuedeGestionarDocumentosChatbots]

    def delete(self, request, pk):
        _, error = _autorizar_documento(request, pk)
        if error:
            return error
        try:
            resp = requests.delete(f'{fastapi_base_url()}/documents/{pk}', timeout=30)
        except requests.exceptions.RequestException as exc:
            return _proxy_error_response(exc)
        if resp.status_code == 404:
            # Borrado idempotente: si el documento ya no existe (p. ej. porque al subir
            # una nueva versión con el mismo nombre el RAG ya la reemplazó) el resultado
            # es el que se pedía.
            return Response(status=204)
        return _forward_response(resp)


class ChatbotDocumentoPrioridadProxyView(APIView):
    """Cambia la prioridad de un documento entre los de su chatbot y sede (1 = la más alta)."""

    permission_classes = [PuedeGestionarDocumentosChatbots]

    def patch(self, request, pk):
        _, error = _autorizar_documento(request, pk)
        if error:
            return error
        try:
            resp = requests.patch(
                f'{fastapi_base_url()}/documents/{pk}/priority',
                json={'prioridad': request.data.get('prioridad')},
                timeout=30,
            )
        except requests.exceptions.RequestException as exc:
            return _proxy_error_response(exc)
        return _forward_response(resp)


class UsuarioAutenticado(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_authenticated_user(request.user)


class ChatbotDocumentoArchivoView(APIView):
    """
    PDF original de un documento citado por un agente, para previsualizarlo desde el chat.
    El documento se busca por nombre entre los del agente en la sede DEL USUARIO (la misma
    con la que se le responde), así que nadie accede a documentos de otra sede.
    """

    permission_classes = [UsuarioAutenticado]

    def get(self, request):
        agente_id = request.query_params.get('agente')
        nombre = request.query_params.get('nombre')
        if not agente_id or not nombre:
            return Response({'error': 'agente y nombre son requeridos'}, status=400)
        if not Agente.objects.filter(id=agente_id, activo=True).exists():
            return Response({'error': 'Agente no encontrado o inactivo'}, status=404)
        sede = _resolve_user_sede_value(request.user)
        if not sede:
            return Response({'error': 'El usuario no tiene seccional configurada'}, status=400)

        try:
            resp = requests.get(
                f'{fastapi_base_url()}/documents/file',
                params={'chatbot_id': agente_id, 'sede': sede, 'filename': nombre},
                timeout=30,
            )
        except requests.exceptions.RequestException as exc:
            return _proxy_error_response(exc)
        if resp.status_code != 200:
            return Response({'error': 'El documento original no está disponible'}, status=resp.status_code)
        out = HttpResponse(resp.content, content_type='application/pdf')
        out['Content-Disposition'] = 'inline'
        return out
