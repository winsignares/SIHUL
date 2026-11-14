from nucleo.auth_helpers import get_user_seccional_id, ve_todas_las_seccionales


def debe_recibir(evento, usuario):
    """Quién recibe un evento:
    - uno personal, solo su dueño;
    - uno de una seccional, el administrador general y quienes son de esa seccional;
    - uno sin seccional (catálogos globales), todos los usuarios con sesión.
    """
    if evento.get('usuario') is not None:
        return evento['usuario'] == usuario.id
    seccional = evento.get('seccional')
    if seccional is None or ve_todas_las_seccionales(usuario):
        return True
    return seccional == get_user_seccional_id(usuario)
