from django.db.models import Prefetch
from django.db.models.functions import Lower
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from mysite.auth_helpers import get_role_name, is_admin_global, is_admin_sistema

from .admin_views import PuedeGestionarChatbots, PuedeGestionarDocumentosChatbots, _chatbot_permitido, ids_chatbots_permitidos
from .models import Agente, AgenteResponsable, Conversacion, PreguntaSugerida
from .serializers import AgenteSerializer, ConversacionSerializer, PreguntaSugeridaSerializer


class LecturaAutenticadaEscrituraGestor(permissions.BasePermission):
    """
    Cualquier usuario autenticado puede ver los agentes (los asistentes que aparecen en
    el chat); crearlos, modificarlos o borrarlos exige poder gestionar chatbots. El agente
    define el comportamiento del asistente (tipo e instrucciones adicionales), así que no
    debe poder cambiarlo cualquier usuario.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return PuedeGestionarChatbots().has_permission(request, view)


# Responsables ya cargados con su usuario: el listado no hace una consulta por chatbot.
_RESPONSABLES = Prefetch(
    'responsables',
    queryset=AgenteResponsable.objects.select_related('usuario', 'usuario__seccional', 'usuario__sede__seccional'),
)


class AgenteListCreateAPIView(generics.ListCreateAPIView):
    queryset = Agente.objects.prefetch_related(_RESPONSABLES).order_by(Lower('nombre'))
    serializer_class = AgenteSerializer
    permission_classes = [LecturaAutenticadaEscrituraGestor]


class AgenteDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Agente.objects.prefetch_related(_RESPONSABLES)
    serializer_class = AgenteSerializer
    permission_classes = [LecturaAutenticadaEscrituraGestor]


class LecturaAutenticadaEscrituraDocumentacion(permissions.BasePermission):
    """
    Las preguntas sugeridas son las que el chat muestra como atajos: cualquier usuario autenticado
    las ve. Crearlas, editarlas o borrarlas exige poder gestionar la documentación de ESE chatbot
    (administrar chatbots, o ser su responsable); ver `_validar_chatbot`.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return PuedeGestionarDocumentosChatbots().has_permission(request, view)


def _validar_chatbot(request, agente_id):
    if not _chatbot_permitido(ids_chatbots_permitidos(request), agente_id):
        raise PermissionDenied('No puedes gestionar las preguntas de este chatbot.')


class PreguntaSugeridaListCreateAPIView(generics.ListCreateAPIView):
    queryset = PreguntaSugerida.objects.select_related('agente').all().order_by('agente_id', 'orden')
    serializer_class = PreguntaSugeridaSerializer
    permission_classes = [LecturaAutenticadaEscrituraDocumentacion]

    def perform_create(self, serializer):
        _validar_chatbot(self.request, serializer.validated_data['agente'].id)
        serializer.save()


class PreguntaSugeridaDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PreguntaSugerida.objects.select_related('agente').all()
    serializer_class = PreguntaSugeridaSerializer
    permission_classes = [LecturaAutenticadaEscrituraDocumentacion]

    def perform_update(self, serializer):
        _validar_chatbot(self.request, serializer.instance.agente_id)
        nuevo = serializer.validated_data.get('agente')
        if nuevo:
            _validar_chatbot(self.request, nuevo.id)
        serializer.save()

    def perform_destroy(self, instance):
        _validar_chatbot(self.request, instance.agente_id)
        instance.delete()


class ConversacionListCreateAPIView(generics.ListCreateAPIView):
    queryset = Conversacion.objects.select_related('chatbot').all().order_by('-fecha')
    serializer_class = ConversacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return super().get_queryset().none()
        role_name = get_role_name(user)
        if is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero':
            return super().get_queryset()
        return super().get_queryset().filter(id_usuario=user.id)


class ConversacionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Conversacion.objects.select_related('chatbot').all()
    serializer_class = ConversacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return super().get_queryset().none()
        role_name = get_role_name(user)
        if is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero':
            return super().get_queryset()
        return super().get_queryset().filter(id_usuario=user.id)
