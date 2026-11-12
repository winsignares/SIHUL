"""Pasos de Contabilidad: radicación de la factura y soportes que exige."""
from .. import models
from ..sla import actualizar_sla_factura
from ._base import (
    _exigir_estado, _hoy, _texto,
    PasoRechazado, SOPORTES_RADICACION, ciclo_documental_actual, notificar_transicion, registrar_historial,
)

def faltantes_radicacion(factura):
    """Soportes obligatorios que faltan en el ciclo documental actual."""
    documentos = list(models.DocumentoAdjunto.objects.filter(
        factura=factura, ciclo_documental=ciclo_documental_actual(factura)))

    def cumple(documento, tipo_requerido, palabras):
        if _texto_normalizado(getattr(documento, 'tipo_documento', '')) == _texto_normalizado(tipo_requerido):
            return True
        nombre = _texto_normalizado(getattr(documento, 'nombre_archivo', ''))
        return any(palabra in nombre for palabra in palabras)

    return [tipo for tipo, palabras in SOPORTES_RADICACION.items()
            if not any(cumple(doc, tipo, palabras) for doc in documentos)]


def _texto_normalizado(valor):
    return str(valor or '').strip().lower()


def radicar(factura, usuario, datos):
    _exigir_estado(factura, ['Recibida', 'Registrada'], 'La factura debe estar en estado Recibida o Registrada')

    faltantes = faltantes_radicacion(factura)
    if faltantes:
        raise PasoRechazado('No se puede radicar: faltan soportes obligatorios.', faltantes=faltantes)

    estado_anterior = factura.estado
    observaciones = _texto(datos, 'observaciones')
    numero_operacion = _texto(datos, 'numero_operacion_contable')
    consecutivo_operacion = _texto(datos, 'consecutivo_operacion')

    if not observaciones:
        raise PasoRechazado('Las observaciones son obligatorias para radicar.')
    if not numero_operacion:
        raise PasoRechazado('El numero de operacion contable es obligatorio para radicar.')
    if not consecutivo_operacion:
        raise PasoRechazado('El consecutivo de operacion es obligatorio para radicar.')

    duplicado = models.Factura.objects.filter(consecutivo_operacion=consecutivo_operacion).exclude(pk=factura.pk).first()
    if duplicado:
        raise PasoRechazado(
            f'El consecutivo "{consecutivo_operacion}" ya está registrado en la factura {duplicado.numero_factura} '
            f'(Radicado: {duplicado.numero_radicado}). El consecutivo debe ser único en el sistema.'
        )

    factura.estado = 'Radicada'
    factura.fecha_radicacion = _hoy()
    factura.fecha_causacion = _hoy()
    factura.numero_radicado = f"{numero_operacion}-{consecutivo_operacion}"
    factura.numero_operacion_contable = numero_operacion
    factura.consecutivo_operacion = consecutivo_operacion
    # Radicación y causación comparten una única etapa SLA de Contabilidad.
    factura.etapa_actual = 'Radicación y Causación'
    factura.fecha_inicio_etapa = factura.fecha_inicio_etapa or factura.fecha_radicacion
    factura.usuario_responsable = usuario
    factura.save()

    actualizar_sla_factura(factura)
    registrar_historial(factura, usuario, 'Factura radicada', estado_anterior, 'Radicada', observaciones or None)
    notificar_transicion(factura, estado_anterior, 'Radicada')
    return factura
