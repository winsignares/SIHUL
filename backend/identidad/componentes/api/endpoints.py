from django.db.models import Q
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from nucleo.auth_helpers import (
    get_role_name, get_user_seccional_id, is_admin_global, is_admin_sistema, is_authenticated_user,
    q_usuarios_de_seccional,
)
from nucleo.roles_financieros import es_componente_financiero, es_rol_financiero
from nucleo.permissions import IsAdminOnly
from academico.sedes.models import Seccional

from ..models import Componente, ComponenteRol, ComponenteUsuario
from ..serializers import ComponenteRolSerializer, ComponenteSerializer, ComponenteUsuarioSerializer


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


class PuedeAjustarPermisosDeRol(permissions.BasePermission):
    """Escribir permisos de rol: el administrador general (plantilla y cualquier seccional) y el
    administrador de una seccional (solo los ajustes de la suya). Ver `_autorizar_permiso_de_rol`."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return is_authenticated_user(user) and (is_admin_global(user) or is_admin_sistema(user))


def _autorizar_permiso_de_rol(user, rol, componente, seccional):
    """Levanta PermissionDenied si `user` no puede escribir este permiso de rol.

    La plantilla general (sin seccional) es del administrador general. El administrador de una seccional
    solo ajusta lo de su seccional, y no toca lo financiero ni los roles de administración general."""
    if is_admin_global(user):
        return
    propia = get_user_seccional_id(user)
    if propia is None or seccional is None or seccional.id != propia:
        raise PermissionDenied('Solo puedes ajustar los permisos de tu propia seccional.')
    if es_componente_financiero(componente.nombre):
        raise PermissionDenied('Los componentes financieros los asigna el administrador general.')
    nombre_rol = (rol.nombre or '').strip().lower()
    if nombre_rol == 'admin_global' or es_rol_financiero(rol.nombre):
        raise PermissionDenied('Los permisos de este rol los administra el administrador general.')


def _validar_permiso_de_plantilla(permiso, seccional):
    """«Sin acceso» solo existe como ajuste de una seccional; en la plantilla general se quita la fila."""
    if seccional is None and permiso == ComponenteRol.Permiso.NINGUNO:
        raise ValidationError({'permiso': '«Sin acceso» solo se usa en el ajuste de una seccional; en la plantilla general se quita el componente.'})


def _permisos_de_rol_visibles(queryset, user):
    """El administrador general ve todo. Los demás ven la plantilla general y lo de su seccional."""
    if is_admin_global(user):
        return queryset
    filtro = Q(seccional__isnull=True)
    propia = get_user_seccional_id(user)
    if propia is not None:
        filtro |= Q(seccional_id=propia)
    return queryset.filter(filtro)


class ComponenteRolListCreateAPIView(generics.ListCreateAPIView):
    """Permisos de cada rol. Sin parámetros devuelve la plantilla general, como siempre.
    Con `?seccional=<id>` devuelve además los ajustes de esa seccional (quien no es administrador general
    solo recibe los de la suya); con `?seccional=todas`, el administrador general recibe todo."""

    queryset = ComponenteRol.objects.select_related('componente', 'rol', 'seccional').all()
    serializer_class = ComponenteRolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [PuedeAjustarPermisosDeRol()]

    def get_queryset(self):
        user = self.request.user
        queryset = ComponenteRol.objects.select_related('componente', 'rol', 'seccional').all()
        if self.request.query_params.get('financiero') == '1':
            queryset = queryset.filter(rol__nombre__in=FINANCIAL_ROLE_NAMES)
        pedida = self.request.query_params.get('seccional')
        if not pedida:
            return queryset.filter(seccional__isnull=True)
        if pedida == 'todas' and is_admin_global(user):
            return queryset
        seccional_id = int(pedida) if pedida.isdigit() else None
        if not is_admin_global(user):
            seccional_id = get_user_seccional_id(user)
        filtro = Q(seccional__isnull=True)
        if seccional_id is not None:
            filtro |= Q(seccional_id=seccional_id)
        return queryset.filter(filtro)

    def perform_create(self, serializer):
        user = self.request.user
        datos = serializer.validated_data
        seccional = datos.get('seccional')
        if 'seccional' not in self.request.data and not is_admin_global(user):
            seccional = Seccional.objects.filter(id=get_user_seccional_id(user)).first()  # su seccional por defecto
        _autorizar_permiso_de_rol(user, datos['rol'], datos['componente'], seccional)
        _validar_permiso_de_plantilla(datos.get('permiso', ComponenteRol.Permiso.VER), seccional)
        if seccional is not None and ComponenteRol.objects.filter(
            rol=datos['rol'], componente=datos['componente'], seccional=seccional,
        ).exists():
            raise ValidationError({'componente': 'Este rol ya tiene un ajuste para este componente en la seccional; edítalo.'})
        serializer.save(seccional=seccional)


class ComponenteRolDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ComponenteRol.objects.select_related('componente', 'rol', 'seccional').all()
    serializer_class = ComponenteRolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [PuedeAjustarPermisosDeRol()]

    def get_queryset(self):
        return _permisos_de_rol_visibles(super().get_queryset(), self.request.user)

    def perform_update(self, serializer):
        user, actual, nuevos = self.request.user, serializer.instance, serializer.validated_data
        _autorizar_permiso_de_rol(user, actual.rol, actual.componente, actual.seccional)
        seccional = nuevos['seccional'] if 'seccional' in nuevos else actual.seccional
        _autorizar_permiso_de_rol(user, nuevos.get('rol', actual.rol), nuevos.get('componente', actual.componente), seccional)
        _validar_permiso_de_plantilla(nuevos.get('permiso', actual.permiso), seccional)
        serializer.save()

    def perform_destroy(self, instance):
        _autorizar_permiso_de_rol(self.request.user, instance.rol, instance.componente, instance.seccional)
        instance.delete()


class AlcancePermisosView(APIView):
    """Qué puede hacer quien consulta en la pantalla de permisos por rol: si es administrador general
    (elige la seccional o la plantilla general) o administrador de una seccional (trabaja con la suya)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        general = is_admin_global(user)
        propia = Seccional.objects.filter(id=get_user_seccional_id(user)).first()
        return Response({
            'es_general': general,
            'puede_ajustar': general or is_admin_sistema(user),
            'seccional': {'id': propia.id, 'ciudad': propia.ciudad} if propia else None,
            'seccionales': [{'id': s.id, 'ciudad': s.ciudad} for s in Seccional.objects.order_by('ciudad')] if general else [],
        })


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
        return queryset.filter(q_usuarios_de_seccional(propia, prefijo='usuario__'))
    # Administrador financiero: solo los permisos del equipo financiero
    return queryset.filter(usuario__rol__nombre__in=FINANCIAL_ROLE_NAMES)


class _EscrituraPorPersonaMixin:
    """Las escrituras sobre ComponenteUsuario se validan contra la persona afectada."""

    def _autorizar(self, usuario, componente=None):
        user = self.request.user
        if not puede_gestionar_usuario(user, usuario):
            raise PermissionDenied('No puedes cambiar los permisos de esta persona.')
        if componente is not None and not is_admin_global(user) and get_role_name(user) != 'admin financiero'                 and es_componente_financiero(componente.nombre):
            raise PermissionDenied('Los componentes financieros los asigna el administrador general.')

    def perform_create(self, serializer):
        datos = serializer.validated_data
        self._autorizar(datos.get('usuario'), datos.get('componente'))
        serializer.save()

    def perform_update(self, serializer):
        actual, datos = serializer.instance, serializer.validated_data
        self._autorizar(actual.usuario, actual.componente)
        self._autorizar(datos.get('usuario', actual.usuario), datos.get('componente', actual.componente))
        serializer.save()

    def perform_destroy(self, instance):
        self._autorizar(instance.usuario, instance.componente)
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
