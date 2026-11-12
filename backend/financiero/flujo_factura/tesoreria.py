"""Pasos de Tesorería: alistar, detener, enviar a Dirección Financiera y cerrar como pagada."""
from .. import models
from ._base import _avanzar, _exigir_estado, _exigir_motivo, _hoy, _texto, PasoRechazado

def alistar(factura, usuario, datos):
    _exigir_estado(factura, ['Radicada', 'Causada', 'Detenida'], 'La factura debe estar causada o detenida en tesorería')

    numero_proceso_pago = _texto(datos, 'numero_proceso_pago')
    archivo_plano_generado = _texto(datos, 'archivo_plano_generado')
    observaciones = _texto(datos, 'observaciones')

    if not numero_proceso_pago and not archivo_plano_generado:
        raise PasoRechazado('Debe registrar el número de proceso de pago o un archivo plano generado')

    if numero_proceso_pago:
        duplicado = models.Factura.objects.filter(numero_proceso_pago=numero_proceso_pago).exclude(pk=factura.pk).first()
        if duplicado:
            raise PasoRechazado(
                f'El número de proceso de pago "{numero_proceso_pago}" ya está registrado en la factura '
                f'{duplicado.numero_factura}. Cada proceso de pago debe ser único.'
            )
        factura.numero_proceso_pago = numero_proceso_pago
    if archivo_plano_generado:
        factura.archivo_plano_generado = archivo_plano_generado

    return _avanzar(factura, usuario, estado='Alistada', etapa='Control Previo', fecha='fecha_alistamiento',
                    accion='Factura alistada', observacion=observaciones, etiqueta='Tesorería')


def detener_en_tesoreria(factura, usuario, datos):
    _exigir_estado(factura, ['Causada', 'Detenida'], 'Solo se pueden detener facturas en estado Causada o Detenida')
    observaciones = _exigir_motivo(datos, 'observaciones', 'Debe registrar una observación de al menos 10 caracteres')
    return _avanzar(factura, usuario, estado='Detenida', etapa='Tesorería - Ajustes internos',
                    accion='Factura detenida en tesorería', observacion=observaciones, etiqueta='Tesorería - Detenida')


def enviar_direccion_financiera(factura, usuario, datos):
    _exigir_estado(factura, ['Aprobada Auditoría'], 'La factura debe estar aprobada por Auditoría')
    return _avanzar(factura, usuario, estado='Revisada Dir. Financiera', etapa='Cargue Formal',
                    fecha='fecha_revision_direccion', accion='Factura enviada a Dirección Financiera',
                    observacion=_texto(datos, 'observaciones'), etiqueta='Tesorería')


def generar_comprobante(factura, usuario, datos):
    """Compatibilidad: cerrar facturas antiguas en Pago Aplicado como Pagada."""
    _exigir_estado(factura, ['Pago Aplicado', 'Pagada'], 'La factura debe estar con pago aplicado o pagada')
    numero_comprobante = _texto(datos, 'numero_comprobante')
    if numero_comprobante:
        factura.numero_comprobante = numero_comprobante
    factura.fecha_comprobante = factura.fecha_comprobante or factura.fecha_pago_aplicado or _hoy()
    return _avanzar(factura, usuario, estado='Pagada', etapa='Pago Aplicado', inicio_etapa=factura.fecha_comprobante,
                    accion='Factura marcada como pagada', observacion=_texto(datos, 'observaciones'),
                    etiqueta='Tesorería')
