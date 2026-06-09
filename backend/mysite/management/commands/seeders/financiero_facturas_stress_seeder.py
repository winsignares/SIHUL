from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from financiero.models import CentroCosto, CuentaContable, Departamento, Factura, Proveedor
from usuarios.models import Usuario

TOTAL_POR_ESTADO = 10
PREFIJO_FACTURA = 'STRESS-FAC'

ESTADOS_CONFIG = [
    ('Recibida', 'Recepcion Funcionario', 'REC'),
    ('Registrada', 'Registro Funcionario', 'REG'),
    ('Radicada', 'Radicacion Contable', 'RAD'),
    ('Causada', 'Causacion Contable', 'CAU'),
    ('Alistada', 'Alistamiento Tesoreria', 'ALI'),
    ('Aprobada Auditoría', 'Control Previo Auditoria', 'APA'),
    ('Rechazada Auditoría', 'Control Previo Auditoria', 'RPA'),
    ('Revisada Dir. Financiera', 'Revision Direccion Financiera', 'RDF'),
    ('Cargada', 'Cargue Direccion Financiera', 'CAR'),
    ('Enviada Rectoría', 'Revision Rectoría', 'ERC'),
    ('Autorizada', 'Control de Pago Bancario', 'AUT'),
    ('Rechazada por Rectoría', 'Revision Rectoría', 'RRC'),
    ('Pago Aplicado', 'Registrar Pago Aplicado', 'PAG'),
    ('Pagada', 'Comprobante de Egreso', 'PGD'),
    ('Devuelta', 'Ajustes del Proceso', 'DEV'),
    ('Detenida', 'Tesoreria en Espera', 'DET'),
    ('Rechazada', 'Tramite Rechazado', 'REJ'),
    ('Anulada', 'Tramite Anulado', 'ANU'),
] 

ROLE_USER_EMAILS = {
    'Funcionario': 'funcionario@financiera.edu.co',
    'Contabilidad': 'contabilidad@financiera.edu.co',
    'Tesorería': 'tesoreria@financiera.edu.co',
    'Auditoría': 'auditoria@financiera.edu.co',
    'Dirección Financiera': 'direccion-financiera@financiera.edu.co',
    'Rectoría': 'rectoria@financiera.edu.co',
    'Admin Financiero': 'admin.financiero@financiera.edu.co',
}


