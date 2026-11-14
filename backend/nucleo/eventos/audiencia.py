from dataclasses import dataclass

from nucleo.auth_helpers import get_role_name, get_user_seccional_id, is_admin_global, is_admin_sistema, ve_todas_las_seccionales
from nucleo.roles_financieros import normalizar


@dataclass(frozen=True)
class Perfil:
    """Lo que hace falta saber de una persona para decidir qué eventos recibe. Se calcula una vez al abrir la
    conexión, para no tocar la base de datos mientras dura."""

    id: int
    rol: str
    seccional_id: int | None
    ve_todas: bool
    es_admin: bool


def perfil_de(usuario):
    return Perfil(
        id=usuario.id,
        rol=normalizar(get_role_name(usuario)),
        seccional_id=get_user_seccional_id(usuario),
        ve_todas=bool(ve_todas_las_seccionales(usuario)),
        es_admin=bool(is_admin_global(usuario) or is_admin_sistema(usuario)),
    )


def debe_recibir(evento, usuario_o_perfil):
    """Quién recibe un evento:
    - uno con destinatarios (`usuarios` o `roles`, como los del módulo financiero), solo esas personas, quienes
      tienen alguno de esos roles y los administradores;
    - uno personal (por ejemplo una notificación), solo su dueño;
    - uno de una seccional, el administrador general y quienes son de esa seccional;
    - uno sin seccional (catálogos globales), todos los usuarios con sesión.
    """
    perfil = usuario_o_perfil if isinstance(usuario_o_perfil, Perfil) else perfil_de(usuario_o_perfil)
    if 'usuarios' in evento or 'roles' in evento:
        if perfil.id in (evento.get('usuarios') or ()):
            return True
        if perfil.es_admin:
            return True
        return perfil.rol in (evento.get('roles') or ())
    if evento.get('usuario') is not None:
        return evento['usuario'] == perfil.id
    seccional = evento.get('seccional')
    if seccional is None or perfil.ve_todas:
        return True
    return seccional == perfil.seccional_id
