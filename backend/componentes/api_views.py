from django.db.models import Q
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from mysite.auth_helpers import (
    get_role_name, get_user_seccional_id, is_admin_global, is_admin_sistema, is_authenticated_user,
)
from mysite.permissions import IsAdminOnly

from .models import Componente, ComponenteRol, ComponenteUsuario
from .serializers import ComponenteRolSerializer, ComponenteSerializer, ComponenteUsuarioSerializer


FINANCIAL_ROLE_NAMES = (
    'Funcionario',
    'Contabilidad',
    'Tesorería',
    'Auditoría',
    'Dirección Financiera',
    'Rectoría',
    'Admin Financiero',
)


class ComponenteListCreateAPIView(generics.ListCreateAPIView):
    queryset = Componente.objects.all().order_by('nombre')
    serializer_class = ComponenteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOnly()]

    def get_queryset(self):
        queryset = Componente.objects.all().order_by('nombre')
        if self.request.query_params.get('financiero') == '1':
            queryset = queryset.filter(
                componenterol__rol__nombre__in=FINANCIAL_ROLE_NAMES
            ).distinct()
        return queryset


class ComponenteDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Componente.objects.all()
    serializer_class = ComponenteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOnly()]


class ComponenteRolListCreateAPIView(generics.ListCreateAPIView):
    queryset = ComponenteRol.objects.select_related('componente', 'rol').all()
    serializer_class = ComponenteRolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOnly()]

    def get_queryset(self):
        queryset = ComponenteRol.objects.select_related('componente', 'rol').all()
        if self.request.query_params.get('financiero') == '1':
            queryset = queryset.filter(rol__nombre__in=FINANCIAL_ROLE_NAMES)
        return queryset


class ComponenteRolDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ComponenteRol.objects.select_related('componente', 'rol').all()
    serializer_class = ComponenteRolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOnly()]


class PuedeAsignarComponentesAUsuarios(permissions.BasePermission):
    """Quien puede dar o quitar componentes a personas: el administrador general (a cualquiera),
    el administrador de una seccional (solo a personas de su seccional) y el administrador
    financiero (solo a personas con rol financiero). Ver `puede_gestionar_usuario`."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not is_authenticated_user(user):
            return False
        return is_admin_global(user) or is_admin_sistema(user) or get_role_name(user) == 'admin financiero'


def puede_gestionar_usuario(solicitante, objetivo):
    """True si `solicitante` puede cambiar los componentes de `objetivo`."""
    if objetivo is None:
        return False
    if is_admin_global(solicitante):
        return True
    if is_admin_global(objetivo):
        return False  # nadie por debajo del administrador general cambia los permisos de uno
    if is_admin_sistema(solicitante):
        propia = get_user_seccional_id(solicitante)
        return propia is not None and get_user_seccional_id(objetivo) == propia
    if get_role_name(solicitante) == 'admin financiero':
        rol = (getattr(getattr(objetivo, 'rol', None), 'nombre', '') or '').strip().lower()
        return rol in {nombre.lower() for nombre in FINANCIAL_ROLE_NAMES}
    return False


def _componentes_visibles(queryset, user):
    """El administrador general ve todo; el de una seccional, solo lo de las personas de su seccional."""
    if is_admin_global(user):
        return queryset
    if is_admin_sistema(user):
        propia = get_user_seccional_id(user)
        if propia is None:
            return queryset.none()
        return queryset.filter(Q(usuario__seccional_id=propia) | Q(usuario__sede__seccional_id=propia))
    return queryset  # administrador financiero: se limita por rol financiero (ver parámetro ?financiero=1)


class _EscrituraPorPersonaMixin:
    """Las escrituras sobre ComponenteUsuario se validan contra la persona afectada."""

    def _autorizar(self, usuario):
        if not puede_gestionar_usuario(self.request.user, usuario):
            raise PermissionDenied('No puedes cambiar los permisos de esta persona.')

    def perform_create(self, serializer):
        self._autorizar(serializer.validated_data.get('usuario'))
        serializer.save()

    def perform_update(self, serializer):
        self._autorizar(serializer.instance.usuario)
        self._autorizar(serializer.validated_data.get('usuario', serializer.instance.usuario))
        serializer.save()

    def perform_destroy(self, instance):
        self._autorizar(instance.usuario)
        instance.delete()


class ComponenteUsuarioListCreateAPIView(_EscrituraPorPersonaMixin, generics.ListCreateAPIView):
    serializer_class = ComponenteUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [PuedeAsignarComponentesAUsuarios()]

    def get_queryset(self):
        queryset = ComponenteUsuario.objects.select_related('componente', 'usuario').all()
        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return queryset.none()

        role_name = get_role_name(user)
        if is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero':
            queryset = _componentes_visibles(queryset, user)
            usuario_id = self.request.query_params.get('usuario')
            if usuario_id:
                return queryset.filter(usuario_id=usuario_id)
            if self.request.query_params.get('financiero') == '1':
                return queryset.filter(usuario__rol__nombre__in=FINANCIAL_ROLE_NAMES)
            return queryset

        return queryset.filter(usuario_id=user.id)


class ComponenteUsuarioDetailAPIView(_EscrituraPorPersonaMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = ComponenteUsuario.objects.select_related('componente', 'usuario').all()
    serializer_class = ComponenteUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [PuedeAsignarComponentesAUsuarios()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return queryset.none()

        role_name = get_role_name(user)
        if is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero':
            return _componentes_visibles(queryset, user)

        return queryset.filter(usuario_id=user.id)
