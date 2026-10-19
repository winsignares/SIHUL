"""
Alcance de un supervisor de espacios: qué espacios puede gestionar y si puede crearlos.

Un usuario cuyo rol supervisa espacios (y no es superusuario) solo puede gestionar lo que se le
asignó, de dos formas:

- **Asignación por tipo** (`TipoEspacioPermitido`): todos los espacios de ese tipo en su sede,
  también los que se creen después. Es la única que permite CREAR espacios, y solo de esos
  tipos. Sus `EspacioPermitido` derivados (individual=False) los mantiene `sincronizar_por_tipos`.
- **Asignación individual** (`EspacioPermitido` con individual=True): solo esos espacios; puede
  consultarlos, editarlos y gestionar sus préstamos, pero no crear ni tocar ningún otro.

Ambas se pueden combinar: un supervisor con un tipo asignado y, además, espacios sueltos de otros
tipos gestiona los espacios de su tipo y esos espacios; crear solo puede los de sus tipos.

Los demás usuarios (admins, superusuarios, quienes no supervisan espacios) no se ven afectados por
estas reglas. «Supervisa espacios» lo decide solo la casilla del rol (`Rol.supervisa_espacios`).
"""
from config.auth_helpers import is_superuser_effective, user_supervisa_espacios

from .models import EspacioFisico, EspacioPermitido, TipoEspacioPermitido

MSG_SIN_SEDE = 'Tu usuario no tiene una sede asignada.'
MSG_OTRA_SEDE = 'Solo puedes gestionar espacios de tu sede.'
MSG_SOLO_INDIVIDUAL = 'Tienes asignados espacios individuales: no puedes crear espacios nuevos.'
MSG_TIPO_NO_ASIGNADO = 'Solo puedes gestionar espacios de los tipos que tienes asignados.'
MSG_ESPACIO_NO_ASIGNADO = 'No tienes permiso para gestionar este espacio.'


def esta_restringido(user) -> bool:
    """
    True si el usuario tiene un rol marcado como «Supervisor de espacios» (casilla del rol) y por
    tanto solo gestiona lo que se le asignó. Depende únicamente de esa casilla, no del nombre del
    rol; los superusuarios quedan fuera.
    """
    return bool(user) and user_supervisa_espacios(user) and not is_superuser_effective(user)


def tipos_ids(user) -> set[int]:
    return set(TipoEspacioPermitido.objects.filter(usuario=user).values_list('tipo_id', flat=True))


def espacios_ids(user) -> set[int]:
    return set(EspacioPermitido.objects.filter(usuario=user).values_list('espacio_id', flat=True))


def resumen_sesion(user) -> dict:
    """Lo que el frontend necesita saber del alcance del usuario (tipos asignados y si puede crear)."""
    restringido = esta_restringido(user)
    tipos = sorted(tipos_ids(user)) if restringido else []
    return {
        'tipos_espacio_permitidos': tipos,
        'puede_crear_espacios': not restringido or bool(tipos),
    }


def individuales_ids(user) -> set[int]:
    """Espacios asignados a mano (no derivados de un tipo)."""
    return set(EspacioPermitido.objects.filter(usuario=user, individual=True).values_list('espacio_id', flat=True))


def puede_crear_espacios(user) -> bool:
    """Si puede crear espacios en general (los no restringidos sí; los supervisores, solo con tipos)."""
    return not esta_restringido(user) or bool(tipos_ids(user))


def puede_gestionar_espacio(user, espacio_id) -> bool:
    if not esta_restringido(user):
        return True
    return int(espacio_id) in espacios_ids(user)


