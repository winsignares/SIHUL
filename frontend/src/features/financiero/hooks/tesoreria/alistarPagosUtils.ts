import type { Factura as APIFactura } from '../../models/core.models';

export const FILTROS_INICIALES = {
  numeroFactura: '',
  numeroRadicado: '',
  orden: 'recientes',
};

export const ITEMS_POR_PAGINA = 5;
export const ORDER_OPTIONS = [
  { label: 'Mas recientes primero', value: 'recientes' },
  { label: 'Mas antiguos primero', value: 'antiguos' },
];

export interface Factura {
  id: string;
  facturaId: number;
  numeroFactura: string;
  numeroRadicado?: string;
  proveedor: string;
  nit?: string;
  valorTotal: number;
  fechaCausacion?: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  slaObjetivoDias?: number | null;
  numeroProcesoPago?: string;
}

export const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

export const mapFactura = (f: APIFactura): Factura => ({
  id: String(f.id),
  facturaId: Number(f.id),
  numeroFactura: f.numero_factura || `FAC-${f.id}`,
  numeroRadicado: f.numero_radicado,
  proveedor: f.proveedor?.razon_social || 'Sin asignar',
  nit: f.proveedor?.nit,
  valorTotal: Number(f.valor_total || 0),
  fechaCausacion: f.fecha_causacion,
  areaSolicitante: f.departamento?.nombre || 'Sin asignar',
  estado: f.estado,
  diasTranscurridos: Math.max(0, Number(f.dias_transcurridos || 0)),
  slaObjetivoDias: f.sla_objetivo_dias ?? null,
  numeroProcesoPago: f.numero_proceso_pago,
});

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};
