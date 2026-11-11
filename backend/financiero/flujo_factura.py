"""Flujo de la factura: reglas de cada paso, historial y notificaciones, sin depender de la petición HTTP.

Cada paso recibe la factura, el usuario que actúa y los datos enviados. Si la factura no está en el estado que el
paso exige, o faltan datos, lanza `PasoRechazado` con el mensaje y el código HTTP que se responden. Si no, cambia el
estado y la etapa, fija las fechas, asigna el responsable, agrega las observaciones con su etiqueta, actualiza el
SLA, deja la entrada del historial y notifica (salvo el control de pago, que no notifica).

En los pasos que suben archivos (causar, registrar pago aplicado) la vista entrega las funciones que guardan el
archivo en la carpeta compartida y regeneran el PDF unificado. En los que pasan por el serializador (crear, corregir,
completar registro) la vista valida y guarda el formulario, y el servicio aplica el resto del paso.
"""
import logging
import unicodedata

from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.dateparse import parse_date

from notificaciones.signals import crear_notificacion
from usuarios.models import Usuario

from . import models
from .sla import actualizar_sla_factura

logger = logging.getLogger(__name__)

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


# ------------------------------------------------------------------ Contabilidad
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


# ------------------------------------------------------------------ Tesorería
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


# ------------------------------------------------------------------ Auditoría
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


# ------------------------------------------------------------------ Dirección Financiera y Rectoría
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


# ------------------------------------------------------------------ devolución
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


# ------------------------------------------------------------------ registro y corrección
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


# ------------------------------------------------------------------ pasos con archivos
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