def motivo_no_puede_crear(user, tipo_id, sede_id) -> str | None:
    """Mensaje de por qué no puede crear un espacio de ese tipo en esa sede; None si puede."""
    if not esta_restringido(user):
        return None
    if not getattr(user, 'sede_id', None):
        return MSG_SIN_SEDE
    if sede_id is None or int(sede_id) != user.sede_id:
        return MSG_OTRA_SEDE
    permitidos = tipos_ids(user)
    if not permitidos:
        return MSG_SOLO_INDIVIDUAL
    if tipo_id is None or int(tipo_id) not in permitidos:
        return MSG_TIPO_NO_ASIGNADO
    return None


def motivo_no_puede_actualizar(user, espacio, tipo_id=None, sede_id=None) -> str | None:
    """
    Mensaje de por qué no puede editar el espacio (o dejarlo con ese tipo y sede); None si puede.
    `tipo_id` y `sede_id` son los valores resultantes de la edición (None si no cambian).
    """
    if not esta_restringido(user):
        return None
    if espacio.id not in espacios_ids(user):
        return MSG_ESPACIO_NO_ASIGNADO
    if sede_id is not None and int(sede_id) != espacio.sede_id:
        return MSG_OTRA_SEDE
    permitidos = tipos_ids(user)
    if (
        tipo_id is not None
        and permitidos
        and int(tipo_id) not in permitidos
        and espacio.id not in individuales_ids(user)  # uno asignado a mano puede cambiar de tipo
    ):
        return MSG_TIPO_NO_ASIGNADO
    return None


def sincronizar_por_tipos(usuario) -> None:
    """
    Pone al día los `EspacioPermitido` DERIVADOS del usuario (individual=False): quedan iguales a
    los espacios de sus tipos asignados en su sede. Las asignaciones individuales no se tocan, y un
    espacio que ya tiene asignación individual no se duplica como derivado.
    """
    tipos = tipos_ids(usuario)
    sede_id = getattr(usuario, 'sede_id', None)
    deseados = set(
        EspacioFisico.objects.filter(sede_id=sede_id, tipo_id__in=tipos).values_list('id', flat=True)
    ) if tipos and sede_id else set()

    filas = list(EspacioPermitido.objects.filter(usuario=usuario).values_list('id', 'espacio_id', 'individual'))
    individuales = {espacio_id for _, espacio_id, individual in filas if individual}
    derivadas = {espacio_id: fila_id for fila_id, espacio_id, individual in filas if not individual}

    sobran = [fila_id for espacio_id, fila_id in derivadas.items() if espacio_id not in deseados or espacio_id in individuales]
    if sobran:
        EspacioPermitido.objects.filter(id__in=sobran).delete()
    faltan = deseados - individuales - set(derivadas)
    if faltan:
        EspacioPermitido.objects.bulk_create(
            [EspacioPermitido(usuario=usuario, espacio_id=espacio_id, individual=False) for espacio_id in faltan]
        )


def asignar_tipos(usuario, ids) -> None:
    """Reemplaza los tipos asignados al usuario (lista vacía = sin asignación por tipo)."""
    ids = set(int(i) for i in ids)
    TipoEspacioPermitido.objects.filter(usuario=usuario).exclude(tipo_id__in=ids).delete()
    existentes = tipos_ids(usuario)
    TipoEspacioPermitido.objects.bulk_create(
        [TipoEspacioPermitido(usuario=usuario, tipo_id=tipo_id) for tipo_id in ids - existentes]
    )
    sincronizar_por_tipos(usuario)


def resincronizar_por_espacio(espacio) -> None:
    """
    Tras crear o cambiar un espacio, pone al día a los supervisores por tipo a los que afecta:
    los que tienen asignado su tipo en su sede y los que lo tenían (si cambió de tipo o sede).
    """
    from unispace.usuarios.models import Usuario

    afectados = (
        Usuario.objects.filter(tipos_espacio_permitidos__tipo_id=espacio.tipo_id, sede_id=espacio.sede_id)
        | Usuario.objects.filter(espacios_permitidos__espacio=espacio, espacios_permitidos__individual=False)
    ).distinct()
    for usuario in afectados:
        sincronizar_por_tipos(usuario)
