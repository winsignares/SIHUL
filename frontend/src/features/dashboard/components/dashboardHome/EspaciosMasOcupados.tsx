import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { BarChart3, ChevronRight, Loader2 } from 'lucide-react';
import type { useDashboardHome } from '../../hooks/useDashboardHome';


type Home = ReturnType<typeof useDashboardHome>;
type Props = Pick<Home, 'topEspaciosOcupados'> & Pick<Home['state'], 'isLoadingOccupation'> & Pick<Home['setters'], 'setShowOccupationDetails'>;

/** Top de espacios con mayor ocupación semanal. */
export function EspaciosMasOcupados({
  topEspaciosOcupados,
  isLoadingOccupation,
  setShowOccupationDetails
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-red-600" />
                Espacios Más Ocupados
              </CardTitle>
              <p className="text-slate-600 mt-1">Top 10 espacios con mayor ocupación semanal</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOccupationDetails(true)}
              disabled={isLoadingOccupation}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              Ver Detalles
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingOccupation ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <span className="ml-3 text-slate-600">Cargando estadísticas...</span>
            </div>
          ) : topEspaciosOcupados.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay datos de ocupación disponibles
            </div>
          ) : (
            <div className="space-y-3">
              {topEspaciosOcupados.map((espacio, index) => {
                const getBarColor = (porcentaje: number) => {
                  if (porcentaje >= 85) return 'from-red-500 to-red-600';
                  if (porcentaje >= 70) return 'from-orange-500 to-orange-600';
                  if (porcentaje >= 50) return 'from-amber-500 to-amber-600';
                  if (porcentaje >= 30) return 'from-blue-500 to-blue-600';
                  return 'from-green-500 to-green-600';
                };

                const getBadgeColor = (porcentaje: number) => {
                  if (porcentaje >= 85) return 'bg-red-100 text-red-700 border-red-300';
                  if (porcentaje >= 70) return 'bg-orange-100 text-orange-700 border-orange-300';
                  if (porcentaje >= 50) return 'bg-amber-100 text-amber-700 border-amber-300';
                  if (porcentaje >= 30) return 'bg-blue-100 text-blue-700 border-blue-300';
                  return 'bg-green-100 text-green-700 border-green-300';
                };

                return (
                  <motion.div
                    key={espacio.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                    className="group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Ranking Badge */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Nombre del espacio */}
                      <div className="w-44">
                        <p className="text-slate-900 font-medium truncate">{espacio.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                            {espacio.tipo}
                          </Badge>
                          <span className="text-xs text-slate-500">Edif. {espacio.edificio}</span>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="flex-1">
                        <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden relative group-hover:shadow-md transition-shadow">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${getBarColor(espacio.porcentajeOcupacion)} relative overflow-hidden flex items-center justify-end px-3`}
                            initial={{ width: 0 }}
                            animate={{ width: `${espacio.porcentajeOcupacion}%` }}
                            transition={{ duration: 0.8, delay: 0.7 + index * 0.05, ease: "easeOut" }}
                          >
                            {/* Efecto shimmer */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                              animate={{ x: ['-100%', '200%'] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                            />
                            <span className="text-white font-bold text-sm z-10">
                              {espacio.porcentajeOcupacion.toFixed(1)}%
                            </span>
                          </motion.div>
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="flex items-center gap-3 w-40">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Horas</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {espacio.horasOcupadas}/{espacio.horasDisponibles}h
                          </p>
                        </div>
                        <Badge className={`${getBadgeColor(espacio.porcentajeOcupacion)} border font-semibold`}>
                          {espacio.porcentajeOcupacion >= 85 ? 'Crítico' :
                           espacio.porcentajeOcupacion >= 70 ? 'Alto' :
                           espacio.porcentajeOcupacion >= 50 ? 'Medio' : 'Bajo'}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Leyenda */}
              <div className="pt-4 border-t border-slate-200 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded"></div>
                      <span className="text-slate-600">&lt;30% - Bajo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
                      <span className="text-slate-600">30-50% - Medio-Bajo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded"></div>
                      <span className="text-slate-600">50-70% - Medio</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded"></div>
                      <span className="text-slate-600">70-85% - Alto</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded"></div>
                      <span className="text-slate-600">&gt;85% - Crítico</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
