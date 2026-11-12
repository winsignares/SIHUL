COMPONENTE_DOCUMENTACION_CHATBOTS = 'Gestión de Documentación de Chatbots'

MISSING_SECCIONAL_MESSAGE = 'Usuario sin sede o seccional asignada. Asignarle una sede para consultar datos por seccional.'

SECCIONAL_PUBLICA_REQUERIDA = {'code': 'seccional_publica_requerida', 'error': 'Elige una seccional para consultar.'}



def respuesta_sin_seccional():
    """Respuesta 403 para vistas de función cuando el usuario no tiene seccional asignada."""
    from django.http import JsonResponse
    return JsonResponse({'code': 'usuario_sin_seccional', 'error': MISSING_SECCIONAL_MESSAGE}, status=403)


def seccional_publica(request):
    """Seccional que eligió el visitante del portal público (sin sesión): la envía el frontend en la cabecera
    `X-Seccional-Publica` (o como `?seccional_id=`). None si no eligió ninguna o el valor no es válido."""
    meta = getattr(request, 'META', {}) or {}
    params = getattr(request, 'GET', {}) or {}
    valor = meta.get('HTTP_X_SECCIONAL_PUBLICA') or params.get('seccional_id')
    try:
        return int(valor) if valor not in (None, '') else None
    except (TypeError, ValueError):
        return None


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


def ve_todas_las_seccionales(user):
    """El administrador general (superusuario o rol admin_global) consulta y gestiona los datos de todas las
    seccionales; los demás, solo los de la suya."""
    return is_admin_global(user)


def is_admin_sistema(user):
    if not user:
        return False

    if is_superuser_effective(user):
        return True

    rol = getattr(user, 'rol', None)
    rol_nombre = (getattr(rol, 'nombre', '') or '').strip().lower()
    return rol_nombre in {'admin'}

CUENTA_DESACTIVADA = 'Tu cuenta está desactivada. Comunícate con el administrador del sistema.'


def is_authenticated_user(user):
    if not user:
        return False

    if not getattr(user, 'is_authenticated', False):
        return False

    return bool(getattr(user, 'activo', True))


def get_role_name(user):
    rol = getattr(user, 'rol', None)
    return (getattr(rol, 'nombre', '') or '').strip().lower()


def seccional_de_usuario(user):
    """Seccional del usuario: la suya propia o, si no la tiene, la de su sede (None si no tiene ninguna)."""
    if not user:
        return None
    seccional = getattr(user, 'seccional', None)
    if seccional is not None:
        return seccional
    sede = getattr(user, 'sede', None)
    return getattr(sede, 'seccional', None) if sede else None


def seccional_para_sesion(user):
    """Seccional del usuario como la entrega la sesión al frontend: {id, ciudad} o None."""
    seccional = seccional_de_usuario(user)
    return {'id': seccional.id, 'ciudad': seccional.ciudad} if seccional else None


def get_user_seccional_id(user):
    if not user:
        return None

    seccional_id = getattr(user, 'seccional_id', None)
    if seccional_id:
        return seccional_id

    sede = getattr(user, 'sede', None)
    return getattr(sede, 'seccional_id', None)


def q_usuarios_de_seccional(seccional_id, prefijo=''):
    """Personas que pertenecen a una seccional: por su seccional o, si no la tienen, por la de su sede."""
    from django.db.models import Q

    return Q(**{f'{prefijo}seccional_id': seccional_id}) | Q(
        **{f'{prefijo}seccional__isnull': True, f'{prefijo}sede__seccional_id': seccional_id}
    )


def puede_ver_usuario(solicitante, objetivo):
    """True si `solicitante` puede consultar los datos de `objetivo`: los propios, o los de las personas que
    administra (el administrador general, todas; el de una seccional, solo las de su seccional)."""
    if not solicitante or not objetivo:
        return False
    if getattr(solicitante, 'pk', None) == getattr(objetivo, 'pk', None):
        return True
    if is_admin_global(solicitante):
        return True
    if is_admin_sistema(solicitante):
        propia = get_user_seccional_id(solicitante)
        return propia is not None and get_user_seccional_id(objetivo) == propia
    return False


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


