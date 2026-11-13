import type { Factura as APIFactura } from '../../models/core.models';

export interface FacturaComprobanteRow {
  id: string;
  facturaId: number;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  numeroTransaccion: string;
  proveedor: string;
  nit: string;
  areaSolicitante: string;
  valorTotal: number;
  fechaPagoAplicado: string;
  fechaComprobante: string;
  soportePago: string;
  estado: string;
  raw: APIFactura;
}

export const ITEMS_POR_PAGINA = 5;
export const ORDER_OPTIONS = [
  { label: 'Mas antiguos primero', value: 'antiguos' },
  { label: 'Mas recientes primero', value: 'recientes' },
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

export const isComprobanteFlow = (estado?: string) => {
  const normalized = normalizeEstado(estado);
  return normalized === 'pagada' || normalized === 'pago aplicado' || normalized === 'autorizada';
};

export const parseFecha = (value?: string) => (value ? new Date(value).getTime() : 0);

export const mapFactura = (factura: APIFactura): FacturaComprobanteRow => ({
  id: String(factura.id),
  facturaId: Number(factura.id),
  numeroFactura: factura.numero_factura || `FAC-${factura.id}`,
  numeroRadicado: factura.numero_radicado || '',
  numeroProcesoPago: factura.numero_proceso_pago || '',
  numeroTransaccion: factura.numero_transaccion || 'Sin transaccion',
  proveedor: factura.proveedor?.razon_social || 'Sin Asignar',
  nit: factura.proveedor?.nit || 'Sin NIT',
  areaSolicitante: factura.departamento?.nombre || 'Sin area',
  valorTotal: Number(factura.valor_total || 0),
  fechaPagoAplicado: factura.fecha_pago_aplicado || factura.fecha_modificacion || '',
  fechaComprobante: factura.fecha_comprobante || '',
  soportePago: factura.numero_transaccion || factura.numero_confirmacion || 'Sin soporte',
  estado: factura.estado,
  raw: factura,
});
