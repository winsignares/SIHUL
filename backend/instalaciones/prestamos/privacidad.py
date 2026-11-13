"""Quién ve datos personales de un préstamo y quién puede aprobarlo.

- Un préstamo lo APRUEBA quien gestiona préstamos (permiso EDITAR en «Préstamos de Espacios» o «Disponibilidad de
  Espacios») o el administrador general. Quien solo lo solicita (docente, público) lo crea siempre «Pendiente».
- Los datos personales del solicitante (nombre, correo, teléfono, identificación) los ven quienes administran
  préstamos y el propio solicitante. Para el resto, el calendario muestra solo espacio, fecha, hora y estado.
- Un solicitante público se identifica con su correo y su identificación (query `correo` e `identificacion`).
"""
from mysite.auth_helpers import is_admin_global, is_admin_sistema, is_authenticated_user, user_can_edit_componente

from instalaciones.espacios import alcance

COMPONENTES_DE_GESTION = ('Préstamos de Espacios', 'Disponibilidad de Espacios')

CAMPOS_PERSONALES_PRIVADO = ('usuario_nombre', 'usuario_correo', 'telefono', 'administrador_nombre')
CAMPOS_PERSONALES_PUBLICO = (
    'nombre_solicitante', 'correo_solicitante', 'telefono_solicitante', 'identificacion_solicitante',
    'solicitante_publico_nombre', 'solicitante_publico_correo', 'solicitante_publico_telefono',
    'solicitante_publico_identificacion', 'token_publico', 'administrador_nombre',
)


def puede_aprobar_prestamos(user) -> bool:
    """True si `user` puede aprobar, rechazar o asignar administrador a un préstamo."""
    if not is_authenticated_user(user):
        return False
    return is_admin_global(user) or any(user_can_edit_componente(user, c) for c in COMPONENTES_DE_GESTION)


def administra_prestamos(user) -> bool:
    """True si `user` ve los datos de contacto de los solicitantes de su alcance."""
    if not is_authenticated_user(user):
        return False
    return (
        is_admin_global(user)
        or is_admin_sistema(user)
        or alcance.esta_restringido(user)
        or puede_aprobar_prestamos(user)
    )


def _normalizar_correo(valor) -> str:
    return (valor or '').strip().lower()


def credenciales_de_solicitante(request):
    """(correo, identificación) que el solicitante público envía en la consulta; vacío si no los envió."""
    params = getattr(request, 'query_params', None) or getattr(request, 'GET', {})
    return _normalizar_correo(params.get('correo')), (params.get('identificacion') or '').strip()


def coincide_solicitante_publico(request, prestamo) -> bool:
    """True si la petición trae el correo y la identificación con los que se hizo esta solicitud pública."""
    correo, identificacion = credenciales_de_solicitante(request)
    if not correo or not identificacion:
        return False
    return (
        correo == _normalizar_correo(prestamo.correo_solicitante)
        and identificacion == (prestamo.identificacion_solicitante or '').strip()
    )


def ocultar_campos(datos: dict, campos) -> dict:
    for campo in campos:
        if campo in datos:
            datos[campo] = ''
    return datos
