"""Reglas para aceptar un registro de asistencia. La ubicación solo se guarda dentro del horario de la práctica."""
from django.utils import timezone

from ..models import RegistroAsistencia
from . import consentimiento
from .errores import ErrorAsistencia
from .geografia import distancia_metros
from .notificacion import avisar_salida_del_radio


def _ultimo_movimiento_del_dia(asignacion, hoy):
    """Último registro de entrada o salida del día: si es una entrada, la persona sigue dentro."""
    return (
        asignacion.registros
        .filter(registrado_en__date=hoy, tipo__in=[RegistroAsistencia.TIPO_ENTRADA, RegistroAsistencia.TIPO_SALIDA])
        .order_by('-registrado_en').first()
    )


def _validar_ventana(asignacion, ahora):
    if not asignacion.activa or not asignacion.lugar.activo:
        raise ErrorAsistencia('asignacion_inactiva', 'La práctica no está activa.', 403)
    local = timezone.localtime(ahora)
    dentro_de_fechas = asignacion.fecha_inicio <= local.date() <= asignacion.fecha_fin
    dentro_de_horario = asignacion.hora_inicio <= local.time() <= asignacion.hora_fin
    if not (dentro_de_fechas and dentro_de_horario):
        raise ErrorAsistencia('fuera_de_horario', 'Solo se registra la ubicación dentro del horario de la práctica.')


def registrar(asignacion, tipo, latitud, longitud, precision_metros, ahora=None):
    ahora = ahora or timezone.now()
    if not consentimiento.vigente(asignacion.estudiante):
        raise ErrorAsistencia('sin_consentimiento', 'Falta el consentimiento para registrar la ubicación.', 403)
    _validar_ventana(asignacion, ahora)

    lugar = asignacion.lugar
    if precision_metros > lugar.precision_maxima_metros:
        raise ErrorAsistencia('precision_insuficiente', 'La lectura de ubicación no es lo bastante precisa.')
    distancia = distancia_metros(latitud, longitud, lugar.latitud, lugar.longitud)
    dentro = distancia <= lugar.radio_metros

    hoy = timezone.localtime(ahora).date()
    ultimo = _ultimo_movimiento_del_dia(asignacion, hoy)
    esta_dentro = ultimo is not None and ultimo.tipo == RegistroAsistencia.TIPO_ENTRADA
    if tipo == RegistroAsistencia.TIPO_ENTRADA:
        if esta_dentro:
            raise ErrorAsistencia('entrada_abierta', 'Ya hay una entrada registrada sin salida.', 409)
        if not dentro:
            raise ErrorAsistencia('fuera_del_radio', 'Estás fuera del lugar de práctica.')
    elif not esta_dentro:
        raise ErrorAsistencia('sin_entrada', 'Primero debes registrar la entrada.', 409)
    elif tipo == RegistroAsistencia.TIPO_SALIDA and not dentro:
        raise ErrorAsistencia('fuera_del_radio', 'Estás fuera del lugar de práctica.')

    estaba_dentro = True
    if tipo == RegistroAsistencia.TIPO_POSICION:
        previo = asignacion.registros.filter(registrado_en__date=hoy).order_by('-registrado_en').first()
        estaba_dentro = previo.dentro_del_radio if previo else True

    registro = RegistroAsistencia.objects.create(
        asignacion=asignacion, tipo=tipo, latitud=latitud, longitud=longitud,
        precision_metros=precision_metros, distancia_metros=distancia, dentro_del_radio=dentro,
    )
    if tipo == RegistroAsistencia.TIPO_POSICION and estaba_dentro and not dentro:
        avisar_salida_del_radio(asignacion, distancia)
    return registro
