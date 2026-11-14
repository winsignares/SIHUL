"""Pasos de Auditoría: aprobar o rechazar la factura alistada."""
from ._base import _avanzar, _exigir_estado, _exigir_motivo, _texto

def aprobar_auditoria(factura, usuario, datos):
    _exigir_estado(factura, ['Alistada'], 'La factura debe estar alistada para auditoría')
    return _avanzar(factura, usuario, estado='Aprobada Auditoría', etapa='Cargue Formal',
                    fecha='fecha_aprobacion_auditoria', accion='Factura aprobada por auditoría',
                    observacion=_texto(datos, 'observaciones'), etiqueta='Auditoría')


def rechazar_auditoria(factura, usuario, datos):
    _exigir_estado(factura, ['Alistada'], 'La factura debe estar alistada para auditoría')
    motivo = _exigir_motivo(datos, 'motivo', 'Debe registrar un motivo de rechazo (mínimo 10 caracteres)')
    return _avanzar(factura, usuario, estado='Rechazada Auditoría', etapa='Tesorería - Ajustes internos',
                    responsable=None, accion='Factura rechazada por auditoría', observacion=motivo,
                    etiqueta='Auditoría - Rechazo')
