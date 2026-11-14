"""Base del flujo de la factura: estados, roles que reciben, excepción de paso, historial, notificaciones y paso común."""
import unicodedata

from django.utils import timezone

from notificaciones.signals import crear_notificacion
from identidad.usuarios.models import Usuario

from .. import models
from ..sla import actualizar_sla_factura

ESTADO_ENVIADA_RECTORIA = 'Enviada Rectoría'
ESTADO_AUTORIZADA = 'Autorizada'
ESTADO_RECHAZADA_POR_RECTORIA = 'Rechazada por Rectoría'
ESTADO_REVISADA_DIRECCION_FINANCIERA = 'Revisada Dir. Financiera'
ESTADO_DEVUELTA = 'Devuelta'
ESTADO_CARGADA = 'Cargada'

# Rol que recibe la factura en cada estado (además de quien la creó)
SIGUIENTES_ROLES = {
    'Recibida': ['Contabilidad'],
    'Registrada': ['Contabilidad'],
    'Radicada': ['Contabilidad'],
    'Causada': ['Tesorería'],
    'Alistada': ['Auditoría'],
    'Aprobada Auditoría': ['Dirección Financiera'],
    'Rechazada Auditoría': ['Tesorería'],
    'Revisada Dir. Financiera': ['Dirección Financiera'],
    'Cargada': ['Rectoría'],
    'Enviada Rectoría': ['Rectoría'],
    'Rechazada por Rectoría': ['Dirección Financiera'],
    'Devuelta': ['Dirección Financiera'],
    'Pago Aplicado': ['Tesorería'],
}

# Soportes que exige la radicación: tipo de documento y palabras que bastan en el nombre del archivo
SOPORTES_RADICACION = {
    'Factura': ['factura'],
    'Orden de Compra': ['orden', 'compra', 'contrato'],
    'Certificación Bancaria': ['certif', 'bancari'],
}


class PasoRechazado(Exception):
    """El paso no se aplica: se responde {'error': mensaje, **extra} con el código indicado."""

    def __init__(self, mensaje, codigo=400, **extra):
        super().__init__(mensaje)
        self.respuesta = {'error': mensaje, **extra}
        self.codigo = codigo


# ------------------------------------------------------------------ apoyo
def _normalizar(valor):
    return unicodedata.normalize('NFD', valor or '').encode('ascii', 'ignore').decode('ascii').lower().strip()


def estado_es(actual, esperado):
    """Compara estados sin tildes ni mayúsculas."""
    return _normalizar(actual) == _normalizar(esperado)


def ciclo_documental_actual(factura):
    return getattr(factura, 'ciclo_documental_actual', 1) or 1


def _texto(datos, campo):
    return (datos.get(campo) or '').strip()


def _hoy():
    return timezone.now().date()


def _agregar_observacion(factura, etiqueta, texto):
    factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f'[{etiqueta}] {texto}']))


def registrar_historial(factura, usuario, accion, estado_anterior, estado_nuevo, observacion=None, **extra):
    models.HistorialFactura.objects.create(
        factura=factura,
        accion=accion,
        estado_anterior=estado_anterior,
        estado_nuevo=estado_nuevo,
        usuario=usuario,
        usuario_nombre=usuario.nombre,
        usuario_rol=usuario.rol.nombre if usuario.rol else 'Sin rol',
        observacion=observacion,
        **extra,
    )


# ------------------------------------------------------------------ notificaciones
def _usuarios_por_rol(roles):
    if not roles:
        return []
    return list(Usuario.objects.filter(rol__nombre__in=roles, activo=True).values_list('id', flat=True))


def notificar_transicion(factura, estado_anterior, estado_nuevo):
    """Avisa a quien creó la factura y a los usuarios activos del rol que la recibe.

    Si la factura vuelve a corrección, el creador recibe el aviso de devolución con el último motivo.
    """
    numero = factura.numero_factura
    creador_id = factura.creado_por_id

    destinatarios = set()
    if creador_id:
        destinatarios.add(creador_id)

    for user_id in _usuarios_por_rol(SIGUIENTES_ROLES.get(estado_nuevo, [])):
        destinatarios.add(user_id)

    es_devolucion = estado_nuevo == 'Devuelta' or factura.etapa_actual == 'Corrección Funcionario'
    motivo_devolucion = None
    if es_devolucion:
        motivo_devolucion = (
            models.RechazoDevolucion.objects
            .filter(factura=factura)
            .order_by('-fecha_rechazo')
            .values_list('motivo', flat=True)
            .first()
        )

    for user_id in destinatarios:
        tipo_notificacion = 'FACTURA_ETAPA_ACTUALIZADA'
        mensaje = (
            f'La factura {numero} ha avanzado en su proceso de revisión. '
            f'Estado anterior: {estado_anterior or "Sin estado"}. '
            f'Estado actual: {estado_nuevo}. '
            f'Puedes revisar los detalles en tu panel de facturas.'
        )
        prioridad = 'alta' if estado_nuevo in ['Recibida', 'Devuelta', 'Rechazada', 'Rechazada por Rectoría'] else 'media'

        if es_devolucion and user_id == creador_id:
            tipo_notificacion = 'FACTURA_DEVUELTA'
            mensaje = (
                f'La factura {numero} ha sido devuelta para corrección. '
                f'Motivo: {motivo_devolucion or "Revisar observaciones en el historial de cambios"}. '
                f'Por favor, realiza los ajustes necesarios y vuelve a enviarla.'
            )
            prioridad = 'alta'

        crear_notificacion(
            id_usuario=user_id,
            tipo=tipo_notificacion,
            mensaje=mensaje,
            prioridad=prioridad,
        )


# ------------------------------------------------------------------ paso común
QUIEN_ACTUA = object()


def _avanzar(factura, usuario, *, estado, etapa, accion, observacion=None, etiqueta=None, fecha=None,
             inicio_etapa=None, responsable=QUIEN_ACTUA, rechazo_en=None, al_guardar=None):
    """Aplica el paso: estado, etapa, fecha del paso (campo) e inicio de etapa, responsable y observación.

    Luego guarda, llama a `al_guardar(factura)` si se indica, actualiza el SLA, registra el rechazo (si `rechazo_en`
    trae la etapa), el historial y notifica.
    """
    estado_anterior = factura.estado
    hoy = _hoy()
    factura.estado = estado
    if fecha:
        setattr(factura, fecha, hoy)
    factura.etapa_actual = etapa
    factura.fecha_inicio_etapa = inicio_etapa or hoy
    factura.usuario_responsable = usuario if responsable is QUIEN_ACTUA else responsable
    if etiqueta and observacion:
        _agregar_observacion(factura, etiqueta, observacion)
    factura.save()
    if al_guardar:
        al_guardar(factura)

    actualizar_sla_factura(factura)

    if rechazo_en:
        models.RechazoDevolucion.objects.create(
            factura=factura,
            tipo='Rechazo',
            etapa_rechazo=rechazo_en,
            motivo=observacion,
            estado_devolucion='Pendiente Corrección',
            usuario_rechaza=usuario,
        )

    registrar_historial(factura, usuario, accion, estado_anterior, estado, observacion or None)
    notificar_transicion(factura, estado_anterior, estado)
    return factura


def _exigir_estado(factura, estados, mensaje):
    if factura.estado not in estados:
        raise PasoRechazado(mensaje)


def _exigir_motivo(datos, campo, mensaje):
    motivo = _texto(datos, campo)
    if len(motivo) < 10:
        raise PasoRechazado(mensaje)
    return motivo