def componentes_de_rol_efectivos(usuario):
    """Filas de ComponenteRol que valen para el usuario: la plantilla general de su rol más los ajustes de
    su seccional. Para un mismo componente el ajuste de la seccional reemplaza a la plantilla, y un ajuste
    «Sin acceso» lo quita. Los ajustes de otras seccionales no cuentan."""
    rol = getattr(usuario, 'rol', None)
    if not rol:
        return []

    from django.db.models import Q

    from componentes.models import ComponenteRol

    filtro = Q(seccional__isnull=True)
    seccional_id = get_user_seccional_id(usuario)
    if seccional_id:
        filtro |= Q(seccional_id=seccional_id)
    filas = sorted(
        ComponenteRol.objects.filter(rol=rol).filter(filtro).select_related('componente'),
        key=lambda f: (f.seccional_id is not None, f.id),  # la plantilla primero; el ajuste de la seccional gana
    )
    por_componente = {fila.componente_id: fila for fila in filas}
    return [fila for fila in por_componente.values() if fila.permiso != 'NINGUNO']


def get_componente_permiso(user, nombre_componente):
    """Resuelve el permiso efectivo ('VER'/'EDITAR'/None) de `user` sobre el
    Componente `nombre_componente`, replicando la precedencia usada por
    usuarios.viewsets para construir la lista de componentes del frontend:
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

    from componentes.models import Componente, ComponenteUsuario

    try:
        componente = Componente.objects.get(nombre=nombre_componente)
    except Componente.DoesNotExist:
        return None

    override = ComponenteUsuario.objects.filter(usuario=user, componente=componente).first()

    rol = getattr(user, 'rol', None)
    cr = next((f for f in componentes_de_rol_efectivos(user) if f.componente_id == componente.id), None) if rol else None

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


def construir_componentes(usuario):
    """Lista de componentes que recibe el frontend (login y session-auth-state).

    La usan `usuarios/sesion.py` (login y session-auth-state de `usuarios.viewsets.UsuarioViewSet`,
    también publicadas en /usuarios/<ruta>/, a donde nginx reescribe /api/usuarios/<ruta>/) y los permisos
    financieros.
    Precedencia: el permiso individual (ComponenteUsuario) reemplaza al del rol, uno inactivo lo
    revoca, y uno activo sin permiso de rol concede el acceso. Además, quien es responsable de
    algún chatbot recibe «Gestión de Documentación de Chatbots» (EDITAR) salvo revocación expresa.
    Un usuario sin rol no recibe ningún componente.
    """
    if not usuario or not getattr(usuario, 'rol', None):
        return []

    from componentes.models import Componente, ComponenteUsuario

    componentes_rol = componentes_de_rol_efectivos(usuario)
    componentes_usuario = list(ComponenteUsuario.objects.filter(usuario=usuario).select_related('componente'))
    overrides = {item.componente_id: item for item in componentes_usuario}

    componentes_por_id = {}
    for cr in componentes_rol:
        override = overrides.get(cr.componente_id)
        if override and not override.activo:
            continue
        componentes_por_id[cr.componente.id] = {
            'id': cr.componente.id,
            'nombre': cr.componente.nombre,
            'descripcion': cr.componente.descripcion,
            'permiso': override.permiso if override else cr.permiso,
        }

    for override in componentes_usuario:
        if override.activo and override.componente_id not in componentes_por_id:
            componentes_por_id[override.componente_id] = {
                'id': override.componente.id,
                'nombre': override.componente.nombre,
                'descripcion': override.componente.descripcion,
                'permiso': override.permiso,
            }

    if es_responsable_de_chatbots(usuario):
        documentacion = Componente.objects.filter(nombre=COMPONENTE_DOCUMENTACION_CHATBOTS).first()
        if documentacion:
            actual = componentes_por_id.get(documentacion.id)
            revocado = any(o.componente_id == documentacion.id and not o.activo for o in componentes_usuario)
            if not revocado and (actual is None or actual['permiso'] != 'EDITAR'):
                componentes_por_id[documentacion.id] = {
                    'id': documentacion.id,
                    'nombre': documentacion.nombre,
                    'descripcion': documentacion.descripcion,
                    'permiso': 'EDITAR',
                }

    return list(componentes_por_id.values())


def user_can_edit_componente(user, nombre_componente):
    return get_componente_permiso(user, nombre_componente) == 'EDITAR'
