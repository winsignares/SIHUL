def is_superuser_effective(user):
    if not user:
        return False
    return bool(getattr(user, 'is_superuser', False) or getattr(user, 'es_superusuario', False))


def is_admin_global(user):
    if not user:
        return False

    if is_superuser_effective(user):
        return True

    rol = getattr(user, 'rol', None)
    rol_nombre = (getattr(rol, 'nombre', '') or '').strip().lower()
    return rol_nombre in {'admin_global'}

def is_admin_sistema(user):
    if not user:
        return False

    if is_superuser_effective(user):
        return True

    rol = getattr(user, 'rol', None)
    rol_nombre = (getattr(rol, 'nombre', '') or '').strip().lower()
    return rol_nombre in {'admin'}

def is_authenticated_user(user):
    if not user:
        return False

    if not getattr(user, 'is_authenticated', False):
        return False

    return bool(getattr(user, 'activo', True))


def get_role_name(user):
    rol = getattr(user, 'rol', None)
    return (getattr(rol, 'nombre', '') or '').strip().lower()


def has_any_role(user, allowed_roles):
    if not is_authenticated_user(user):
        return False

    if is_admin_global(user):
        return True

    role_name = get_role_name(user)
    allowed = {str(r).strip().lower() for r in allowed_roles}
    return role_name in allowed
