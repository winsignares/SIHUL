"""Pasos que suben archivos: causar y registrar el pago aplicado."""
import logging

from django.db import IntegrityError, transaction
from django.utils.dateparse import parse_date

from .. import models
from ..sla import actualizar_sla_factura
from ._base import (
    _agregar_observacion, _avanzar, _exigir_estado, _hoy, _texto,
    PasoRechazado, notificar_transicion, registrar_historial,
)

logger = logging.getLogger('financiero.flujo_factura')

def causar(factura, usuario, datos, soporte, guardar_soporte, regenerar_pdf):
    """Causa la factura radicada con el soporte PDF de Seven.

    `guardar_soporte(factura, archivo, nombre)` lo guarda en la carpeta compartida (lanza `PasoRechazado` si no puede)
    y `regenerar_pdf(factura)` rehace el PDF unificado después de guardar la factura.
    """
    if factura.estado != 'Radicada':
        raise PasoRechazado('La factura debe estar radicada')

    observaciones = datos.get('observaciones', '')
    if not soporte:
        raise PasoRechazado('Debe adjuntar el soporte PDF de causacion en Seven.')

    nombre_archivo = getattr(soporte, 'name', 'soporte_causacion_seven.pdf') or 'soporte_causacion_seven.pdf'
    if not nombre_archivo.lower().endswith('.pdf'):
        raise PasoRechazado('El soporte de causacion debe estar en formato PDF.')
    guardar_soporte(factura, soporte, nombre_archivo)

    return _avanzar(factura, usuario, estado='Causada', etapa='Alistamiento', fecha='fecha_causacion',
                    accion='Factura causada', observacion=observaciones, al_guardar=regenerar_pdf)


def registrar_pago_aplicado(factura, usuario, datos, comprobante, guardar_comprobante, regenerar_pdf):
    """Registra el pago aplicado y deja la factura Pagada; todo o nada.

    `guardar_comprobante(factura, archivo)` valida y guarda el comprobante (lanza `PasoRechazado` si no puede);
    `regenerar_pdf(factura)` rehace el PDF unificado.
    """
    _exigir_estado(factura, ['Autorizada'], 'La factura debe estar autorizada para pago')
    if not factura.numero_confirmacion:
        raise PasoRechazado(
            'Debe confirmar el control de pago en Dirección Financiera antes de registrar el pago aplicado')

    numero_transaccion = _texto(datos, 'numero_transaccion')
    observaciones = _texto(datos, 'observaciones')
    fecha_pago = datos.get('fecha_pago_aplicado')
    fecha_pago_parsed = None
    if fecha_pago:
        fecha_pago_parsed = parse_date(str(fecha_pago))
        if not fecha_pago_parsed:
            raise PasoRechazado('La fecha de pago aplicado no es valida. Use el formato YYYY-MM-DD.')

    if not numero_transaccion:
        raise PasoRechazado('Debe registrar el número de transacción bancaria')
    if models.Factura.objects.filter(numero_transaccion=numero_transaccion).exclude(pk=factura.pk).exists():
        raise PasoRechazado('El número de transacción bancaria ya está registrado en otra factura.')
    if not comprobante:
        raise PasoRechazado('Debe adjuntar el comprobante bancario en archivo (PDF/XML/PNG/JPG).')

    estado_anterior = factura.estado
    try:
        with transaction.atomic():
            factura.numero_transaccion = numero_transaccion
            factura.fecha_pago_aplicado = fecha_pago_parsed or _hoy()
            factura.fecha_comprobante = factura.fecha_pago_aplicado
            factura.estado = 'Pagada'
            factura.etapa_actual = 'Pago Aplicado'
            factura.fecha_inicio_etapa = factura.fecha_pago_aplicado
            factura.usuario_responsable = usuario
            if observaciones:
                _agregar_observacion(factura, 'Tesorería', observaciones)
            factura.save()

            actualizar_sla_factura(factura)
            guardar_comprobante(factura, comprobante)
            regenerar_pdf(factura)

            registrar_historial(factura, usuario, 'Pago aplicado y factura pagada', estado_anterior, 'Pagada',
                                observaciones or None)
            notificar_transicion(factura, estado_anterior, 'Pagada')
    except IntegrityError:
        raise PasoRechazado('El número de transacción bancaria ya está registrado en otra factura.')
    except PasoRechazado:
        raise
    except Exception as exc:
        logger.exception('Error registrando pago aplicado factura_id=%s', factura.id)
        raise PasoRechazado('No fue posible registrar el pago aplicado.', codigo=500, detail=str(exc))
    return factura
