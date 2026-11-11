import hashlib
import secrets
import unicodedata

from django.contrib.auth.hashers import make_password
from django.core.cache import cache
from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from espacios import alcance as alcance_espacios
from usuarios.models import Rol, Usuario
from usuarios.serializers import RolSerializer, UsuarioMinimalSerializer, UsuarioSerializer

from mysite.auth_helpers import (
    CUENTA_DESACTIVADA, is_admin_global, q_usuarios_de_seccional, is_admin_sistema, seccional_para_sesion, user_supervisa_espacios,
)
from financiero.permissions import es_solo_admin_financiero
from mysite.cache_utils import CachedCatalogMixin
from mysite.seccional_auth import SeccionalMixin
from mysite.permissions import (
    IsAdminRoleManagement,
    IsAdminUserManagement,
)

from usuarios.contrasenas import password_valida as _password_valida


MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_SECONDS = 2 * 60


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
        if self.action in ('login',):
            return [permissions.AllowAny()]
        if self.action in ('list', 'retrieve', 'session_auth_state'):
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

    def _build_componentes(self, usuario):
        from mysite.auth_helpers import construir_componentes

        return construir_componentes(usuario)

    def _build_espacios_permitidos(self, usuario):
        from espacios.models import EspacioPermitido

        espacios_permisos = EspacioPermitido.objects.filter(usuario=usuario).select_related('espacio', 'espacio__sede', 'espacio__tipo')
        if getattr(usuario, 'sede_id', None):
            espacios_permisos = espacios_permisos.filter(espacio__sede_id=usuario.sede_id)
        return [
            {
                'id': ep.espacio.id,
                'tipo': ep.espacio.tipo.nombre if ep.espacio.tipo else None,
                'capacidad': ep.espacio.capacidad,
                'ubicacion': ep.espacio.ubicacion,
                'disponible': ep.espacio.estado == 'Disponible',
                'sede_id': ep.espacio.sede.id,
                'sede_nombre': ep.espacio.sede.nombre,
            }
            for ep in espacios_permisos
        ]

    @action(
        detail=False,
        methods=['post'],
        url_path='login',
        authentication_classes=[],
        permission_classes=[permissions.AllowAny],
    )
    def login(self, request):
        correo = request.data.get('correo')
        contrasena = request.data.get('contrasena')

        if not correo or not contrasena:
            return Response({'error': 'correo y contrasena son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        correo_normalizado = correo.strip().lower()
        ip_cliente = _get_client_ip(request)
        lock_key = f"login_lock:{correo_normalizado}:{ip_cliente}"
        if cache.get(lock_key):
            return Response(
                {'error': 'Demasiados intentos. Intenta de nuevo en unos minutos.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            usuario = Usuario.objects.select_related('sede', 'sede__seccional', 'rol', 'facultad').get(correo=correo_normalizado)
        except Usuario.DoesNotExist:
            attempts_key = f"login_attempts:{correo_normalizado}:{ip_cliente}"
            attempts = cache.get(attempts_key, 0) + 1
            if attempts >= MAX_LOGIN_ATTEMPTS:
                cache.set(lock_key, True, LOGIN_LOCKOUT_SECONDS)
                cache.delete(attempts_key)
                return Response(
                    {'error': 'Demasiados intentos. Intenta de nuevo en unos minutos.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            cache.set(attempts_key, attempts, LOGIN_LOCKOUT_SECONDS)
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        password_ok, es_legacy = _password_valida(usuario, contrasena)
        if not password_ok:
            attempts_key = f"login_attempts:{correo_normalizado}:{ip_cliente}"
            attempts = cache.get(attempts_key, 0) + 1
            if attempts >= MAX_LOGIN_ATTEMPTS:
                cache.set(lock_key, True, LOGIN_LOCKOUT_SECONDS)
                cache.delete(attempts_key)
                return Response(
                    {'error': 'Demasiados intentos. Intenta de nuevo en unos minutos.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            cache.set(attempts_key, attempts, LOGIN_LOCKOUT_SECONDS)
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        cache.delete(f"login_attempts:{correo_normalizado}:{ip_cliente}")

        if not usuario.activo:
            return Response({'error': CUENTA_DESACTIVADA}, status=status.HTTP_403_FORBIDDEN)

        if es_legacy:
            nuevo_hash = make_password(contrasena)
            usuario.contrasena_hash = nuevo_hash
            usuario.password = nuevo_hash
            usuario.save(update_fields=['contrasena_hash', 'password'])

        componentes = self._build_componentes(usuario)
        espacios_permitidos = self._build_espacios_permitidos(usuario)

        request.session['user_id'] = usuario.id
        request.session['correo'] = usuario.correo
        request.session['is_authenticated'] = True
        token = secrets.token_urlsafe(32)
        request.session['token'] = token
        request.session['rol'] = usuario.rol.nombre if usuario.rol else None
        request.session['id_rol'] = usuario.rol.id if usuario.rol else None

        return Response({
            'message': 'Login exitoso',
            'id': usuario.id,
            'nombre': usuario.nombre,
            'correo': usuario.correo,
            'rol': {
                'id': usuario.rol.id,
                'nombre': usuario.rol.nombre,
                'descripcion': usuario.rol.descripcion,
                'supervisa_espacios': usuario.rol.supervisa_espacios,
            } if usuario.rol else None,
            'facultad': {
                'id': usuario.facultad.id,
                'nombre': usuario.facultad.nombre,
            } if usuario.facultad else None,
            'sede': {
                'id': usuario.sede.id,
                'nombre': usuario.sede.nombre,
                'seccional_id': usuario.sede.seccional_id,
                'seccional_ciudad': usuario.sede.seccional.ciudad if usuario.sede.seccional else None,
                'direccion': usuario.sede.direccion,
            } if usuario.sede else None,
            'seccional': seccional_para_sesion(usuario),
            'componentes': componentes,
            'espacios_permitidos': espacios_permitidos,
            **alcance_espacios.resumen_sesion(usuario),
            'token': token,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get', 'post'], url_path='logout')
    def logout(self, request):
        request.session.flush()
        return Response({'message': 'Logout exitoso'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='session-auth-state')
    def session_auth_state(self, request):
        user_id = request.session.get('user_id')
        if not user_id:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            usuario = Usuario.objects.select_related('rol').get(id=user_id)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        componentes = self._build_componentes(usuario)
        parts = [f"{c['id']}:{c['permiso']}" for c in sorted(componentes, key=lambda item: (item['id'], item['permiso']))]
        role_part = str(usuario.rol.id) if usuario.rol else 'no-role'
        supervisa_part = 'supervisa-espacios' if user_supervisa_espacios(usuario) else 'no-supervisa-espacios'
        signature_source = f"{role_part}|{supervisa_part}|{'|'.join(parts)}"
        signature = hashlib.sha256(signature_source.encode('utf-8')).hexdigest()[:16]

        since = request.query_params.get('since')
        if since and since == signature:
            return Response({'changed': False, 'signature': signature}, status=status.HTTP_200_OK)

        return Response({
            'changed': True,
            'signature': signature,
            'rol': {
                'id': usuario.rol.id,
                'nombre': usuario.rol.nombre,
                'descripcion': usuario.rol.descripcion,
                'supervisa_espacios': usuario.rol.supervisa_espacios,
            } if usuario.rol else None,
            'componentes': componentes,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['put'], url_path='change-password')
    def change_password(self, request):
        correo = request.data.get('correo')
        old_contrasena = request.data.get('old_contrasena')
        new_contrasena = request.data.get('new_contrasena')

        if not correo or not old_contrasena or not new_contrasena:
            return Response({'error': 'correo, old_contrasena y new_contrasena son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            usuario = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        password_ok, _ = _password_valida(usuario, old_contrasena)
        if not password_ok:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        usuario.contrasena_hash = make_password(new_contrasena)
        usuario.password = usuario.contrasena_hash
        usuario.save()
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
