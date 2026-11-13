import { Card, CardContent } from '../../../../components/ui/card';
import { Bell, AlertCircle, CheckCheck } from 'lucide-react';
import type { useNotificacionesPagina } from '../../hooks/useNotificacionesPagina';

type Gestion = ReturnType<typeof useNotificacionesPagina>;

/** Tarjetas con el total, las pendientes y las leídas. */
export function EstadisticasNotificaciones({ stats }: Pick<Gestion, 'stats'>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Total</p>
              <p className="text-slate-900 dark:text-slate-100">{stats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 dark:text-red-400 mb-1">Pendientes</p>
              <p className="text-red-900 dark:text-red-100">{stats.pendientes}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 mb-1">Leídas</p>
              <p className="text-green-900 dark:text-green-100">{stats.leidas}</p>
            </div>
            <CheckCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
