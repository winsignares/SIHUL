import type { Factura as APIFactura } from '../../models/core.models';

export interface FacturaRegistroRow {
  id: string;
  facturaId: number;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  proveedor: string;
  nit: string;
  valorTotal: number;
  fechaAutorizacion: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  slaObjetivoDias?: number | null;
  numeroConfirmacion: string;
  raw: APIFactura;
}

export const ITEMS_POR_PAGINA = 5;
export const ORDER_OPTIONS = [
  { label: 'Mas antiguos primero', value: 'antiguos' },
  { label: 'Mas recientes primero', value: 'recientes' },
  { label: 'SLA critico primero', value: 'sla' },
] as const;

export const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

export const normalizeEstado = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const isConfirmadaParaRegistro = (factura: APIFactura) => {
  const estadoNormalizado = normalizeEstado(factura.estado);
  return estadoNormalizado === 'autorizada' && Boolean(factura.numero_confirmacion) && !factura.numero_transaccion;
};

export const parseFecha = (value?: string) => (value ? new Date(value).getTime() : 0);

export const mapFactura = (factura: APIFactura): FacturaRegistroRow => ({
  id: String(factura.id),
  facturaId: Number(factura.id),
  numeroFactura: factura.numero_factura || `FAC-${factura.id}`,
  numeroRadicado: factura.numero_radicado || '',
  numeroProcesoPago: factura.numero_proceso_pago || '',
  proveedor: factura.proveedor?.razon_social || 'Sin Asignar',
  nit: factura.proveedor?.nit || 'Sin NIT',
  valorTotal: Number(factura.valor_total || 0),
  fechaAutorizacion: factura.fecha_autorizacion || factura.fecha_modificacion || factura.fecha_recepcion || '',
  areaSolicitante: factura.departamento?.nombre || 'Sin Asignar',
  estado: factura.estado,
  diasTranscurridos: Math.max(0, Number(factura.dias_transcurridos || 0)),
  slaObjetivoDias: factura.sla_objetivo_dias ?? null,
  numeroConfirmacion: factura.numero_confirmacion || 'Sin confirmación',
  raw: factura,
});
