import { Card, CardContent } from '../../../../components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../../../components/ui/tooltip';
import { AlertCircle } from 'lucide-react';
import { Loading } from '../../../../components/common/Loading';
import type { usePrestamosEspaciosPagina } from '../../hooks/usePrestamosEspaciosPagina';

type Gestion = ReturnType<typeof usePrestamosEspaciosPagina>;

/** Solicitudes de préstamo en vista de cuadrícula. */
export function CuadriculaPrestamos({ vista, setDetalleGridId, filteredPrestamos, totalFilteredPrestamos, loading, getEstadoIcon }: Pick<Gestion, 'vista' | 'setDetalleGridId' | 'filteredPrestamos' | 'totalFilteredPrestamos' | 'loading' | 'getEstadoIcon'>) {
  return (
    <>
      {vista === 'cuadricula' && (
        loading && totalFilteredPrestamos === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent>
              <Loading message="Cargando solicitudes de préstamo..." />
            </CardContent>
          </Card>
        ) : totalFilteredPrestamos === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No hay solicitudes que mostrar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...filteredPrestamos]
              .sort((a, b) => {
                const fechaHoraA = `${a.fecha}T${a.horaInicio}`;
                const fechaHoraB = `${b.fecha}T${b.horaInicio}`;
                return fechaHoraA.localeCompare(fechaHoraB);
              })
              .map((prestamo) => (
                <Tooltip key={prestamo.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setDetalleGridId(prestamo.id)}
                      className={`text-left p-3 rounded-lg border transition-shadow hover:shadow-md bg-white dark:bg-slate-800 ${
                        prestamo.estado === 'pendiente'
                          ? 'border-yellow-300 dark:border-yellow-700'
                          : prestamo.estado === 'aprobado'
                            ? 'border-green-300 dark:border-green-700'
                            : 'border-red-300 dark:border-red-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        {getEstadoIcon(prestamo.estado)}
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {new Date(`${prestamo.fecha}T00:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-900 dark:text-slate-100 truncate">{prestamo.espacio}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{prestamo.horaInicio} - {prestamo.horaFin}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{prestamo.solicitante}</p>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium">{prestamo.tipoEvento}</p>
                    <p>{prestamo.espacio} · {prestamo.fecha} · {prestamo.horaInicio}-{prestamo.horaFin}</p>
                    <p>{prestamo.solicitante}</p>
                    {prestamo.motivo && <p className="opacity-80">{prestamo.motivo}</p>}
                  </TooltipContent>
                </Tooltip>
              ))}
          </div>
        )
      )}
    </>
  );
}
