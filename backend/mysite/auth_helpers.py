def is_admin_global(user):
    if not user:
        return False

    if getattr(user, 'is_superuser', False):
        return True

    rol = getattr(user, 'rol', None)
    rol_nombre = (getattr(rol, 'nombre', '') or '').strip().lower()
    return rol_nombre in {'admin_global', 'admin'}
