"""Registro y corrección de la factura: creación, completar registro y reenvío de la corrección del proveedor."""
from django.utils import timezone

from .. import models
from ..sla import actualizar_sla_factura
from ._base import _hoy, PasoRechazado, notificar_transicion, registrar_historial

def registrar_creacion(factura, usuario):
    """Completa una factura recién guardada: etapa inicial, historial, SLA y aviso a Contabilidad."""
    if not factura.etapa_actual:
        factura.etapa_actual = 'Recepción y Registro'
    if not factura.fecha_inicio_etapa:
        factura.fecha_inicio_etapa = factura.fecha_recepcion or _hoy()
    factura.save(update_fields=['etapa_actual', 'fecha_inicio_etapa', 'fecha_modificacion'])

    registrar_historial(factura, usuario, 'Factura registrada', None, 'Recibida')
    actualizar_sla_factura(factura)
    notificar_transicion(factura, None, factura.estado)
    return factura


def validar_completar_registro(factura):
    if factura.estado not in ['Recibida', 'Registrada', 'Devuelta']:
        raise PasoRechazado(
            'Solo se pueden completar facturas en estado Recibida, Registrada o Devuelta. '
            f'Estado actual: {factura.estado}'
        )


def completar_registro(factura, usuario, estado_anterior, guardar_datos):
    """Deja la factura Registrada en «Radicación y Causación».

    `guardar_datos()` guarda los cambios ya validados del formulario (después de fijar el estado y antes de guardarlo).
    """
    factura.estado = 'Registrada'
    factura.etapa_actual = 'Radicación y Causación'
    if not factura.usuario_responsable:
        factura.usuario_responsable = usuario
    if not factura.fecha_inicio_etapa:
        factura.fecha_inicio_etapa = _hoy()

    guardar_datos()
    factura.save(update_fields=['estado', 'etapa_actual', 'usuario_responsable', 'fecha_inicio_etapa'])

    actualizar_sla_factura(factura)
    models.HistorialFactura.objects.create(
        factura=factura,
        accion='Completar Registro',
        estado_anterior=estado_anterior,
        estado_nuevo='Registrada',
        usuario=usuario,
        usuario_nombre=usuario.get_full_name() or usuario.username,
        usuario_rol='Funcionario',
        observacion='Factura registrada correctamente por el funcionario',
    )
    notificar_transicion(factura, estado_anterior, 'Registrada')
    return factura


def validar_correccion(factura, usuario):
    """Solo el proveedor corrige, y solo facturas devueltas o rechazadas."""
    rol_nombre = (usuario.rol.nombre if getattr(usuario, 'rol', None) else '').strip()
    if rol_nombre != 'Proveedor':
        raise PasoRechazado('No autorizado para corregir esta factura.', codigo=403)
    if factura.estado not in ['Devuelta', 'Rechazada']:
        raise PasoRechazado('Solo se pueden corregir facturas en estado Devuelta o Rechazada.')


def reenviar_correccion(factura, usuario, estado_anterior, observaciones_correccion):
    """Vuelve a Recepción y Registro la factura corregida y marca reenviada la última devolución."""
    factura.estado = 'Recibida'
    factura.etapa_actual = 'Recepción y Registro'
    factura.usuario_responsable = None
    factura.fecha_inicio_etapa = _hoy()
    factura.fecha_recepcion = _hoy()
    factura.save(update_fields=['estado', 'etapa_actual', 'usuario_responsable', 'fecha_inicio_etapa', 'fecha_recepcion'])

    observaciones_correccion = (observaciones_correccion or '').strip() or 'Corrección enviada por proveedor.'

    ultimo_rechazo = models.RechazoDevolucion.objects.filter(factura=factura).order_by('-fecha_rechazo').first()
    if ultimo_rechazo:
        ultimo_rechazo.estado_devolucion = 'Reenviada'
        ultimo_rechazo.fecha_correccion = timezone.now()
        ultimo_rechazo.usuario_corrige = usuario
        ultimo_rechazo.observaciones_correccion = observaciones_correccion
        ultimo_rechazo.save(update_fields=[
            'estado_devolucion', 'fecha_correccion', 'usuario_corrige', 'observaciones_correccion'])

    registrar_historial(factura, usuario, 'Corrección enviada por proveedor', estado_anterior, 'Recibida',
                        observaciones_correccion)
    actualizar_sla_factura(factura)
    notificar_transicion(factura, estado_anterior, factura.estado)
    return factura
