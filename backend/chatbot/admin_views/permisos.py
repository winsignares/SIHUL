"""Permisos para gestionar chatbots y su documentación."""
from mysite.auth_helpers import is_admin_global
from mysite.auth_helpers import is_admin_sistema
from mysite.auth_helpers import is_authenticated_user
from mysite.auth_helpers import user_can_edit_componente
from rest_framework import permissions
from ..models import AgenteResponsable


COMPONENTE_GESTION_CHATBOTS = 'Gestión de Chatbots'


COMPONENTE_DOCUMENTACION_CHATBOTS = 'Gestión de Documentación de Chatbots'


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
    """Solo el administrador general trabaja con cualquier seccional; el resto, con la suya."""
    return is_admin_global(user)


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
