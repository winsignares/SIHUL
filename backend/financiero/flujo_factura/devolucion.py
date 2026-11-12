"""Devolución de la factura a corrección: destino según quién rechaza y apertura de un ciclo documental nuevo."""
from .. import models
from ..sla import actualizar_sla_factura
from ._base import _exigir_motivo, _hoy, ciclo_documental_actual, notificar_transicion, registrar_historial

def destino_del_rechazo(factura, usuario, destino):
    """(estado, etapa, responsable) a donde va la factura rechazada, según quién la rechaza y el destino pedido."""
    rol_nombre = (usuario.rol.nombre if getattr(usuario, 'rol', None) else '').strip()
    destino = (destino or '').strip().lower()
    if rol_nombre == 'Funcionario':
        return 'Devuelta', 'Devolución', None
    if destino == 'radicacion':
        return 'Radicada', 'Corrección Radicación', None
    if destino == 'proveedor':
        return 'Devuelta', 'Corrección Proveedor', factura.creado_por
    if destino == 'funcionario' or factura.estado in ['Recibida', 'Registrada', 'Radicada']:
        return 'Registrada', 'Corrección Funcionario', factura.creado_por
    return 'Devuelta', 'Devolución', None


def rechazar(factura, usuario, datos, archivar_documentos):
    """Devuelve la factura a corrección y abre un ciclo documental nuevo.

    `archivar_documentos(factura, n)` guarda los soportes del ciclo anterior cuando la factura queda Devuelta.
    Devuelve el estado al que quedó.
    """
    motivo = _exigir_motivo(datos, 'motivo', 'El motivo de rechazo/devolución es obligatorio (mínimo 10 caracteres).')

    estado_anterior = factura.estado
    estado_destino, etapa_destino, responsable_destino = destino_del_rechazo(factura, usuario, datos.get('destino'))
    n_devoluciones = models.RechazoDevolucion.objects.filter(factura=factura).count()

    models.RechazoDevolucion.objects.create(
        factura=factura,
        tipo='Rechazo',
        etapa_rechazo=factura.etapa_actual,
        motivo=motivo,
        estado_devolucion='Pendiente Corrección',
        usuario_rechaza=usuario,
    )

    factura.estado = estado_destino
    factura.etapa_actual = etapa_destino
    factura.fecha_inicio_etapa = _hoy()
    factura.usuario_responsable = responsable_destino
    factura.ciclo_documental_actual = ciclo_documental_actual(factura) + 1
    factura.save()

    if estado_destino == 'Devuelta':
        archivar_documentos(factura, n_devoluciones + 1)

    actualizar_sla_factura(factura)
    registrar_historial(factura, usuario, 'Factura devuelta', estado_anterior, estado_destino, motivo)
    notificar_transicion(factura, estado_anterior, estado_destino)
    return estado_destino
