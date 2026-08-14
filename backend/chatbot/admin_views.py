import requests
from rest_framework import permissions
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from mysite.auth_helpers import is_admin_global, is_admin_sistema, is_authenticated_user, user_can_edit_componente

from .views import fastapi_base_url

COMPONENTE_GESTION_CHATBOTS = 'Gestión de Chatbots'


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
        return _forward_response(resp)


class ChatbotSedesProxyView(APIView):
    """Lista las sedes válidas para asociar documentos, según el servicio RAG."""

    permission_classes = [PuedeGestionarChatbots]

    def get(self, request):
        try:
            resp = requests.get(f'{fastapi_base_url()}/sedes', timeout=15)
        except requests.exceptions.RequestException as exc:
            return _proxy_error_response(exc)
        return _forward_response(resp)
