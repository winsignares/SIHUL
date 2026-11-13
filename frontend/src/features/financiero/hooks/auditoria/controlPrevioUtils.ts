import type { Factura as APIFactura } from '../../models/core.models';

export const FILTROS_INICIALES = {
  numeroFactura: '',
  numeroRadicado: '',
  numeroProcesoPago: '',
  fechaInicio: '',
  fechaFin: '',
  orden: 'recientes',
};

export const ORDER_OPTIONS = [
  { label: 'Mas recientes primero', value: 'recientes' },
  { label: 'Mas antiguos primero', value: 'antiguos' },
];

export const ITEMS_POR_PAGINA = 5;

export interface Factura {
  id: string;
  facturaId: number;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  proveedor: string;
  nit: string;
  valorTotal: number;
  fechaAlistamiento: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  slaObjetivoDias?: number | null;
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
  numeroRadicado: f.numero_radicado || 'Sin radicado',
  numeroProcesoPago: f.numero_proceso_pago || 'Sin proceso',
  proveedor: f.proveedor?.razon_social || 'Sin asignar',
  nit: f.proveedor?.nit || 'Sin NIT',
  valorTotal: Number(f.valor_total || 0),
  fechaAlistamiento: f.fecha_alistamiento || '',
  areaSolicitante: f.departamento?.nombre || 'Sin asignar',
  estado: f.estado,
  diasTranscurridos: Math.max(0, Number(f.dias_transcurridos || 0)),
  slaObjetivoDias: f.sla_objetivo_dias ?? null,
});

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
