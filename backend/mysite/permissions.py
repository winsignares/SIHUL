from rest_framework.permissions import SAFE_METHODS, BasePermission

from .auth_helpers import get_role_name, has_any_role, is_admin_global, is_authenticated_user, is_admin_sistema


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
        return has_any_role(getattr(request, 'user', None), {'supervisor_general'})
