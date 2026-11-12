import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Loader } from 'lucide-react';
import type { useReportes } from '../../hooks/useReportes';

type Reportes = ReturnType<typeof useReportes>;

/** Reporte de ocupación por jornada y espacios más utilizados. */
export function ReporteOcupacion({
  errorOcupacion,
  cargandoOcupacion,
  datosOcupacion,
  espaciosMasUsados,
  isMobile
}: Pick<Reportes, 'errorOcupacion' | 'cargandoOcupacion' | 'datosOcupacion' | 'espaciosMasUsados'> & { isMobile: boolean }) {
  return (
    <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
      {errorOcupacion && (
        <div className="lg:col-span-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{errorOcupacion}</p>
        </div>
      )}
      
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Ocupación por Jornada - Semana Actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cargandoOcupacion ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 text-slate-400 animate-spin" />
              <span className="ml-2 text-slate-600 dark:text-slate-400">Cargando datos...</span>
            </div>
          ) : (
            datosOcupacion.map((dato, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-slate-900 dark:text-slate-100">{dato.jornada}</span>
                    <p className="text-slate-600 dark:text-slate-400">{dato.espacios} espacios</p>
                  </div>
                  <span className="text-slate-900 dark:text-slate-100">{dato.ocupacion}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <motion.div
                    className={`${dato.color} h-3 rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${dato.ocupacion}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  ></motion.div>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Espacios Más Utilizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cargandoOcupacion ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-slate-400 animate-spin" />
                <span className="ml-2 text-slate-600 dark:text-slate-400">Cargando datos...</span>
              </div>
            ) : (
              espaciosMasUsados.map((espacio, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                      <span className="text-white">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-slate-100">{espacio.espacio}</p>
                      <p className="text-slate-600 dark:text-slate-400">{espacio.usos} clases/semana</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400">
                    {espacio.ocupacion}%
                  </Badge>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
