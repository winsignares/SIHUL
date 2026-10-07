import requests
from django.http import HttpResponse
from rest_framework import permissions
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from mysite.auth_helpers import is_admin_global, is_admin_sistema, is_authenticated_user, user_can_edit_componente

from .models import Agente
from .views import _resolve_user_sede_value, fastapi_base_url

COMPONENTE_GESTION_CHATBOTS = 'Gestión de Chatbots'
MAX_UPLOAD_MB = 25  # mismo tope que MAX_UPLOAD_MB del servicio RAG


class PuedeGestionarChatbots(permissions.BasePermission):
    """Admins globales/de sistema siempre pueden; otros roles requieren permiso
    EDITAR sobre el componente 'Gestión de Chatbots' (asignable desde Gestión de Roles)."""

    def has_permission(self, request, view):
        user = request.user
        if not is_authenticated_user(user):
            return False
        if is_admin_global(user) or is_admin_sistema(user):
            return True
        return user_can_edit_componente(user, COMPONENTE_GESTION_CHATBOTS)


def _proxy_error_response(exc: requests.exceptions.RequestException) -> Response:
    return Response({'error': f'No se pudo contactar el servicio de chatbots: {exc}'}, status=502)


def _forward_response(resp: requests.Response) -> Response:
    if resp.status_code == 204 or not resp.content:
        return Response(status=resp.status_code)
    try:
        return Response(resp.json(), status=resp.status_code)
    except ValueError:
        return Response({'error': resp.text[:500]}, status=resp.status_code)


class ChatbotDocumentosProxyView(APIView):
    """Lista y sube documentos del RAG (FastAPI), asociados a un chatbot y una sede."""

    permission_classes = [PuedeGestionarChatbots]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        params = {}
        for key in ('chatbot_id', 'sede', 'limit'):
            value = request.query_params.get(key)
            if value:
                params[key] = value

        try:
            resp = requests.get(f'{fastapi_base_url()}/documents/', params=params, timeout=30)
        except requests.exceptions.RequestException as exc:
            return _proxy_error_response(exc)
        return _forward_response(resp)

    def post(self, request):
        chatbot_id = request.data.get('chatbot_id')
        sede = request.data.get('sede')
        file_obj = request.FILES.get('file')

        if not chatbot_id or not sede or not file_obj:
            return Response({'error': 'chatbot_id, sede y file son requeridos'}, status=400)
        if file_obj.size > MAX_UPLOAD_MB * 1024 * 1024:
            return Response({'error': f'El archivo supera el máximo de {MAX_UPLOAD_MB} MB.'}, status=413)

        try:
            resp = requests.post(
                f'{fastapi_base_url()}/documents/upload',
                params={'chatbot_id': chatbot_id, 'sede': sede},
                files={'file': (file_obj.name, file_obj.read(), file_obj.content_type)},
                timeout=120,
            )
        except requests.exceptions.RequestException as exc:
            return _proxy_error_response(exc)
        return _forward_response(resp)


class ChatbotDocumentoDetalleProxyView(APIView):
    """Elimina un documento (y sus chunks, por cascada) del RAG."""

    permission_classes = [PuedeGestionarChatbots]

    def delete(self, request, pk):
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


class ChatbotSedesProxyView(APIView):
    """Lista las sedes válidas para asociar documentos, según el servicio RAG."""

    permission_classes = [PuedeGestionarChatbots]

    def get(self, request):
        try:
            resp = requests.get(f'{fastapi_base_url()}/sedes', timeout=15)
        except requests.exceptions.RequestException as exc:
            return _proxy_error_response(exc)
        return _forward_response(resp)
