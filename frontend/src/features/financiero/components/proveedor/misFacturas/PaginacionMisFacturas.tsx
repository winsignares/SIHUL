import { ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { useMisFacturas } from '../../../hooks/proveedor/useMisFacturas';

type Gestion = ReturnType<typeof useMisFacturas>;

/** Paginación del listado. */
export function PaginacionMisFacturas({ loading, currentPage, setCurrentPage, ITEMS_PER_PAGE, sortedFilteredFacturas, totalPages, paginationItems }: Pick<Gestion, 'loading' | 'currentPage' | 'setCurrentPage' | 'ITEMS_PER_PAGE' | 'sortedFilteredFacturas' | 'totalPages' | 'paginationItems'>) {
  return (
    <>
      {!loading && sortedFilteredFacturas.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800/80">
          <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, sortedFilteredFacturas.length)} de {sortedFilteredFacturas.length} facturas
            </p>
            <p className="font-semibold text-slate-700 dark:text-white">Página {currentPage} de {Math.max(totalPages, 1)}</p>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-red-500/40 dark:hover:bg-slate-700"
              >
                <ChevronsLeft size={16} /> Inicio
              </button>
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-red-500/40 dark:hover:bg-slate-700"
              >
                <ChevronLeft size={16} /> Anterior
              </button>

              <div className="flex flex-wrap items-center justify-center gap-1">
                {paginationItems.map((item, index) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-base font-semibold text-slate-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`h-9 min-w-[2.3rem] rounded-xl border px-3 text-sm font-semibold transition-all ${
                        item === currentPage
                          ? 'border-red-500 bg-red-600 text-white shadow-[0_6px_16px_rgba(220,38,38,0.3)]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-red-500/40'
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-red-500/40 dark:hover:bg-slate-700"
              >
                Siguiente <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-red-500/40 dark:hover:bg-slate-700"
              >
                Fin <ChevronsRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
