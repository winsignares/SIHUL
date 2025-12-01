import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import {
  Building2,
  MapPin,
  Clock,
  BookOpen,
  Users,
  TrendingUp,
  Bot,
  Activity,
  ChevronRight,
  CheckCircle2,
  FileText,
  Check,
  Loader2,
  Calendar,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../../share/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../share/dialog';
import { useDashboardHome } from '../../hooks/dashboard/useDashboardHome';
import { useNavigate } from 'react-router-dom';

interface DashboardHomeProps {
  onNavigate?: (page: string) => void;
}

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const navigate = useNavigate();
  const {
    stats,
    recentActivities,
    activities,
    quickStats,
    occupationDetails,
    occupationStats,
    topEspaciosOcupados,
    periodoActivo,
    state,
    setters,
    handlers
  } = useDashboardHome();

  const {
    showReportModal,
    isGeneratingReport,
    reportGenerated,
    showOccupationDetails,
    showAllActivities,
    isLoadingStats,
    isLoadingOccupation,
    isLoadingActivities,
    isLoadingPeriodo
  } = state;

  const {
    setShowReportModal,
    setShowOccupationDetails,
    setShowAllActivities
  } = setters;

  const {
    handleGenerateReport
  } = handlers;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-slate-900 mb-2">Bienvenido de nuevo! 👋</h1>
          <p className="text-slate-600">Aquí está el resumen de tu gestión académica</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-slate-300 hover:border-red-500 hover:text-red-600"
            disabled={isLoadingPeriodo}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {isLoadingPeriodo ? 'Cargando...' : periodoActivo ? `Período ${periodoActivo.nombre}` : 'Sin período activo'}
          </Button>

        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className={`border-0 shadow-lg bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm overflow-hidden relative group cursor-pointer`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-slate-600 mb-2">{stat.label}</p>
                      <motion.h2
                        className="text-slate-900"
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                      >
                        {stat.value}
                      </motion.h2>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`bg-gradient-to-r ${stat.gradient} text-white border-0`}>
                          {stat.change}
                        </Badge>
                        <span className="text-slate-500">este mes</span>
                      </div>
                    </div>
                    <motion.div
                      className={`${stat.iconBg} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg`}
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Grid de 2 columnas - SIN panel de perfil */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Espacios Más Ocupados */}
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

        {/* Actividad Reciente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">Actividad Reciente</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowAllActivities(true)}
                  disabled={isLoadingActivities}
                >
                  Ver Todo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                  <span className="ml-3 text-slate-600">Cargando actividades...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      No hay actividades recientes
                    </div>
                  ) : (
                    recentActivities.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          whileHover={{ x: 4, backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                          className="flex items-start gap-4 p-3 rounded-xl transition-all"
                        >
                          <div className={`${activity.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-900">{activity.title}</p>
                            <p className="text-slate-600 truncate">{activity.description}</p>
                            <p className="text-slate-500 mt-1">{activity.time}</p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white mb-2">Accesos Rápidos</h3>
                <p className="text-red-100">Gestiona rápidamente tus módulos principales</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                { label: 'Centro Horarios', icon: Clock, path: '/admin/centro-horarios' },
                { label: 'Asistente Virtual', icon: Bot, path: '/admin/asistente-virtual' },
                { label: 'Ver Reportes', icon: FileText, path: '/admin/reportes' },
                { label: 'Ocupación', icon: Activity, path: '/admin/ocupacion' }
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all border border-white/20 group"
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-8 h-8 text-yellow-400 mb-2" />
                    <p className="text-white group-hover:text-yellow-400 transition-colors">{action.label}</p>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal: Generar Reporte */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              {reportGenerated ? '¡Listo!' : '¿Desea generar el reporte del Dashboard?'}
            </DialogTitle>
            <DialogDescription>
              {reportGenerated
                ? 'El reporte ha sido procesado correctamente'
                : 'Se generará un reporte completo con todas las estadísticas actuales'
              }
            </DialogDescription>
          </DialogHeader>

          {isGeneratingReport && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
              <p className="text-slate-600">Generando reporte...</p>
            </div>
          )}

          {reportGenerated && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
              >
                <Check className="w-10 h-10 text-emerald-600" />
              </motion.div>
              <p className="text-slate-900 text-center">El reporte fue generado exitosamente</p>
            </motion.div>
          )}

          {!isGeneratingReport && !reportGenerated && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowReportModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateReport}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                Aceptar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Detalles de Espacios Ocupados */}
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

      {/* Modal: Ver Todas las Actividades */}
      <Dialog open={showAllActivities} onOpenChange={setShowAllActivities}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Historial de Actividades del Sistema</DialogTitle>
            <DialogDescription>
              Registro completo de eventos y acciones realizadas en el sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No hay actividades registradas
              </div>
            ) : (
              activities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-start gap-4 p-4 rounded-xl border bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className={`${activity.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-slate-900 font-medium">
                            {activity.title}
                          </p>
                          <p className="text-slate-600 mt-1">{activity.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1 text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{activity.time}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {activity.date}
                            </Badge>
                          </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowAllActivities(false)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}