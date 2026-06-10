import type { Factura as APIFactura } from '../models/financiero/core.models';
import type { SharedFacturaDetail } from './factura-detail-modal';

export function buildSharedFacturaDetail(f: APIFactura): SharedFacturaDetail {
  const documentos = (f.documentos || []).map((doc) => ({
    id: doc.id ? String(doc.id) : undefined,
    nombre: doc.nombre_archivo,
    tipo: doc.tipo_documento,
    fecha: doc.fecha_carga,
    verificado: doc.verificado,
    url: doc.archivo_url || doc.url_storage || null,
  }));

  const contactoProveedor = [f.proveedor?.email, f.proveedor?.telefono].filter(Boolean).join(' | ') || undefined;

  const cuentaBancariaCompleta = f.cuenta_bancaria_proveedor ||
    (f.proveedor?.banco && f.proveedor?.tipo_cuenta && f.proveedor?.numero_cuenta
      ? `${f.proveedor.banco} - ${f.proveedor.tipo_cuenta} ${f.proveedor.numero_cuenta}`
      : f.proveedor?.cuenta_bancaria_completa);

  const nivelRiesgo: SharedFacturaDetail['nivelRiesgo'] =
    f.indicador_riesgo === 'vencida' ? 'vencido' :
    f.indicador_riesgo === 'atrasada' ? 'rojo' :
    f.indicador_riesgo === 'atencion' ? 'amarillo' : 'verde';

  return {
    facturaId: f.id,
    numeroFactura: f.numero_factura || `FAC-${f.id}`,
    proveedor: f.proveedor?.razon_social || 'Sin proveedor',
    nit: f.proveedor?.nit,
    valorTotal: Number(f.valor_total || 0),
    valorSubtotal: f.valor_subtotal ?? undefined,
    valorIva: f.valor_iva ?? undefined,
    fechaFactura: f.fecha_factura,
    fechaRecepcion: f.fecha_recepcion,
    fechaRadicacion: f.fecha_radicacion,
    fechaCausacion: f.fecha_causacion,
    fechaAlistamiento: f.fecha_alistamiento,
    fechaAprobacionAuditoria: f.fecha_aprobacion_auditoria,
    fechaCargue: f.fecha_cargue,
    fechaAutorizacion: f.fecha_autorizacion,
    fechaPagoAplicado: f.fecha_pago_aplicado,
    fechaComprobante: f.fecha_comprobante,
    areaSolicitante: f.departamento?.nombre,
    estado: f.estado,
    diasTranscurridos: Math.max(0, f.dias_transcurridos || 0),
    slaObjetivoDias: f.sla_objetivo_dias ?? undefined,
    numeroRadicado: f.numero_radicado,
    numeroProcesoPago: f.numero_proceso_pago,
    numeroOperacionContable: f.numero_operacion_contable,
    consecutivoOperacion: f.consecutivo_operacion,
    descripcion: f.descripcion,
    observaciones: f.observaciones,
    tipoDocumento: f.tipo_documento,
    cuentaBancariaProveedor: cuentaBancariaCompleta,
    contactoProveedor,
    nivelRiesgo,
    cuentaContable: f.cuenta_contable
      ? `${f.cuenta_contable.codigo} - ${f.cuenta_contable.nombre}`
      : undefined,
    centroCosto: f.centro_costo
      ? `${f.centro_costo.codigo} - ${f.centro_costo.nombre}`
      : undefined,
    documentos,
    etapasTimeline: undefined,
  };
}


export function mapFacturaDetail(detail: APIFactura, base: SharedFacturaDetail): SharedFacturaDetail {
  const contactoProveedor = [detail.proveedor?.email, detail.proveedor?.telefono].filter(Boolean).join(' | ') || base.contactoProveedor;

  const cuentaBancariaCompleta = detail.cuenta_bancaria_proveedor ||
    (detail.proveedor?.banco && detail.proveedor?.tipo_cuenta && detail.proveedor?.numero_cuenta
      ? `${detail.proveedor.banco} - ${detail.proveedor.tipo_cuenta} ${detail.proveedor.numero_cuenta}`
      : detail.proveedor?.cuenta_bancaria_completa) ||
    base.cuentaBancariaProveedor;

  const nivelRiesgo: SharedFacturaDetail['nivelRiesgo'] =
    detail.indicador_riesgo === 'vencida' ? 'vencido' :
    detail.indicador_riesgo === 'atrasada' ? 'rojo' :
    detail.indicador_riesgo === 'atencion' ? 'amarillo' : 'verde';

  const documentos = (detail.documentos || []).map((doc) => ({
    id: doc.id ? String(doc.id) : undefined,
    nombre: doc.nombre_archivo,
    tipo: doc.tipo_documento,
    fecha: doc.fecha_carga,
    verificado: doc.verificado,
    url: doc.archivo_url || doc.url_storage || null,
  }));

  return {
    ...base,
    facturaId: detail.id,
    numeroFactura: detail.numero_factura || base.numeroFactura,
    proveedor: detail.proveedor?.razon_social || base.proveedor,
    valorTotal: Number(detail.valor_total || base.valorTotal || 0),
    fechaFactura: detail.fecha_factura || base.fechaFactura,
    fechaRecepcion: detail.fecha_recepcion || base.fechaRecepcion,
    fechaRadicacion: detail.fecha_radicacion || base.fechaRadicacion,
    fechaCausacion: detail.fecha_causacion || base.fechaCausacion,
    fechaAlistamiento: detail.fecha_alistamiento || base.fechaAlistamiento,
    fechaAprobacionAuditoria: detail.fecha_aprobacion_auditoria || base.fechaAprobacionAuditoria,
    fechaCargue: detail.fecha_cargue || base.fechaCargue,
    fechaAutorizacion: detail.fecha_autorizacion || base.fechaAutorizacion,
    fechaPagoAplicado: detail.fecha_pago_aplicado || base.fechaPagoAplicado,
    fechaComprobante: detail.fecha_comprobante || base.fechaComprobante,
    areaSolicitante: detail.departamento?.nombre || base.areaSolicitante,
    estado: detail.estado || base.estado,
    diasTranscurridos: Number(detail.dias_transcurridos || base.diasTranscurridos || 0),
    numeroRadicado: detail.numero_radicado || base.numeroRadicado,
    numeroProcesoPago: detail.numero_proceso_pago || base.numeroProcesoPago,
    numeroOperacionContable: detail.numero_operacion_contable || base.numeroOperacionContable,
    consecutivoOperacion: detail.consecutivo_operacion || base.consecutivoOperacion,
    descripcion: detail.descripcion || base.descripcion,
    observaciones: detail.observaciones || base.observaciones,
    tipoDocumento: detail.tipo_documento || base.tipoDocumento,
    valorSubtotal: detail.valor_subtotal ?? base.valorSubtotal,
    valorIva: detail.valor_iva ?? base.valorIva,
    cuentaBancariaProveedor: cuentaBancariaCompleta,
    contactoProveedor,
    nivelRiesgo,
    nit: detail.proveedor?.nit || base.nit,
    cuentaContable: detail.cuenta_contable
      ? `${detail.cuenta_contable.codigo} - ${detail.cuenta_contable.nombre}`
      : base.cuentaContable,
    centroCosto: detail.centro_costo
      ? `${detail.centro_costo.codigo} - ${detail.centro_costo.nombre}`
      : base.centroCosto,
    documentos,
    auditoriaView: base.auditoriaView,
    auditoriaNotas: base.auditoriaNotas,
  };
}
