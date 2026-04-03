def is_admin_global(user):
    if not user:
        return False

    if getattr(user, 'is_superuser', False):
        return True

    rol = getattr(user, 'rol', None)
    return getattr(rol, 'nombre', None) == 'ADMIN_GLOBAL'
