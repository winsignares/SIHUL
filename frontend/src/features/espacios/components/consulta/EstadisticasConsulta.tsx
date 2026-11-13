import { Card, CardContent } from '../../../../components/ui/card';
import { MapPin, Home } from 'lucide-react';
import type { useConsultaEspaciosPagina } from '../../hooks/useConsultaEspaciosPagina';

type Gestion = ReturnType<typeof useConsultaEspaciosPagina>;

/** Tarjetas con el total de espacios, abiertos y cerrados. */
export function EstadisticasConsulta({ isMobile, estadisticas }: Pick<Gestion, 'isMobile' | 'estadisticas'>) {
  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-2 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className={`text-slate-600 dark:text-slate-400 mb-1 ${isMobile ? 'text-xs' : ''}`}>Total Espacios</p>
              <p className={`text-slate-900 dark:text-slate-100 ${isMobile ? 'text-lg' : ''}`}>{estadisticas.total}</p>
            </div>
            <Home className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-600 flex-shrink-0`} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className={`text-slate-600 dark:text-slate-400 mb-1 ${isMobile ? 'text-xs' : ''}`}>Abiertos</p>
              <p className={`text-slate-900 dark:text-slate-100 ${isMobile ? 'text-lg' : ''}`}>{estadisticas.abiertos}</p>
            </div>
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center flex-shrink-0`}>
              <MapPin className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-green-600`} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className={`text-slate-600 dark:text-slate-400 mb-1 ${isMobile ? 'text-xs' : ''}`}>Cerrados</p>
              <p className={`text-slate-900 dark:text-slate-100 ${isMobile ? 'text-lg' : ''}`}>{estadisticas.cerrados}</p>
            </div>
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center flex-shrink-0`}>
              <MapPin className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-red-600`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
