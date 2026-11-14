import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Loader } from 'lucide-react';
import type { useReportes } from '../../hooks/useReportes';

type Reportes = ReturnType<typeof useReportes>;

/** Reporte de capacidad utilizada por tipo de espacio. */
export function ReporteCapacidad({
  errorCapacidad,
  cargandoCapacidad,
  capacidadUtilizada
}: Pick<Reportes, 'errorCapacidad' | 'cargandoCapacidad' | 'capacidadUtilizada'>) {
  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-slate-100">Capacidad Utilizada por Tipo de Espacio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {errorCapacidad && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{errorCapacidad}</p>
          </div>
        )}
        
        {cargandoCapacidad ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 text-slate-400 animate-spin" />
            <span className="ml-2 text-slate-600 dark:text-slate-400">Cargando datos...</span>
          </div>
        ) : (
          <>
            {capacidadUtilizada.map((dato, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-900 dark:text-slate-100">{dato.tipo}</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {dato.capacidadUsada} de {dato.capacidadTotal} estudiantes
                    </p>
                  </div>
                  <Badge className={`${Math.min(dato.porcentaje, 100) > 75 ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400'}`}>
                    {Math.min(dato.porcentaje, 100)}%
                  </Badge>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-purple-600 to-purple-700 h-4 rounded-full flex items-center justify-end pr-2"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(dato.porcentaje, 100)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <span className="text-white text-xs">{Math.min(dato.porcentaje, 100)}%</span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
