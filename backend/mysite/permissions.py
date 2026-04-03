from rest_framework.permissions import BasePermission

from .auth_helpers import is_admin_global


class IsAdminGlobal(BasePermission):
    def has_permission(self, request, view):
        return is_admin_global(getattr(request, 'user', None))


class IsCoordinador(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return False
        if is_admin_global(user):
            return True

        rol = getattr(user, 'rol', None)
        return getattr(rol, 'nombre', None) == 'COORDINADOR'


class IsDocente(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return False
        if is_admin_global(user):
            return True

        rol = getattr(user, 'rol', None)
        return getattr(rol, 'nombre', None) == 'DOCENTE'
