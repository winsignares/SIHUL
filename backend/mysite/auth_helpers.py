COMPONENTE_DOCUMENTACION_CHATBOTS = 'Gestión de Documentación de Chatbots'

MISSING_SECCIONAL_MESSAGE = 'Usuario sin sede o seccional asignada. Asignarle una sede para consultar datos por seccional.'


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


def get_user_seccional_id(user):
    if not user:
        return None

    seccional_id = getattr(user, 'seccional_id', None)
    if seccional_id:
        return seccional_id

    sede = getattr(user, 'sede', None)
    return getattr(sede, 'seccional_id', None)


def role_supervisa_espacios(rol):
    if not rol:
        return False

    # Solo la casilla «Supervisor de espacios» del rol; el nombre del rol no cuenta
    return bool(getattr(rol, 'supervisa_espacios', False))


def user_supervisa_espacios(user):
    if not is_authenticated_user(user):
        return False

    return role_supervisa_espacios(getattr(user, 'rol', None))


def has_any_role(user, allowed_roles):
    if not is_authenticated_user(user):
        return False

    if is_admin_global(user):
        return True

    role_name = get_role_name(user)
    allowed = {str(r).strip().lower() for r in allowed_roles}
    return role_name in allowed


def es_responsable_de_chatbots(user):
    """True si el usuario es responsable (AgenteResponsable) de al menos un chatbot."""
    if not is_authenticated_user(user):
        return False

    from chatbot.models import AgenteResponsable

    return AgenteResponsable.objects.filter(usuario_id=user.id).exists()


def get_componente_permiso(user, nombre_componente):
    """Resuelve el permiso efectivo ('VER'/'EDITAR'/None) de `user` sobre el
    Componente `nombre_componente`, replicando la precedencia usada por
    mysite.api_views para construir la lista de componentes del frontend:
    el override de ComponenteUsuario (si existe y está activo) reemplaza al
    permiso del rol; si el override existe pero activo=False, se revoca el
    acceso aunque el rol lo conceda; si no hay grant de rol pero sí un
    override activo, igual se concede acceso con el permiso del override.

    Excepción: «Gestión de Documentación de Chatbots» se concede (EDITAR) a quien esté
    asignado como responsable de algún chatbot, sea cual sea su rol, salvo que un override
    inactivo lo haya revocado expresamente. Así subir documentación no exige un rol especial.

    No hay bypass implícito por rol (ni siquiera admin_global); el acceso depende
    estrictamente de los registros ComponenteRol/ComponenteUsuario, igual
    que en el frontend (hasEditPermission solo consulta la lista enviada
    por el backend).
    """
    if not is_authenticated_user(user):
        return None

    from componentes.models import Componente, ComponenteRol, ComponenteUsuario

    try:
        componente = Componente.objects.get(nombre=nombre_componente)
    except Componente.DoesNotExist:
        return None

    override = ComponenteUsuario.objects.filter(usuario=user, componente=componente).first()

    rol = getattr(user, 'rol', None)
    cr = ComponenteRol.objects.filter(rol=rol, componente=componente).first() if rol else None

    if cr:
        if override and not override.activo:
            return None
        permiso = override.permiso if override else cr.permiso
    elif override and override.activo:
        permiso = override.permiso
    else:
        permiso = None

    if (
        nombre_componente == COMPONENTE_DOCUMENTACION_CHATBOTS
        and permiso != 'EDITAR'
        and not (override and not override.activo)
        and es_responsable_de_chatbots(user)
    ):
        return 'EDITAR'
    return permiso


def user_can_edit_componente(user, nombre_componente):
    return get_componente_permiso(user, nombre_componente) == 'EDITAR'
