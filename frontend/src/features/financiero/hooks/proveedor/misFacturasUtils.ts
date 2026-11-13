import { FileText, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { DocumentoAdjunto } from '../../models/core.models';

export const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (typeof data === 'object' && data !== null && 'results' in data) {
    const response = data as { results?: unknown };
    if (Array.isArray(response.results)) return response.results as T[];
  }
  return [];
};

export const formatMoney = (val: number | string | null | undefined) => {
  const num = Number(val) || 0;
  return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export type FacturaDocumentoAdjunto = DocumentoAdjunto & {
  cargado_por?: { id?: number | null } | number | null;
};

export const resolveDocumentUrl = (doc: FacturaDocumentoAdjunto) => {
  const rawUrl = (doc.archivo_url || doc.url_storage || '').trim();
  if (!rawUrl) return null;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith('/')) return rawUrl;
  if (rawUrl.startsWith('media/') || rawUrl.startsWith('uploads/')) return `/${rawUrl}`;
  return rawUrl;
};

export const ESTADO_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  'Recibida': { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', icon: Clock, label: 'Recibida' },
  'Registrada': { color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300', icon: FileText, label: 'Registrada' },
  'Radicada': { color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: FileText, label: 'Radicada' },
  'Causada': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', icon: Clock, label: 'Causada' },
  'Alistada': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', icon: Clock, label: 'Alistada' },
  'Aprobada Auditoría': { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2, label: 'Aprobada Auditoría' },
  'Rechazada Auditoría': { color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: XCircle, label: 'Rechazada Auditoría' },
  'Cargada': { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', icon: FileText, label: 'Cargada' },
  'Revisada Dir. Financiera': { color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300', icon: CheckCircle2, label: 'En Revisión' },
  'Enviada Rectoría': { color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: Clock, label: 'En Rectoría' },
  'Autorizada': { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2, label: 'Autorizada' },
  'Pago Aplicado': { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2, label: 'Pago Aplicado' },
  'Pagada': { color: 'bg-green-200 text-green-900 dark:bg-green-800/40 dark:text-green-200', icon: CheckCircle2, label: 'Pagada' },
  'Devuelta': { color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: AlertCircle, label: 'Requiere corrección' },
  'Rechazada': { color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: XCircle, label: 'Rechazada' },
  'Anulada': { color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', icon: XCircle, label: 'Anulada' },
};

export const REJECTED_STATES = ['Rechazada', 'Devuelta', 'Rechazada Auditoría', 'Rechazada por Rectoría'];
