import type { Factura } from '../../models/core.models';
import type { FuncionarioPendingRow } from '../../models/funcionario';

export const ITEMS_PER_PAGE = 5;

export function mapFacturaToPendingRow(f: Factura): FuncionarioPendingRow {
  const dias = Math.max(0, Number(f.dias_transcurridos || 0));
  const slaMax = Number(f.sla_objetivo_dias || 5);
  const riesgo: FuncionarioPendingRow['nivelRiesgo'] = dias > slaMax ? 'vencido' : dias > slaMax * 0.5 ? 'amarillo' : 'verde';
  const contacto = [f.proveedor?.email, f.proveedor?.telefono].filter(Boolean).join(' | ');
  const area = f.departamento?.nombre?.trim() || '';

  return {
    id: String(f.id),
    numeroFactura: f.numero_factura || undefined,
    proveedor: f.proveedor?.razon_social || 'Proveedor sin nombre',
    nit: f.proveedor?.nit || 'Sin NIT',
    contacto: contacto || 'Sin datos de contacto',
    tipoDocumento: f.tipo_documento || 'Factura',
    observaciones: f.observaciones || '',
    valorTotal: Number(f.valor_total || 0),
    fechaFactura: f.fecha_factura || '',
    fechaRecepcion: f.fecha_recepcion || '',
    areaSolicitante: area || 'Sin area asignada',
    dias,
    slaMax,
    nivelRiesgo: riesgo,
    accion: area
      ? riesgo === 'vencido'
        ? 'URGENTE: completar registro y documentos'
        : 'Completar registro y subir documentos'
      : 'Asignar area y completar registro',
    proveedorId: Number(f.proveedor_id),
    departamentoId: f.departamento?.id,
    departamentoNombre: area || undefined,
  };
}
