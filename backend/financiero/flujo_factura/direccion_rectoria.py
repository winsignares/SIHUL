"""Pasos de Dirección Financiera y Rectoría: cargue, envío, autorización o rechazo y control de pago."""
from django.db import IntegrityError
from django.utils import timezone

from .. import models
from ..sla import actualizar_sla_factura
from ._base import (
    _agregar_observacion, _avanzar, _exigir_estado, _exigir_motivo, _hoy, _texto,
    ESTADO_AUTORIZADA, ESTADO_CARGADA, ESTADO_DEVUELTA, ESTADO_ENVIADA_RECTORIA, ESTADO_RECHAZADA_POR_RECTORIA,
    ESTADO_REVISADA_DIRECCION_FINANCIERA, PasoRechazado, estado_es, registrar_historial,
)

def cargar_direccion_financiera(factura, usuario, datos):
    """Registrar el cargue formal en Dirección Financiera antes de rectoría."""
    estados = [ESTADO_REVISADA_DIRECCION_FINANCIERA, ESTADO_DEVUELTA, ESTADO_RECHAZADA_POR_RECTORIA]
    if not any(estado_es(factura.estado, estado) for estado in estados):
        raise PasoRechazado('La factura debe estar revisada o devuelta para ser cargada en Dirección Financiera')
    return _avanzar(factura, usuario, estado=ESTADO_CARGADA, etapa='Autorización de Pago', fecha='fecha_cargue',
                    accion='Factura cargada en dirección financiera', observacion=_texto(datos, 'observaciones'),
                    etiqueta='Dirección Financiera')


def enviar_rectoria(factura, usuario, datos):
    if not estado_es(factura.estado, ESTADO_CARGADA):
        raise PasoRechazado('La factura debe estar cargada para enviarla a Rectoría')
    return _avanzar(factura, usuario, estado=ESTADO_ENVIADA_RECTORIA, etapa='Autorización de Pago',
                    fecha='fecha_envio_rectoria', accion='Factura enviada a rectoría',
                    observacion=_texto(datos, 'observaciones'), etiqueta='Dirección Financiera - Envío')


def autorizar_rectoria(factura, usuario, datos):
    if not estado_es(factura.estado, ESTADO_ENVIADA_RECTORIA):
        raise PasoRechazado('La factura debe estar enviada a Rectoría para autorizarla')
    return _avanzar(factura, usuario, estado=ESTADO_AUTORIZADA, etapa='Aplicación de Pago', fecha='fecha_autorizacion',
                    accion='Factura autorizada por Rectoría', observacion=_texto(datos, 'observaciones'),
                    etiqueta='Rectoría')


def rechazar_rectoria(factura, usuario, datos):
    if not estado_es(factura.estado, ESTADO_ENVIADA_RECTORIA):
        raise PasoRechazado('La factura debe estar enviada a Rectoría para rechazarla')
    motivo = _exigir_motivo(datos, 'motivo', 'Debe registrar un motivo de rechazo (mínimo 10 caracteres)')
    return _avanzar(factura, usuario, estado=ESTADO_RECHAZADA_POR_RECTORIA, etapa='Corrección Dirección Financiera',
                    responsable=None, accion='Factura rechazada por rectoría', observacion=motivo,
                    etiqueta='Rectoría - Rechazo', rechazo_en='Rectoría')


def _siguiente_numero_confirmacion():
    prefijo = f"CONF-{timezone.now().year}-"
    ultimo = (
        models.Factura.objects
        .filter(numero_confirmacion__startswith=prefijo)
        .order_by('-numero_confirmacion')
        .values_list('numero_confirmacion', flat=True)
        .first()
    )
    siguiente = 1
    if ultimo:
        try:
            siguiente = int(str(ultimo).split('-')[-1]) + 1
        except (TypeError, ValueError):
            siguiente = 1
    return f"{prefijo}{siguiente:04d}"


def asignar_numero_confirmacion(factura, mensaje_conflicto):
    """Asigna CONF-<año>-<consecutivo> si la factura no tiene número; reintenta si otro proceso lo toma."""
    if factura.numero_confirmacion:
        return
    for _ in range(5):
        factura.numero_confirmacion = _siguiente_numero_confirmacion()
        try:
            factura.save(update_fields=['numero_confirmacion'])
            return
        except IntegrityError:
            factura.numero_confirmacion = None
    raise PasoRechazado(mensaje_conflicto, codigo=409)


def generar_numero_confirmacion(factura, usuario, datos):
    """Generar y persistir el numero de confirmacion antes de confirmar el control."""
    _exigir_estado(factura, ['Autorizada'], 'La factura debe estar autorizada para generar el numero de confirmacion')
    asignar_numero_confirmacion(factura, 'No fue posible generar un numero de confirmacion unico')
    return factura


def confirmar_control_pago(factura, usuario, datos):
    """Registrar control de pago sin cerrar la etapa de pago aplicado (no cambia el estado ni notifica)."""
    _exigir_estado(factura, ['Autorizada'], 'La factura debe estar autorizada para confirmar control de pago')
    observaciones = _texto(datos, 'observaciones')
    asignar_numero_confirmacion(factura, 'No fue posible generar un número de confirmación único')

    factura.etapa_actual = 'Control de Pago Bancario'
    factura.fecha_inicio_etapa = _hoy()
    factura.usuario_responsable = usuario
    if observaciones:
        _agregar_observacion(factura, 'Control Pago', observaciones)
    factura.save()

    actualizar_sla_factura(factura)
    registrar_historial(factura, usuario, 'Control de pago bancario confirmado', 'Autorizada',
                        'Control de Pago Bancario', observaciones or None,
                        datos_adicionales={'numero_confirmacion': factura.numero_confirmacion})
    return factura
