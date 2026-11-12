import { motion } from 'motion/react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Activity, AlertCircle, BarChart3, CheckCircle2, Clock, MapPin, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import type { useDashboardHome } from '../../hooks/useDashboardHome';


type Home = ReturnType<typeof useDashboardHome>;
type Props = Pick<Home, 'topEspaciosOcupados'> & Pick<Home['state'], 'showOccupationDetails'> & Pick<Home['setters'], 'setShowOccupationDetails'>;

/** Detalle de ocupación por espacio y jornada. */
export function ModalDetalleOcupacion({
  showOccupationDetails,
  setShowOccupationDetails,
  topEspaciosOcupados
}: Props) {
  return (
    <Dialog open={showOccupationDetails} onOpenChange={setShowOccupationDetails}>
      <DialogContent className="!max-w-[76vw] !w-[76vw] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100">
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent flex items-center gap-2">
              <BarChart3 className="w-7 h-7" />
              Análisis Detallado de Ocupación de Espacios
            </DialogTitle>
            <DialogDescription className="text-slate-600 mt-2">
              Información completa sobre ocupación semanal, jornadas y distribución por tipo de espacio
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resumen Estadístico */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="grid grid-cols-4 gap-4"
          >
            {[
              { 
                label: 'Total Espacios', 
                value: topEspaciosOcupados.length.toString(), 
                gradient: 'from-violet-500 to-purple-600', 
                bg: 'from-violet-500/10 to-purple-600/10',
                icon: MapPin
              },
              { 
                label: 'Promedio Ocupación', 
                value: `${(topEspaciosOcupados.reduce((sum, e) => sum + e.porcentajeOcupacion, 0) / topEspaciosOcupados.length || 0).toFixed(1)}%`,
                gradient: 'from-blue-500 to-cyan-600', 
                bg: 'from-blue-500/10 to-cyan-600/10',
                icon: TrendingUp
              },
              { 
                label: 'Total Horas', 
                value: `${topEspaciosOcupados.reduce((sum, e) => sum + e.horasOcupadas, 0)}h`,
                gradient: 'from-emerald-500 to-teal-600', 
                bg: 'from-emerald-500/10 to-teal-600/10',
                icon: Clock
              },
              { 
                label: 'Sobreocupados', 
                value: topEspaciosOcupados.filter(e => e.porcentajeOcupacion > 85).length.toString(),
                gradient: 'from-red-500 to-orange-600', 
                bg: 'from-red-500/10 to-orange-600/10',
                icon: AlertCircle
              }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <Card className={`border-0 shadow-xl bg-gradient-to-br ${stat.bg} backdrop-blur-sm overflow-hidden relative group cursor-pointer`}>
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-20 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`}></div>
                    <CardContent className="pt-6 relative">
                      <div className="text-center">
                        <div className={`bg-gradient-to-br ${stat.gradient} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-slate-600 text-sm mb-2 font-medium">{stat.label}</p>
                        <motion.p
                          className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                          initial={{ scale: 0.5 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                        >
                          {stat.value}
                        </motion.p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Lista Completa de Espacios con Detalles por Jornada */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                Detalle de Ocupación por Jornada
              </h4>
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
                Top {topEspaciosOcupados.length} Espacios
              </Badge>
            </div>
            
            {topEspaciosOcupados.map((espacio, idx) => {
              const getBarColor = (porcentaje: number) => {
                if (porcentaje >= 85) return 'from-red-500 to-red-600';
                if (porcentaje >= 70) return 'from-orange-500 to-orange-600';
                if (porcentaje >= 50) return 'from-amber-500 to-amber-600';
                if (porcentaje >= 30) return 'from-blue-500 to-blue-600';
                return 'from-green-500 to-green-600';
              };

              const getBorderColor = (porcentaje: number) => {
                if (porcentaje >= 85) return 'border-red-200';
                if (porcentaje >= 70) return 'border-orange-200';
                if (porcentaje >= 50) return 'border-amber-200';
                if (porcentaje >= 30) return 'border-blue-200';
                return 'border-green-200';
              };
              
              return (
                <motion.div
                  key={espacio.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05, duration: 0.5 }}
                >
                  <Card className={`border-2 ${getBorderColor(espacio.porcentajeOcupacion)} hover:shadow-2xl transition-all duration-300 overflow-hidden group`}>
                    <div className={`bg-gradient-to-r ${getBarColor(espacio.porcentajeOcupacion)} p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                            idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                            idx === 1 ? 'bg-slate-300 text-slate-700' :
                            idx === 2 ? 'bg-orange-400 text-orange-900' :
                            'bg-white/20 backdrop-blur-sm text-white'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <h5 className="text-white text-lg font-bold">{espacio.nombre}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                                {espacio.tipo}
                              </Badge>
                              <span className="text-white/90 text-xs">Edif. {espacio.edificio}</span>
                              <span className="text-white/90 text-xs">• Cap: {espacio.capacidad} pers.</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-white text-3xl font-bold">{espacio.porcentajeOcupacion.toFixed(1)}%</p>
                            <p className="text-white/90 text-sm">{espacio.horasOcupadas}/{espacio.horasDisponibles}h ocupadas</p>
                          </div>
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Activity className="w-6 h-6 text-white" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="pt-6 bg-white">
                      <div className="grid grid-cols-3 gap-4">
                        {/* Jornada Mañana */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + idx * 0.05, duration: 0.4 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
                              <span className="text-slate-700 font-semibold text-sm">☀️ Mañana</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {espacio.jornada.manana}%
                            </Badge>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 relative"
                              initial={{ width: 0 }}
                              animate={{ width: `${espacio.jornada.manana}%` }}
                              transition={{ duration: 0.8, delay: 0.7 + idx * 0.05 }}
                            >
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                              />
                            </motion.div>
                          </div>
                        </motion.div>

                        {/* Jornada Tarde */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.65 + idx * 0.05, duration: 0.4 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"></div>
                              <span className="text-slate-700 font-semibold text-sm">🌤️ Tarde</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {espacio.jornada.tarde}%
                            </Badge>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 relative"
                              initial={{ width: 0 }}
                              animate={{ width: `${espacio.jornada.tarde}%` }}
                              transition={{ duration: 0.8, delay: 0.75 + idx * 0.05 }}
                            >
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                              />
                            </motion.div>
                          </div>
                        </motion.div>

                        {/* Jornada Noche */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + idx * 0.05, duration: 0.4 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
                              <span className="text-slate-700 font-semibold text-sm">🌙 Noche</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {espacio.jornada.noche}%
                            </Badge>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 relative"
                              initial={{ width: 0 }}
                              animate={{ width: `${espacio.jornada.noche}%` }}
                              transition={{ duration: 0.8, delay: 0.8 + idx * 0.05 }}
                            >
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                              />
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <DialogFooter className="border-t border-slate-200 pt-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setShowOccupationDetails(false)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
