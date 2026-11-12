from django.http import JsonResponse
from mysite.auth_helpers import get_role_name, get_user_seccional_id, is_admin_global, is_admin_sistema
from mysite.auth_helpers import ve_todas_las_seccionales



def _get_request_user(request):
    user = getattr(request, 'user_obj', None)
    if user:
        return user
    user = getattr(request, 'user', None)
    if user and getattr(user, 'is_authenticated', False):
        return user
    return None


def _is_admin_user(user):
    if not user:
        return False
    if getattr(user, 'es_superusuario', False):
        return True
    role_name = get_role_name(user)
    return is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero'


def _require_auth(request):
    user = _get_request_user(request)
    if not user:
        return None, JsonResponse({'error': 'Autenticación requerida'}, status=403)
    return user, None


def _get_authenticated_seccional_scope(request):
    user = _get_request_user(request)
    if not user:
        return None, False
    if ve_todas_las_seccionales(user):
        return None, True
    return get_user_seccional_id(user), False
