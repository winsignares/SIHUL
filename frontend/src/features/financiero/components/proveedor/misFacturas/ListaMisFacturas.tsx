import { motion } from 'framer-motion';
import { FileText, ChevronRight, Eye } from 'lucide-react';
import { displayDate, displayRadicado, displayText } from '../../../../../components/ui/field-placeholders';
import { formatMoney, ESTADO_CONFIG } from '../../../hooks/proveedor/misFacturasUtils';
import type { useMisFacturas } from '../../../hooks/proveedor/useMisFacturas';

type Gestion = ReturnType<typeof useMisFacturas>;

/** Listado de facturas del proveedor. */
export function ListaMisFacturas({ navigate, facturas, loading, sortedFilteredFacturas, paginatedFacturas, openProviderDocuments }: Pick<Gestion, 'navigate' | 'facturas' | 'loading' | 'sortedFilteredFacturas' | 'paginatedFacturas' | 'openProviderDocuments'>) {
  return (
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
          <div className="min-w-[980px]">
            <div
              className="grid gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 mis-facturas-grid"
            >
              <span>Factura</span>
              <span>Identificacion</span>
              <span>Fechas</span>
              <span>Estado</span>
              <span className="text-right">Total</span>
              <span className="text-center">Acciones</span>
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
                    className="grid gap-4 px-5 py-4 items-center hover:bg-rose-50/40 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group mis-facturas-grid"
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
                        {displayText(factura.identificacion_factura || '—')}
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

                    <div className="flex items-center justify-center gap-2">
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
  );
}
