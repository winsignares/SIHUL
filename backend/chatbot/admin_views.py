import requests
from django.db.models import Q
from django.http import HttpResponse
from rest_framework import permissions
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from mysite.auth_helpers import is_admin_global, is_admin_sistema, is_authenticated_user, user_can_edit_componente
from usuarios.models import Usuario

from .models import Agente, AgenteResponsable, ChatbotDocument
from .views import _normalize_sede_value, _resolve_user_sede_value, fastapi_base_url

COMPONENTE_GESTION_CHATBOTS = 'Gestión de Chatbots'
COMPONENTE_DOCUMENTACION_CHATBOTS = 'Gestión de Documentación de Chatbots'
MAX_UPLOAD_MB = 25  # mismo tope que MAX_UPLOAD_MB del servicio RAG


class PuedeGestionarChatbots(permissions.BasePermission):
    """Administrar los chatbots (crear, editar, activar/inactivar y eliminar).

    Admins globales/de sistema siempre pueden; otros roles requieren permiso
    EDITAR sobre el componente 'Gestión de Chatbots' (asignable desde Gestión de Roles).
    Quien tiene este permiso también puede gestionar la documentación (ver
    PuedeGestionarDocumentosChatbots)."""

    def has_permission(self, request, view):
        user = request.user
        if not is_authenticated_user(user):
            return False
        if is_admin_global(user) or is_admin_sistema(user):
            return True
        return user_can_edit_componente(user, COMPONENTE_GESTION_CHATBOTS)


class PuedeGestionarDocumentosChatbots(permissions.BasePermission):
    """Gestionar la documentación de los chatbots: subir, reemplazar, priorizar y eliminar
    documentos, y registrar preguntas-respuestas con sus anexos. NO permite crear, editar ni
    eliminar los chatbots.

    Pueden: quienes administran chatbots (PuedeGestionarChatbots) y quienes tienen permiso
    EDITAR sobre el componente 'Gestión de Documentación de Chatbots'. Este último es el
    permiso que se asigna a las personas que solo deben cargar documentación."""

    def has_permission(self, request, view):
        if PuedeGestionarChatbots().has_permission(request, view):
            return True
        user = request.user
        if not is_authenticated_user(user):
            return False
        return user_can_edit_componente(user, COMPONENTE_DOCUMENTACION_CHATBOTS)


def puede_todas_las_sedes(user):
    return is_admin_global(user) or is_admin_sistema(user)


def ids_chatbots_permitidos(request):
    """Chatbots cuya documentación puede gestionar quien hace la petición.

    None  -> todos (administra chatbots).
    set() -> solo los que tiene asignados como responsable (vacío si no tiene ninguno).
    """
    user = request.user
    if not is_authenticated_user(user):
        return set()
    if PuedeGestionarChatbots().has_permission(request, None):
        return None
    return set(AgenteResponsable.objects.filter(usuario_id=user.id).values_list('agente_id', flat=True))


def _chatbot_permitido(permitidos, chatbot_id):
    """True si `chatbot_id` (cualquier tipo) está dentro de lo permitido."""
    if permitidos is None:
        return True
    return str(chatbot_id).isdigit() and int(chatbot_id) in permitidos


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


class ChatbotSedesProxyView(APIView):
    """Lista las sedes válidas para asociar documentos, según el servicio RAG."""

    permission_classes = [PuedeGestionarDocumentosChatbots]

    def get(self, request):
        try:
            resp = requests.get(f'{fastapi_base_url()}/sedes', timeout=15)
        except requests.exceptions.RequestException as exc:
            return _proxy_error_response(exc)
        return _forward_response(resp)


class ResponsablesCandidatosView(APIView):
    """Personas a las que se puede asignar la carga de documentación de un chatbot.

    Búsqueda por nombre o correo (mínimo 2 letras, máximo 20 resultados). Solo usuarios activos con
    seccional (de ahí sale la seccional con la que subirán); se excluyen los estudiantes.
    """

    permission_classes = [PuedeGestionarChatbots]

    def get(self, request):
        texto = (request.query_params.get('q') or '').strip()
        if len(texto) < 2:
            return Response([])
        usuarios = (
            Usuario.objects.filter(activo=True)
            .filter(Q(nombre__icontains=texto) | Q(correo__icontains=texto))
            .filter(Q(seccional__isnull=False) | Q(sede__seccional__isnull=False))
            .exclude(rol__nombre__iexact='estudiante')
            .select_related('seccional', 'sede__seccional')
            .order_by('nombre')[:20]
        )
        return Response([
            {
                'id': u.id,
                'nombre': u.nombre,
                'correo': u.correo,
                'seccional': (u.seccional.ciudad if u.seccional else (u.sede.seccional.ciudad if u.sede and u.sede.seccional else None)),
            }
            for u in usuarios
        ])