def create_facturas_stress_data(out, sty, total_por_estado: int = TOTAL_POR_ESTADO):
    out.write(sty.NOTICE('\n  Facturas masivas de prueba por estado:'))

    proveedores = list(Proveedor.objects.order_by('id'))
    departamentos = list(Departamento.objects.order_by('id'))
    cuentas = list(CuentaContable.objects.order_by('id'))
    centros = list(CentroCosto.objects.order_by('id'))
    usuarios = {
        role: Usuario.objects.filter(correo=email).first()
        for role, email in ROLE_USER_EMAILS.items()
    }
    usuario_default = next((usuario for usuario in usuarios.values() if usuario), None)

    if not proveedores or not departamentos or not cuentas or not centros or not usuario_default:
        raise RuntimeError(
            'No se encontraron catalogos base del modulo financiero para crear facturas de stress.'
        )

    numeros_existentes = set(
        Factura.objects.filter(numero_factura__startswith=PREFIJO_FACTURA).values_list('numero_factura', flat=True)
    )
    hoy = timezone.now().date()
    nuevas_facturas = []
    total_creadas = 0

    with transaction.atomic():
        for estado_index, (estado, etapa_actual, codigo) in enumerate(ESTADOS_CONFIG, start=1):
            creadas_estado = 0

            for correlativo in range(1, total_por_estado + 1):
                numero_factura = f'{PREFIJO_FACTURA}-{codigo}-{correlativo:04d}'
                if numero_factura in numeros_existentes:
                    continue

                proveedor = proveedores[(correlativo + estado_index) % len(proveedores)]
                departamento = departamentos[(correlativo + estado_index) % len(departamentos)]
                cuenta = cuentas[(correlativo + estado_index) % len(cuentas)]
                centro = centros[(correlativo + estado_index) % len(centros)]

                valor_subtotal = Decimal('1000000.00') + Decimal(str((correlativo * 17391) % 8500000))
                valor_iva = (valor_subtotal * Decimal('0.19')).quantize(Decimal('0.01'))
                valor_total = valor_subtotal + valor_iva

                dias_antiguedad = 2 + ((correlativo + estado_index * 7) % 75)
                fecha_recepcion = hoy - timedelta(days=dias_antiguedad)
                fecha_factura = fecha_recepcion - timedelta(days=(correlativo % 5) + 1)
                fecha_radicacion = fecha_recepcion + timedelta(days=1)
                fecha_causacion = fecha_radicacion + timedelta(days=1)
                fecha_alistamiento = fecha_causacion + timedelta(days=1)
                fecha_aprobacion_auditoria = fecha_alistamiento + timedelta(days=1)
                fecha_revision_direccion = fecha_aprobacion_auditoria + timedelta(days=1)
                fecha_cargue = fecha_revision_direccion + timedelta(days=1)
                fecha_envio_rectoria = fecha_cargue + timedelta(days=1)
                fecha_autorizacion = fecha_envio_rectoria + timedelta(days=1)
                fecha_pago_aplicado = fecha_autorizacion + timedelta(days=1)
                fecha_comprobante = fecha_pago_aplicado + timedelta(days=1)

                numero_radicado = f'RAD-ST-{codigo}-{correlativo:04d}'
                numero_proceso_pago = f'PRC-ST-{codigo}-{correlativo:04d}'
                numero_confirmacion = f'CONF-ST-{codigo}-{correlativo:04d}'
                numero_transaccion = f'TRX-ST-{codigo}-{correlativo:04d}'
                numero_comprobante = f'CE-ST-{codigo}-{correlativo:04d}'

                usuario_responsable = _get_usuario_responsable(estado, usuarios, usuario_default)
                indicador_riesgo = _get_indicador_riesgo(dias_antiguedad)

                factura = Factura(
                    numero_factura=numero_factura,
                    numero_radicado=numero_radicado if estado not in {'Recibida', 'Registrada'} else None,
                    numero_proceso_pago=numero_proceso_pago if estado in {
                        'Alistada', 'Aprobada Auditoría', 'Rechazada Auditoría', 'Revisada Dir. Financiera',
                        'Cargada', 'Enviada Rectoría', 'Autorizada', 'Rechazada por Rectoría',
                        'Pago Aplicado', 'Pagada', 'Devuelta', 'Detenida',
                    } else None,
                    numero_confirmacion=numero_confirmacion if estado in {'Autorizada', 'Pago Aplicado', 'Pagada'} else None,
                    numero_transaccion=numero_transaccion if estado in {'Pago Aplicado', 'Pagada'} else None,
                    numero_comprobante=numero_comprobante if estado == 'Pagada' else None,
                    numero_operacion_contable=f'OP-ST-{codigo}-{correlativo:04d}' if estado not in {'Recibida', 'Registrada'} else None,
                    consecutivo_operacion=f'CO-ST-{codigo}-{correlativo:04d}' if estado in {
                        'Radicada', 'Causada', 'Alistada', 'Aprobada Auditoría', 'Rechazada Auditoría',
                        'Revisada Dir. Financiera', 'Cargada', 'Enviada Rectoría', 'Autorizada',
                        'Rechazada por Rectoría', 'Pago Aplicado', 'Pagada', 'Devuelta', 'Detenida',
                    } else None,
                    proveedor=proveedor,
                    departamento=departamento,
                    cuenta_contable=cuenta,
                    centro_costo=centro,
                    valor_subtotal=valor_subtotal,
                    valor_iva=valor_iva,
                    valor_retencion_renta=Decimal('0.00'),
                    valor_retencion_iva=Decimal('0.00'),
                    valor_retencion_ica=Decimal('0.00'),
                    valor_total=valor_total,
                    tipo_documento='Factura',
                    descripcion=f'Factura masiva de stress para el estado {estado}. Caso #{correlativo}.',
                    observaciones=f'Dato de prueba masivo generado automaticamente para validar carga alta en {estado}.',
                    fecha_factura=fecha_factura,
                    fecha_recepcion=fecha_recepcion,
                    fecha_radicacion=fecha_radicacion if estado in {
                        'Radicada', 'Causada', 'Alistada', 'Aprobada Auditoría', 'Rechazada Auditoría',
                        'Revisada Dir. Financiera', 'Cargada', 'Enviada Rectoría', 'Autorizada',
                        'Rechazada por Rectoría', 'Pago Aplicado', 'Pagada', 'Devuelta', 'Detenida',
                    } else None,
                    fecha_causacion=fecha_causacion if estado in {
                        'Causada', 'Alistada', 'Aprobada Auditoría', 'Rechazada Auditoría',
                        'Revisada Dir. Financiera', 'Cargada', 'Enviada Rectoría', 'Autorizada',
                        'Rechazada por Rectoría', 'Pago Aplicado', 'Pagada', 'Devuelta', 'Detenida',
                    } else None,
                    fecha_alistamiento=fecha_alistamiento if estado in {
                        'Alistada', 'Aprobada Auditoría', 'Rechazada Auditoría', 'Revisada Dir. Financiera',
                        'Cargada', 'Enviada Rectoría', 'Autorizada', 'Rechazada por Rectoría',
                        'Pago Aplicado', 'Pagada', 'Devuelta', 'Detenida',
                    } else None,
                    fecha_aprobacion_auditoria=fecha_aprobacion_auditoria if estado in {
                        'Aprobada Auditoría', 'Rechazada Auditoría', 'Revisada Dir. Financiera',
                        'Cargada', 'Enviada Rectoría', 'Autorizada', 'Rechazada por Rectoría',
                        'Pago Aplicado', 'Pagada', 'Devuelta', 'Detenida',
                    } else None,
                    fecha_cargue=fecha_cargue if estado in {
                        'Cargada', 'Enviada Rectoría', 'Autorizada', 'Rechazada por Rectoría',
                        'Pago Aplicado', 'Pagada',
                    } else None,
                    fecha_revision_direccion=fecha_revision_direccion if estado in {
                        'Revisada Dir. Financiera', 'Cargada', 'Enviada Rectoría', 'Autorizada',
                        'Rechazada por Rectoría', 'Pago Aplicado', 'Pagada',
                    } else None,
                    fecha_envio_rectoria=fecha_envio_rectoria if estado in {
                        'Enviada Rectoría', 'Autorizada', 'Rechazada por Rectoría', 'Pago Aplicado', 'Pagada',
                    } else None,
                    fecha_autorizacion=fecha_autorizacion if estado in {'Autorizada', 'Pago Aplicado', 'Pagada'} else None,
                    fecha_pago_aplicado=fecha_pago_aplicado if estado in {'Pago Aplicado', 'Pagada'} else None,
                    fecha_comprobante=fecha_comprobante if estado == 'Pagada' else None,
                    estado=estado,
                    etapa_actual=etapa_actual,
                    fecha_inicio_etapa=_get_fecha_inicio_etapa(
                        estado,
                        fecha_recepcion,
                        fecha_radicacion,
                        fecha_causacion,
                        fecha_alistamiento,
                        fecha_aprobacion_auditoria,
                        fecha_revision_direccion,
                        fecha_cargue,
                        fecha_envio_rectoria,
                        fecha_autorizacion,
                        fecha_pago_aplicado,
                        fecha_comprobante,
                    ),
                    indicador_riesgo=indicador_riesgo,
                    sla_cumplido=indicador_riesgo in {'ok', 'atencion'},
                    usuario_responsable=usuario_responsable,
                    cuenta_bancaria_proveedor=proveedor.cuenta_bancaria_completa or f'Bancolombia - Ahorros {9000000000 + correlativo}',
                    archivo_plano_generado=f'archivo_plano_{codigo.lower()}_{correlativo:04d}.txt' if estado in {
                        'Alistada', 'Aprobada Auditoría', 'Rechazada Auditoría', 'Revisada Dir. Financiera',
                        'Cargada', 'Enviada Rectoría', 'Autorizada', 'Rechazada por Rectoría',
                        'Pago Aplicado', 'Pagada',
                    } else None,
                    creado_por=usuario_default,
                    requiere_autorizacion_especial=valor_total >= Decimal('10000000.00'),
                    urgente=correlativo % 9 == 0,
                    fecha_creacion=timezone.now() - timedelta(days=dias_antiguedad),
                    fecha_modificacion=timezone.now() - timedelta(days=max(dias_antiguedad - 1, 0)),
                )
                nuevas_facturas.append(factura)
                creadas_estado += 1
                total_creadas += 1

            out.write(f'    - {estado}: +{creadas_estado} factura(s) nuevas')

        if nuevas_facturas:
            Factura.objects.bulk_create(nuevas_facturas, batch_size=500)

    out.write(sty.SUCCESS(f'  Facturas masivas creadas: {total_creadas}'))


