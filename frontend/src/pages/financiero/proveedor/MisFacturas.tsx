import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Eye,
  Paperclip,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { documentosService, proveedoresService } from '../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../models/financiero/core.models';
import type { MisFacturasProps } from '../../../models/financiero/proveedor';
import { displayDate, displayRadicado, displayText } from '../../../share/field-placeholders';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../share/dialog';

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (typeof data === 'object' && data !== null && 'results' in data) {
    const response = data as { results?: unknown };
    if (Array.isArray(response.results)) return response.results as T[];
  }
  return [];
};

const formatMoney = (val: number | string | null | undefined) => {
  const num = Number(val) || 0;
  return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

type FacturaDocumentoAdjunto = DocumentoAdjunto & {
  cargado_por?: { id?: number | null } | number | null;
};

const resolveDocumentUrl = (doc: FacturaDocumentoAdjunto) => {
  const rawUrl = (doc.archivo_url || doc.url_storage || '').trim();
  if (!rawUrl) return null;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith('/')) return rawUrl;
  if (rawUrl.startsWith('media/') || rawUrl.startsWith('uploads/')) return `/${rawUrl}`;
  return rawUrl;
};

const ESTADO_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
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

const REJECTED_STATES = ['Rechazada', 'Devuelta', 'Rechazada Auditoría', 'Rechazada por Rectoría'];

