from nucleo.auth_helpers import get_role_name, get_user_seccional_id, is_admin_global, is_admin_sistema, ve_todas_las_seccionales
from nucleo.roles_financieros import normalizar


def debe_recibir(evento, usuario):
    """Quién recibe un evento:
    - uno con destinatarios (`usuarios` o `roles`, como los del módulo financiero), solo esas personas, quienes
      tienen alguno de esos roles y los administradores;
    - uno personal (por ejemplo una notificación), solo su dueño;
    - uno de una seccional, el administrador general y quienes son de esa seccional;
    - uno sin seccional (catálogos globales), todos los usuarios con sesión.
    """
    if 'usuarios' in evento or 'roles' in evento:
        if usuario.id in (evento.get('usuarios') or ()):
            return True
        if is_admin_global(usuario) or is_admin_sistema(usuario):
            return True
        return normalizar(get_role_name(usuario)) in (evento.get('roles') or ())
    if evento.get('usuario') is not None:
        return evento['usuario'] == usuario.id
    seccional = evento.get('seccional')
    if seccional is None or ve_todas_las_seccionales(usuario):
        return True
    return seccional == get_user_seccional_id(usuario)
