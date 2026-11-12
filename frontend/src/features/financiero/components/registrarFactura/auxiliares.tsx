import { resolveBackendBaseUrl } from '../../../../core/backendUrl';
import { formatValidationErrors, type ApiError } from '../../../../core/errorHandler';
import type { DocumentoAdjunto, ItemFactura } from '../../models/core.models';
import type { FuncionarioDocumentType } from '../../models/funcionario';

export const DOCUMENT_TYPES: FuncionarioDocumentType[] = ['Factura', 'Orden de Compra', 'Certificación Bancaria', 'Acta de Entrega'];
export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = new Set(['pdf', 'xml', 'png', 'jpg', 'jpeg']);
export const BLOCKED_EXTENSIONS = new Set(['exe', 'bat', 'cmd', 'ps1', 'js', 'vbs', 'scr', 'msi', 'com', 'jar', 'sh']);
export const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'application/xml', 'text/xml', 'image/png', 'image/jpeg']);
export const BACKEND_BASE_URL = resolveBackendBaseUrl(import.meta.env.VITE_API_URL);

export const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (typeof data === 'object' && data !== null && 'results' in data) {
    const results = (data as { results?: unknown }).results;
    if (Array.isArray(results)) return results as T[];
  }
  return [];
};

export const buildApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError | undefined;
  const detailed = formatValidationErrors(apiError?.errors);
  if (apiError?.message && detailed) {
    return `${apiError.message}. ${detailed}`;
  }
  if (apiError?.message) {
    return apiError.message;
  }
  return fallback;
};

// Funciones de seguridad para valores potencialmente undefined
export const safeString = (val: unknown, fallback = 'Sin datos'): string => {
  if (val === null || val === undefined) return fallback;
  return String(val).trim() || fallback;
};

export const safeNumber = (val: unknown, fallback = 0): number => {
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

export const formatMoney = (val: unknown): string => {
  const num = safeNumber(val, 0);
  return `$${num.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`;
};

export function ReadonlyServiciosFactura({ items }: { items?: ItemFactura[] }) {
  // Si hay items estructurados del nuevo modelo, los mostramos directamente
  if (items && items.length > 0) {
    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id ?? index}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white">
                {item.orden ?? index + 1}
              </div>
              <div className="flex min-w-[220px] flex-1 items-center lg:max-w-[38%]">
                <p className="w-full text-center font-semibold text-slate-900">{item.descripcion || 'Servicio sin nombre'}</p>
              </div>
              <div className="grid w-full gap-2 sm:grid-cols-3 lg:ml-auto lg:w-[430px] lg:flex-none">
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Subtotal</p>
                  <p className="font-semibold text-slate-800">{formatMoney(item.valor_subtotal)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">IVA / INC {item.porcentaje_iva}%</p>
                  <p className="font-semibold text-slate-800">{formatMoney(item.valor_iva)}</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-wide text-red-600">Total</p>
                  <p className="font-semibold text-red-700">{formatMoney(item.valor_total)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
      Sin bienes o servicios registrados para esta factura.
    </div>
  );
}

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
};

export const resolveDocumentUrl = (urlStorage?: string): string | null => {
  if (!urlStorage) return null;
  const cleaned = urlStorage.trim();
  if (!cleaned) return null;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (cleaned.startsWith('/')) return cleaned;
  if (cleaned.startsWith('media/') || cleaned.startsWith('uploads/')) return `/${cleaned}`;
  return null;
};

export const buildDocumentoContenidoUrl = (
  doc: Pick<DocumentoAdjunto, 'id' | 'archivo_url' | 'url_storage'>,
  descargar = false
): string | null => {
  if (doc.id) {
    const relativeUrl = `/api/financiero/documentos/${doc.id}/contenido/${descargar ? '?descargar=1' : ''}`;
    return BACKEND_BASE_URL ? `${BACKEND_BASE_URL}${relativeUrl}` : relativeUrl;
  }

  const fallbackUrl = resolveDocumentUrl(doc.archivo_url ?? doc.url_storage);
  if (!fallbackUrl) return null;
  if (/^https?:\/\//i.test(fallbackUrl)) return fallbackUrl;
  return BACKEND_BASE_URL ? `${BACKEND_BASE_URL}${fallbackUrl}` : fallbackUrl;
};

export const validateUploadFile = (file: File): string | null => {
  const extension = getFileExtension(file.name);

  if (!extension) {
    return 'El archivo debe tener extensión válida (PDF, XML, PNG o JPG).';
  }

  if (BLOCKED_EXTENSIONS.has(extension)) {
    return `Tipo de archivo bloqueado por seguridad (.${extension}).`;
  }

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return `Tipo de archivo no permitido (.${extension}). Use PDF, XML, PNG o JPG.`;
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return 'El archivo supera el tamaño máximo permitido (25 MB).';
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return 'El tipo MIME del archivo no es válido para documentos financieros.';
  }

  return null;
};
