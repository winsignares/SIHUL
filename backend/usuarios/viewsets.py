import unicodedata

from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from usuarios.models import Rol, Usuario
from usuarios.serializers import RolSerializer, UsuarioMinimalSerializer, UsuarioSerializer

from mysite.auth_helpers import (
    is_admin_global, q_usuarios_de_seccional, is_admin_sistema,
)
from financiero.permissions import es_solo_admin_financiero
from mysite.cache_utils import CachedCatalogMixin
from mysite.seccional_auth import SeccionalMixin
from mysite.permissions import (
    IsAdminRoleManagement,
    IsAdminUserManagement,
)

from usuarios import sesion


_ESTADO_DE_RECHAZO = {
    sesion.DatosIncompletos: status.HTTP_400_BAD_REQUEST,
    sesion.CredencialesInvalidas: status.HTTP_401_UNAUTHORIZED,
    sesion.CuentaDesactivada: status.HTTP_403_FORBIDDEN,
    sesion.DemasiadosIntentos: status.HTTP_429_TOO_MANY_REQUESTS,
}


# Acciones que se publican también en /usuarios/<ruta>/ (nginx reescribe ahí /api/usuarios/<ruta>/). No usan la
# autenticación de DRF: login la abre, logout la cierra, session-auth-state lee la sesión y responde 401 si no hay,
# y change-password se valida con la contraseña actual.
ACCIONES_DE_SESION = ('login', 'logout', 'session_auth_state', 'change_password')


def _get_client_ip(request):
    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')


class RolViewSet(CachedCatalogMixin, SeccionalMixin, viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    seccional_lookup = None
    permission_classes = [permissions.IsAuthenticated, IsAdminRoleManagement]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated()]
        return [permission() for permission in self.permission_classes]


class UsuarioViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Usuario.objects.select_related('rol', 'facultad', 'sede', 'seccional').prefetch_related('tipos_espacio_permitidos')
    serializer_class = UsuarioSerializer
    seccional_lookup = 'seccional'
    permission_classes = [IsAdminUserManagement]

    def filtrar_por_seccional(self, queryset, seccional):
        # También las personas sin seccional propia cuya sede es de esta seccional
        return queryset.filter(q_usuarios_de_seccional(getattr(seccional, 'pk', seccional)))

    FINANCIAL_ROLE_NAMES = (
        'Funcionario',
        'Contabilidad',
        'Tesorería',
        'Auditoría',
        'Dirección Financiera',
        'Rectoría',
        'Admin Financiero',
    )

    def get_permissions(self):
        if self.action in ACCIONES_DE_SESION:
            return [permissions.AllowAny()]
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def get_object(self):
        usuario = super().get_object()
        # Quien no es administrador general no edita ni elimina a uno (evita tomar su cuenta).
        if (
            self.request.method not in permissions.SAFE_METHODS
            and is_admin_global(usuario)
            and not is_admin_global(self.get_current_user())
        ):
            raise PermissionDenied('Solo el administrador general puede modificar a otro administrador general.')
        return usuario

    def get_serializer_class(self):
        if self.action in ('list',):
            user = self.get_current_user()
            if not user:
                return UsuarioMinimalSerializer

            role_name_raw = (getattr(getattr(user, 'rol', None), 'nombre', '') or '').strip().lower()
            role_name_normalized = unicodedata.normalize('NFD', role_name_raw)
            role_name_normalized = ''.join(ch for ch in role_name_normalized if unicodedata.category(ch) != 'Mn')
            role_name_normalized = role_name_normalized.replace('_', ' ')
            role_name_normalized = ' '.join(role_name_normalized.split())

            if is_admin_global(user) or is_admin_sistema(user) or role_name_normalized == 'admin financiero':
                return UsuarioSerializer

            return UsuarioMinimalSerializer

        return UsuarioSerializer

    def get_queryset(self):
        user = self.get_current_user()

        if user:
            role_name_raw = (getattr(getattr(user, 'rol', None), 'nombre', '') or '').strip().lower()
            role_name_normalized = unicodedata.normalize('NFD', role_name_raw)
            role_name_normalized = ''.join(ch for ch in role_name_normalized if unicodedata.category(ch) != 'Mn')
            role_name_normalized = role_name_normalized.replace('_', ' ')
            role_name_normalized = ' '.join(role_name_normalized.split())

            if es_solo_admin_financiero(user):
                # El administrador financiero (sin ser administrador general) gestiona solo al equipo financiero,
                # de todas las seccionales: nunca ve ni toca usuarios académicos.
                if self.action == 'list_docentes':
                    return Usuario.objects.none()
                return Usuario.objects.select_related(
                    'rol', 'facultad', 'sede', 'seccional',
                ).prefetch_related('tipos_espacio_permitidos').filter(rol__nombre__in=self.FINANCIAL_ROLE_NAMES)

            if is_admin_global(user) or is_admin_sistema(user):
                # Acceso administrativo, pero restringido a la seccional del
                # usuario salvo que sea superusuario real (SeccionalMixin.get_queryset).
                base_queryset = super().get_queryset()
                if self.action == 'list_docentes':
                    return base_queryset.filter(activo=True, rol__nombre__iexact='docente')
                if self.request.query_params.get('financiero') == '1':
                    return base_queryset.filter(rol__nombre__in=self.FINANCIAL_ROLE_NAMES)
                return base_queryset

            # Usuarios no administradores: solo su propio registro
            base_queryset = Usuario.objects.select_related('rol', 'facultad', 'sede', 'seccional')
            return base_queryset.filter(id=user.id)

        if self.action == 'list_docentes':
            if not user:
                return Usuario.objects.select_related('rol', 'facultad', 'sede', 'seccional').filter(
                    activo=True,
                    rol__nombre__iexact='docente'
                )
            return super().get_queryset().filter(activo=True, rol__nombre__iexact='docente')
        return super().get_queryset()

    PAGINA_MAX = 100

    def list(self, request, *args, **kwargs):
        # Sin `page` devuelve la lista completa como siempre (otras pantallas dependen de ella);
        # con `page` devuelve un bloque filtrado por `search` y `rol`, para no traer todos de golpe.
        if 'page' not in request.query_params:
            return super().list(request, *args, **kwargs)

        queryset = self.get_queryset()
        rol = (request.query_params.get('rol') or '').strip()
        if rol and rol != 'todos':
            queryset = queryset.filter(rol__nombre=rol)
        for termino in (request.query_params.get('search') or '').split():
            queryset = queryset.filter(Q(nombre__icontains=termino) | Q(correo__icontains=termino))
        queryset = queryset.order_by('nombre', 'id')

        try:
            tamano = min(max(int(request.query_params.get('page_size', self.PAGINA_MAX)), 1), self.PAGINA_MAX)
            pagina = max(int(request.query_params.get('page', 1)), 1)
        except ValueError:
            return Response({'error': 'page y page_size deben ser números'}, status=status.HTTP_400_BAD_REQUEST)

        total = queryset.count()
        inicio = (pagina - 1) * tamano
        serializer = self.get_serializer(queryset[inicio:inicio + tamano], many=True)
        return Response({'count': total, 'page': pagina, 'page_size': tamano, 'results': serializer.data})

    @action(
        detail=False,
        methods=['post'],
        url_path='login',
        authentication_classes=[],
        permission_classes=[permissions.AllowAny],
    )
    def login(self, request):
        try:
            usuario = sesion.autenticar(request.data.get('correo'), request.data.get('contrasena'), _get_client_ip(request))
        except sesion.SesionRechazada as rechazo:
            return Response({'error': rechazo.mensaje}, status=_ESTADO_DE_RECHAZO[type(rechazo)])

        token = sesion.abrir_sesion(request.session, usuario)
        return Response(sesion.datos_de_inicio(usuario, token), status=status.HTTP_200_OK)

    @action(detail=False, methods=['get', 'post'], url_path='logout',
            authentication_classes=[], permission_classes=[permissions.AllowAny])
    def logout(self, request):
        request.session.flush()
        return Response({'message': 'Logout exitoso'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='session-auth-state',
            authentication_classes=[], permission_classes=[permissions.AllowAny])
    def session_auth_state(self, request):
        user_id = request.session.get('user_id')
        if not user_id:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            usuario = Usuario.objects.select_related('rol').get(id=user_id)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        return Response(sesion.estado_de_sesion(usuario, request.query_params.get('since')), status=status.HTTP_200_OK)

    @action(detail=False, methods=['put'], url_path='change-password',
            authentication_classes=[], permission_classes=[permissions.AllowAny])
    def change_password(self, request):
        try:
            sesion.cambiar_contrasena(
                request.data.get('correo'), request.data.get('old_contrasena'), request.data.get('new_contrasena'))
        except sesion.SesionRechazada as rechazo:
            return Response({'error': rechazo.mensaje}, status=_ESTADO_DE_RECHAZO[type(rechazo)])
        return Response({'message': 'Contraseña cambiada exitosamente'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='docentes', permission_classes=[permissions.IsAuthenticated])
    def list_docentes(self, request):
        docentes = self.get_queryset()
        data = [
            {
                'id': docente.id,
                'nombre': docente.nombre,
                'correo': docente.correo,
                'rol_id': docente.rol.id if docente.rol else None,
                'facultad_id': docente.facultad.id if docente.facultad else None,
                'activo': docente.activo,
            }
            for docente in docentes
        ]
        return Response({'usuarios': data}, status=status.HTTP_200_OK)
