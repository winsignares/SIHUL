from django.db.models import Prefetch, Q
from django.db.models.functions import Lower
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError

from mysite.auth_helpers import get_role_name, is_admin_global, is_admin_sistema

from .admin_views import (
    PuedeGestionarChatbots, PuedeGestionarDocumentosChatbots, _chatbot_permitido, ids_chatbots_permitidos,
    puede_todas_las_sedes,
)
from .sedes import agentes_visibles, ids_seccionales
from .views import _resolve_user_sede_value
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


class _AgentesVisiblesMixin:
    """Quien no administra chatbots solo ve los disponibles en su seccional (más los que tiene asignados)."""

    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.request
        if request.method not in permissions.SAFE_METHODS or PuedeGestionarChatbots().has_permission(request, self):
            return queryset
        visibles = agentes_visibles(queryset, _resolve_user_sede_value(request.user))
        propios = ids_chatbots_permitidos(request)
        if propios:
            visibles = queryset.filter(Q(pk__in=visibles.values('pk')) | Q(pk__in=propios))
        return visibles


class AgenteListCreateAPIView(_AgentesVisiblesMixin, generics.ListCreateAPIView):
    queryset = Agente.objects.prefetch_related(_RESPONSABLES, 'seccionales').order_by(Lower('nombre'))
    serializer_class = AgenteSerializer
    permission_classes = [LecturaAutenticadaEscrituraGestor]


class AgenteDetailAPIView(_AgentesVisiblesMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Agente.objects.prefetch_related(_RESPONSABLES, 'seccionales')
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


def _seccional_del_usuario(request):
    """Seccional con la que escribe una pregunta quien no es admin global; error si no tiene."""
    ids = ids_seccionales(_resolve_user_sede_value(request.user))
    if not ids:
        raise ValidationError({'seccional': 'Tu usuario no tiene seccional asignada.'})
    return ids[0]


def _puede_tocar_pregunta(request, pregunta):
    """Admin global: cualquiera. Los demás: solo las de su seccional (no las generales)."""
    if puede_todas_las_sedes(request.user):
        return True
    propias = ids_seccionales(_resolve_user_sede_value(request.user))
    return pregunta.seccional_id is not None and pregunta.seccional_id in propias


class _PreguntasVisiblesMixin:
    """Cada usuario ve las preguntas generales y las de su seccional; el admin global, todas."""

    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.request
        if not puede_todas_las_sedes(request.user):
            ids = ids_seccionales(_resolve_user_sede_value(request.user))
            queryset = queryset.filter(Q(seccional__isnull=True) | Q(seccional_id__in=ids))
        agente = request.query_params.get('agente')
        if agente and str(agente).isdigit():
            queryset = queryset.filter(agente_id=int(agente))
        return queryset


class PreguntaSugeridaListCreateAPIView(_PreguntasVisiblesMixin, generics.ListCreateAPIView):
    queryset = PreguntaSugerida.objects.select_related('agente', 'seccional').all().order_by('agente_id', 'orden')
    serializer_class = PreguntaSugeridaSerializer
    permission_classes = [LecturaAutenticadaEscrituraDocumentacion]

    def perform_create(self, serializer):
        _validar_chatbot(self.request, serializer.validated_data['agente'].id)
        if puede_todas_las_sedes(self.request.user):
            serializer.save()  # puede elegir una seccional o dejarla general
        else:
            serializer.save(seccional_id=_seccional_del_usuario(self.request))


class PreguntaSugeridaDetailAPIView(_PreguntasVisiblesMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = PreguntaSugerida.objects.select_related('agente', 'seccional').all()
    serializer_class = PreguntaSugeridaSerializer
    permission_classes = [LecturaAutenticadaEscrituraDocumentacion]

    def _autorizar(self, pregunta):
        _validar_chatbot(self.request, pregunta.agente_id)
        if not _puede_tocar_pregunta(self.request, pregunta):
            raise PermissionDenied('Solo puedes gestionar las preguntas de tu seccional.')

    def perform_update(self, serializer):
        self._autorizar(serializer.instance)
        nuevo = serializer.validated_data.get('agente')
        if nuevo:
            _validar_chatbot(self.request, nuevo.id)
        if puede_todas_las_sedes(self.request.user):
            serializer.save()
        else:
            serializer.save(seccional_id=serializer.instance.seccional_id)  # no puede moverla de seccional

    def perform_destroy(self, instance):
        self._autorizar(instance)
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
