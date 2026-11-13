import { Calendar } from 'lucide-react';
import type { usePublicConsultaHorarioPagina } from '../../hooks/usePublicConsultaHorarioPagina';

type Gestion = ReturnType<typeof usePublicConsultaHorarioPagina>;

/** Título de la página y período actual. */
export function EncabezadoConsultaHorario({ periodoActual }: Pick<Gestion, 'periodoActual'>) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-slate-900 dark:text-slate-100 mb-2">Consulta de Horarios</h1>
        <p className="text-slate-600 dark:text-slate-400">Visualiza horarios por programa o docente</p>
      </div>
      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="text-blue-900 dark:text-blue-100"><strong>{periodoActual}</strong></span>
      </div>
    </div>
  );
}
