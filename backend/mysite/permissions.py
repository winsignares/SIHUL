from rest_framework.permissions import SAFE_METHODS, BasePermission

from .auth_helpers import (
    get_role_name,
    has_any_role,
    is_admin_global,
    is_authenticated_user,
    is_admin_sistema,
    user_can_edit_componente,
    user_supervisa_espacios,
)


class IsAuthenticatedUsuario(BasePermission):
    def has_permission(self, request, view):
        return is_authenticated_user(getattr(request, 'user', None))
    
class IsAdminSistema(BasePermission):
    def has_permission(self, request, view):
        return is_admin_sistema(getattr(request, 'user', None))


class IsAdminGlobal(BasePermission):
    def has_permission(self, request, view):
        return is_admin_global(getattr(request, 'user', None))


class IsAuthenticatedReadOnlyOrAdminWrite(BasePermission):
    """GET/HEAD/OPTIONS para cualquier usuario autenticado; escritura solo admins."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if request.method in SAFE_METHODS:
            return is_authenticated_user(user)
        role_name = get_role_name(user)
        return is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero'


class IsAdminUserManagement(BasePermission):
    """Permite escritura solo para admins (global, sistema, financiero)."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not is_authenticated_user(user):
            return False

        role_name = get_role_name(user)
        return is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero'


class IsCoordinador(BasePermission):
    def has_permission(self, request, view):
        return has_any_role(getattr(request, 'user', None), {'coordinador'})


class IsDocente(BasePermission):
    def has_permission(self, request, view):
        return has_any_role(getattr(request, 'user', None), {'docente'})


class IsEstudiante(BasePermission):
    def has_permission(self, request, view):
        return has_any_role(getattr(request, 'user', None), {'estudiante'})


class IsSupervisorGeneral(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return user_supervisa_espacios(user) or has_any_role(user, {'supervisor_general'})


class CanManagePrestamosEspacios(BasePermission):
    """Replica server-side el hasEditPermission('Préstamos de Espacios') del
    frontend para escritura (PUT/PATCH/DELETE) sobre préstamos de espacios.

    Lectura (GET/HEAD/OPTIONS) queda abierta a lo que ya decida la vista
    (get_permissions); esta clase solo debe usarse para métodos de escritura.
    Excepción: el propio solicitante (mismo correo) puede editar/eliminar su
    solicitud aunque no tenga el permiso EDITAR general, igual que en la UI
    (`solicitanteEsAdmin` en PrestamosEspacios.tsx).
    """

    COMPONENTE_NOMBRE = 'Préstamos de Espacios'

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = getattr(request, 'user', None)
        if not is_authenticated_user(user):
            return False
        return True  # el chequeo real (permiso o dueño) se resuelve por objeto

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        user = getattr(request, 'user', None)
        if not is_authenticated_user(user):
            return False

        if user_can_edit_componente(user, self.COMPONENTE_NOMBRE):
            return True

        correo_usuario = (getattr(user, 'correo', '') or '').strip().lower()
        correo_solicitante = (
            getattr(obj, 'correo_solicitante', None)
            or getattr(getattr(obj, 'usuario', None), 'correo', None)
            or ''
        ).strip().lower()

        return bool(correo_usuario) and correo_usuario == correo_solicitante
