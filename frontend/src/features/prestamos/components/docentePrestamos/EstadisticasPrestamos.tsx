import { Card, CardContent } from '../../../../components/ui/card';
import { Calendar, Clock, FileText } from 'lucide-react';
import type { useDocentePrestamos } from '../../hooks/useDocentePrestamos';

type DocentePrestamos = ReturnType<typeof useDocentePrestamos>;

/** Tarjetas con el total, aprobadas y pendientes. */
export function EstadisticasPrestamos({
  estadisticas,
  isMobile
}: Pick<DocentePrestamos, 'estadisticas'> & { isMobile: boolean }) {
  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Total Solicitudes</p>
              <p className="text-slate-900 dark:text-slate-100">{estadisticas.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 mb-1">Aprobadas</p>
              <p className="text-green-900 dark:text-green-100">{estadisticas.aprobados}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 dark:text-yellow-400 mb-1">Pendientes</p>
              <p className="text-yellow-900 dark:text-yellow-100">{estadisticas.pendientes}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
