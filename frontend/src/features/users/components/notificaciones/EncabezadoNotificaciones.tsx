import { Button } from '../../../../components/ui/button';
import { CheckCheck } from 'lucide-react';
import type { useNotificacionesPagina } from '../../hooks/useNotificacionesPagina';

type Gestion = ReturnType<typeof useNotificacionesPagina>;

/** Título de la página y botón para marcar todas como leídas. */
export function EncabezadoNotificaciones({ marcarTodasComoLeidas, stats }: Pick<Gestion, 'marcarTodasComoLeidas' | 'stats'>) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-slate-900 dark:text-slate-100 mb-2">Centro de Notificaciones</h1>
        <p className="text-slate-600 dark:text-slate-400">Gestiona tus notificaciones, solicitudes y alertas del sistema</p>
      </div>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={marcarTodasComoLeidas}
          className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
          disabled={stats.pendientes === 0}
        >
          <CheckCheck className="w-4 h-4 mr-2" />
          Marcar todas como leídas
        </Button>
      </div>
    </div>
  );
}