export default function MisFacturas({ miProveedor }: MisFacturasProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [documentosOpen, setDocumentosOpen] = useState(false);
  const [documentosLoading, setDocumentosLoading] = useState(false);
  const [documentosError, setDocumentosError] = useState<string | null>(null);
  const [selectedFacturaNumero, setSelectedFacturaNumero] = useState('');
  const [documentosProveedor, setDocumentosProveedor] = useState<FacturaDocumentoAdjunto[]>([]);
  const ITEMS_PER_PAGE = 5;

  const loadFacturas = useCallback(async () => {
    if (!miProveedor) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await proveedoresService.getMisFacturas(miProveedor.id);
      setFacturas(toList<Factura>(resp));
    } catch {
      setError('No se pudieron cargar tus facturas. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [miProveedor]);

  useEffect(() => {
    void loadFacturas();
  }, [loadFacturas]);

  // Sort by most recent date (recepcion or factura) and filter
  const sortedFilteredFacturas = useMemo(() => {
    const filtered = facturas.filter(f => {
      const matchSearch =
        !search ||
        f.numero_factura.toLowerCase().includes(search.toLowerCase()) ||
        (f.numero_radicado || '').toLowerCase().includes(search.toLowerCase()) ||
        (f.observaciones || '').toLowerCase().includes(search.toLowerCase()) ||
        f.descripcion.toLowerCase().includes(search.toLowerCase());
      const matchEstado = !estadoFiltro || (estadoFiltro === '__rechazadas' ? REJECTED_STATES.includes(f.estado) : f.estado === estadoFiltro);
      return matchSearch && matchEstado;
    });
    // Sort by fecha_recepcion (most recent first), fallback to fecha_factura
    return filtered.sort((a: Factura, b: Factura) => {
      const dateA = new Date(a.fecha_recepcion || a.fecha_factura || 0).getTime();
      const dateB = new Date(b.fecha_recepcion || b.fecha_factura || 0).getTime();
      return dateB - dateA;
    });
  }, [estadoFiltro, facturas, search]);

  // Pagination logic
  const totalPages = Math.ceil(sortedFilteredFacturas.length / ITEMS_PER_PAGE);
  const paginatedFacturas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedFilteredFacturas.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedFilteredFacturas, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, estadoFiltro]);

  const openProviderDocuments = useCallback(
    async (factura: Factura) => {
      setDocumentosOpen(true);
      setSelectedFacturaNumero(factura.numero_factura || `FAC-${factura.id}`);
      setDocumentosLoading(true);
      setDocumentosError(null);
      setDocumentosProveedor([]);

      try {
        const response = await documentosService.getByFactura(factura.id);
        const documentos = response as FacturaDocumentoAdjunto[];
        const documentosDelProveedor = documentos.filter((doc) => {
          const uploaderId =
            typeof doc.cargado_por === 'number'
              ? doc.cargado_por
              : (doc.cargado_por?.id ?? null);

          if (user?.id && uploaderId) {
            return uploaderId === user.id;
          }

          return uploaderId === null || uploaderId === undefined;
        });

        setDocumentosProveedor(documentosDelProveedor);
      } catch {
        setDocumentosError('No fue posible cargar los documentos del proveedor para esta factura.');
      } finally {
        setDocumentosLoading(false);
      }
    },
    [user?.id]
  );

  const estados = useMemo(() => {
    const base = ['Recibida', '__rechazadas'];
    const dynamic = facturas
      .map(f => f.estado)
      .filter((estado) => estado && !REJECTED_STATES.includes(estado) && estado !== 'Recibida');
    return [...base, ...Array.from(new Set(dynamic))];
  }, [facturas]);

  if (!miProveedor) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <AlertCircle className="text-slate-400" size={48} />
        <p className="text-slate-600 dark:text-slate-400 text-center">
          No se encontró tu perfil de proveedor. Completa el proceso de identificación primero.
        </p>
      </div>
    );
  }

  const tableColumns = '220px minmax(280px,1fr) 180px 170px 140px 180px';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <FileText size={24} className="flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-1">Mis Facturas</h3>
              <p className="text-red-100 text-sm">Consulta y haz seguimiento rapido de todas tus facturas enviadas.</p>
            </div>
          </div>
          <button
            onClick={() => void loadFacturas()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/30"
            title="Actualizar"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: facturas.length, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
          { label: 'En Proceso', value: facturas.filter((f) => !['Pagada', 'Rechazada', 'Anulada', 'Devuelta'].includes(f.estado)).length, color: 'text-rose-800 dark:text-rose-200', bg: 'bg-rose-50 dark:bg-rose-900/20' },
          { label: 'Pagadas', value: facturas.filter((f) => f.estado === 'Pagada' || f.estado === 'Pago Aplicado').length, color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Devueltas', value: facturas.filter((f) => f.estado === 'Devuelta' || f.estado === 'Rechazada').length, color: 'text-amber-800 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`${stat.bg} rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/40`}
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por numero, radicado o identificacion..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>
        <select
          value={estadoFiltro}
          onChange={e => setEstadoFiltro(e.target.value)}
          className="px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
        >
          <option value="">Todos</option>
          {estados.map(e => (
            <option key={e} value={e}>{e === '__rechazadas' ? 'Rechazadas' : e}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Pagination Info */}
      {!loading && sortedFilteredFacturas.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <p>
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, sortedFilteredFacturas.length)} de {sortedFilteredFacturas.length} facturas
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-3 text-slate-500 dark:text-slate-400 text-sm">Cargando facturas..</span>
          </div>
        ) : sortedFilteredFacturas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <FileText className="text-slate-300 dark:text-slate-600" size={48} />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {facturas.length === 0 ? 'Aun no has enviado ninguna factura.' : 'No hay facturas que coincidan con los filtros.'}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: 980 }}>
              <div
                className="grid gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700"
                style={{ gridTemplateColumns: tableColumns }}
              >
                <span>Factura</span>
                <span>Identificacion</span>
                <span>Fechas</span>
                <span>Estado</span>
                <span className="text-right">Total</span>
                <span className="text-right">Acciones</span>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedFacturas.map((factura, i) => {
                  const cfg = ESTADO_CONFIG[factura.estado] || { color: 'bg-slate-100 text-slate-600', icon: FileText, label: factura.estado };
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={factura.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/financiero/proveedor/${factura.id}`)}
                      className="grid gap-4 px-5 py-4 items-center hover:bg-rose-50/40 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
                      style={{ gridTemplateColumns: tableColumns }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="text-red-600 dark:text-red-400" size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{factura.numero_factura}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{displayRadicado(factura.numero_radicado)}</p>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
                          {displayText(factura.observaciones || factura.descripcion)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Recibida: <span className="text-slate-700 dark:text-slate-200">{displayDate(factura.fecha_recepcion)}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Factura: <span className="text-slate-700 dark:text-slate-200">{displayDate(factura.fecha_factura)}</span>
                        </p>
                      </div>

                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          <Icon size={10} />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{formatMoney(factura.valor_total)}</p>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void openProviderDocuments(factura);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          <Eye size={13} />
                          Ver
                        </button>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-md px-2 py-1">
                          Detalle
                          <ChevronRight size={14} className="text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors flex-shrink-0" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-red-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}

      <Dialog open={documentosOpen} onOpenChange={setDocumentosOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip size={18} className="text-blue-600" />
              Documentacion del proveedor
            </DialogTitle>
            <DialogDescription>
              Soportes cargados por el proveedor para {selectedFacturaNumero}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {documentosLoading ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Cargando documentos del proveedor...
              </div>
            ) : documentosError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                {documentosError}
              </div>
            ) : documentosProveedor.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No hay documentos cargados por el proveedor para esta factura.
              </div>
            ) : (
              documentosProveedor.map((doc) => {
                const url = resolveDocumentUrl(doc);
                return (
                  <div key={doc.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800">{doc.tipo_documento}</p>
                        <p className="truncate text-sm text-slate-500">{doc.nombre_archivo}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {displayDate(doc.fecha_carga)}
                        </p>
                      </div>
                      {url ? (
                        <button
                          type="button"
                          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <Eye size={13} />
                          Ver documento
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Sin enlace disponible</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
