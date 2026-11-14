import { Button } from '../../../../components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { useNotificacionesPagina } from '../../hooks/useNotificacionesPagina';

type Gestion = ReturnType<typeof useNotificacionesPagina>;

/** Controles de paginación de las notificaciones. */
export function PaginacionNotificaciones({
  paginaActual, totalPaginas, totalNotificaciones, cambiarPagina, isLoading,
}: Pick<Gestion, 'paginaActual' | 'totalPaginas' | 'totalNotificaciones' | 'cambiarPagina' | 'isLoading'>) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Mostrando página <span className="font-bold text-blue-600 dark:text-blue-400">{paginaActual}</span> de <span className="font-bold text-blue-600 dark:text-blue-400">{totalPaginas}</span>
        {' '}({totalNotificaciones} notificación{totalNotificaciones !== 1 ? 'es' : ''} en total)
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => cambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1 || isLoading}
          className="border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
            let pageNum;
            if (totalPaginas <= 5) {
              pageNum = i + 1;
            } else if (paginaActual <= 3) {
              pageNum = i + 1;
            } else if (paginaActual >= totalPaginas - 2) {
              pageNum = totalPaginas - 4 + i;
            } else {
              pageNum = paginaActual - 2 + i;
            }

            return (
              <Button
                key={`page-${pageNum}`}
                variant={paginaActual === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => cambiarPagina(pageNum)}
                disabled={isLoading}
                className={`w-8 h-8 p-0 ${
                  paginaActual === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => cambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas || isLoading}
          className="border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