def _get_usuario_responsable(estado, usuarios, usuario_default):
    if estado in {'Recibida', 'Registrada'}:
        return usuarios.get('Funcionario') or usuario_default
    if estado in {'Radicada', 'Causada'}:
        return usuarios.get('Contabilidad') or usuario_default
    if estado in {'Alistada', 'Detenida', 'Pago Aplicado', 'Pagada'}:
        return usuarios.get('Tesorería') or usuario_default
    if estado in {'Aprobada Auditoría', 'Rechazada Auditoría'}:
        return usuarios.get('Auditoría') or usuario_default
    if estado in {'Revisada Dir. Financiera', 'Cargada', 'Devuelta'}:
        return usuarios.get('Dirección Financiera') or usuario_default
    if estado in {'Enviada Rectoría', 'Autorizada', 'Rechazada por Rectoría'}:
        return usuarios.get('Rectoría') or usuario_default
    return usuario_default


def _get_indicador_riesgo(dias_antiguedad):
    if dias_antiguedad >= 45:
        return 'vencida'
    if dias_antiguedad >= 30:
        return 'atrasada'
    if dias_antiguedad >= 18:
        return 'atencion'
    return 'ok'


def _get_fecha_inicio_etapa(
    estado,
    fecha_recepcion,
    fecha_radicacion,
    fecha_causacion,
    fecha_alistamiento,
    fecha_aprobacion_auditoria,
    fecha_revision_direccion,
    fecha_cargue,
    fecha_envio_rectoria,
    fecha_autorizacion,
    fecha_pago_aplicado,
    fecha_comprobante,
):
    if estado in {'Recibida', 'Registrada', 'Rechazada', 'Anulada'}:
        return fecha_recepcion
    if estado == 'Radicada':
        return fecha_radicacion
    if estado == 'Causada':
        return fecha_causacion
    if estado in {'Alistada', 'Detenida'}:
        return fecha_alistamiento
    if estado in {'Aprobada Auditoría', 'Rechazada Auditoría'}:
        return fecha_aprobacion_auditoria
    if estado in {'Revisada Dir. Financiera', 'Devuelta'}:
        return fecha_revision_direccion
    if estado == 'Cargada':
        return fecha_cargue
    if estado in {'Enviada Rectoría', 'Rechazada por Rectoría'}:
        return fecha_envio_rectoria
    if estado == 'Autorizada':
        return fecha_autorizacion
    if estado == 'Pago Aplicado':
        return fecha_pago_aplicado
    if estado == 'Pagada':
        return fecha_comprobante
    return fecha_recepcion
