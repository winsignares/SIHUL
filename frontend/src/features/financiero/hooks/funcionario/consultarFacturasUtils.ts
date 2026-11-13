import type { Factura } from '../../models/core.models';
import type { FuncionarioConsultaRow } from '../../models/funcionario';
import { TIMELINE_BLUEPRINT } from '../../../../components/ui/timeline-builder';

export const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

export const ESTADOS_FUNCIONARIO = ['Recibida', 'Registrada'];
export const esEstadoFuncionario = (estado?: string | null) => ESTADOS_FUNCIONARIO.includes(estado || '');

export function mapFactura(f: Factura): FuncionarioConsultaRow {
  const dias = Math.max(0, Number(f.dias_transcurridos || 0));
  let riesgo: FuncionarioConsultaRow['riesgo'] = 'verde';
  if (dias > 15) riesgo = 'vencido';
  else if (dias > 10) riesgo = 'naranja';
  else if (dias > 5) riesgo = 'amarillo';

  return {
    id: String(f.id),
    facturaId: Number(f.id),
    riesgo,
    idTramite: f.numero_factura || `FAC-${f.id}`,
    proveedor: f.proveedor?.razon_social || 'Proveedor sin nombre',
    nit: f.proveedor?.nit,
    area: f.departamento?.nombre || 'Sin área',
    monto: Number(f.valor_total || 0),
    estado: f.estado || 'Recibida',
    etapa: f.etapa_actual || 'Recepción y Registro',
    numeroRadicado: f.numero_radicado || '',
    sinRadicado: !f.numero_radicado,
    fechaFactura: f.fecha_factura || '',
    fechaRecepcion: f.fecha_recepcion || '',
    dias,
  };
}

export function inferEtapaActual(estado: string): string {
  const found = TIMELINE_BLUEPRINT.find((item) => item.estadoRef === estado || (item.id === '10' && ['Pago Aplicado', 'Pagada'].includes(estado)));
  return found?.nombre || estado;
}

export function mapRiesgo(risk: FuncionarioConsultaRow['riesgo']): 'verde' | 'amarillo' | 'rojo' | 'vencido' {
  if (risk === 'naranja') return 'rojo';
  return risk;
}
