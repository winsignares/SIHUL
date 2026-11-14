"""
Reglas de aprobación de préstamos (internos y públicos).

No reciben la petición HTTP: reciben el usuario que actúa y los datos, así se pueden usar y probar fuera de
los serializers.
"""
from nucleo.auth_helpers import user_can_edit_componente

from . import privacidad

COMPONENTE_DISPONIBILIDAD_ESPACIOS = 'Disponibilidad de Espacios'


def proteger_aprobacion(attrs, instance, usuario):
    """Solo quien gestiona préstamos aprueba o asigna administrador. Quien solicita (docente, público) crea el
    préstamo «Pendiente», y si edita uno ya aprobado vuelve a quedar pendiente para que se reapruebe."""
    if privacidad.puede_aprobar_prestamos(usuario):
        return
    attrs.pop('administrador', None)
    if instance is None:
        attrs['estado'] = 'Pendiente'
    else:
        attrs['estado'] = 'Pendiente' if instance.estado == 'Aprobado' else instance.estado


def reevaluar_estado_si_estaba_aprobado(estado_original, estado_actual, validated_data, usuario):
    """Si se edita un préstamo que estaba Aprobado y el estado enviado sigue siendo Aprobado (es decir, no es una
    acción explícita de aprobar/rechazar a otro estado), lo mantiene Aprobado solo cuando quien edita tiene
    permiso EDITAR en "Disponibilidad de Espacios"; de lo contrario lo regresa a Pendiente para que sea
    reaprobado.

    `estado_original` es el estado antes de la edición; `estado_actual`, el de la instancia ya con los datos
    nuevos copiados (se usa cuando no se envía estado).
    """
    if estado_original != 'Aprobado':
        return
    if validated_data.get('estado', estado_actual) != 'Aprobado':
        return
    if not user_can_edit_componente(usuario, COMPONENTE_DISPONIBILIDAD_ESPACIOS):
        validated_data['estado'] = 'Pendiente'


def recursos_repetidos(recursos):
    """Si en la solicitud se pide el mismo recurso más de una vez."""
    recurso_ids = [item['recurso'].id for item in recursos]
    return len(recurso_ids) != len(set(recurso_ids))
