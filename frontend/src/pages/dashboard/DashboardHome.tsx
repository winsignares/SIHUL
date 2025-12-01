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
  Calendar
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
    isLoadingActivities
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
          >
            <Calendar className="w-4 h-4 mr-2" />
            Período 2025-1
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
        {/* Estadísticas de Ocupación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900">Estadísticas de Ocupación</CardTitle>
                  <p className="text-slate-600 mt-1">Resumen semanal de uso de espacios</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOccupationDetails(true)}
                  disabled={isLoadingOccupation}
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
              ) : occupationStats.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No hay datos de ocupación disponibles
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Diseño tipo gráfico de barras moderno */}
                  <div className="grid grid-cols-7 gap-2">
                    {occupationStats.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                        className="flex flex-col items-center"
                      >
                        {/* Barra vertical */}
                        <div className="w-full h-32 bg-slate-100 rounded-lg overflow-hidden relative flex flex-col justify-end">
                          <motion.div
                            className={`w-full bg-gradient-to-t ${item.color} relative overflow-hidden rounded-b-lg ${
                              item.isToday ? 'ring-2 ring-red-500 ring-offset-2' : ''
                            }`}
                            initial={{ height: 0 }}
                            animate={{ height: `${item.value}%` }}
                            transition={{ delay: 0.7 + index * 0.05, duration: 0.8, ease: "easeOut" }}
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
                              animate={{ y: ['-100%', '200%'] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                            />
                          </motion.div>
                          
                          {/* Indicador de porcentaje */}
                          <div className="absolute top-2 left-0 right-0 text-center">
                            <span className={`text-xs font-bold ${item.value > 50 ? 'text-white' : 'text-slate-600'}`}>
                              {item.value}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Información del día */}
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-semibold ${item.isToday ? 'text-red-600' : 'text-slate-700'}`}>
                            {item.dayShort}
                          </p>
                          {item.isToday && (
                            <span className="text-[10px] text-red-500 font-bold">HOY</span>
                          )}
                        </div>
                        
                        {/* Tooltip con información detallada */}
                        <div className="mt-1 text-center">
                          <p className="text-[10px] text-slate-500">
                            {item.espaciosOcupados}/{item.totalEspacios}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            espacios
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Leyenda de colores */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
                          <span className="text-slate-600">Baja (&lt;30%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
                          <span className="text-slate-600">Media (30-50%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-amber-600 rounded"></div>
                          <span className="text-slate-600">Alta (50-70%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-600 rounded"></div>
                          <span className="text-slate-600">Crítica (&gt;70%)</span>
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
              <p className="text-slate-900 text-center">El reporte ha sido generado exitosamente</p>
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

      {/* Modal: Detalles de Ocupación */}
      <Dialog open={showOccupationDetails} onOpenChange={setShowOccupationDetails}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100">
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                📊 Detalles de Ocupación Semanal
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-2">
                Análisis completo del uso de espacios por día y franja horaria
              </DialogDescription>
            </motion.div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Resumen General con Tarjetas Mejoradas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="grid grid-cols-3 gap-4"
            >
              {quickStats.map((stat, index) => {
                const colors = [
                  { gradient: 'from-violet-500 to-purple-600', bg: 'from-violet-500/10 to-purple-600/10', icon: 'bg-violet-500' },
                  { gradient: 'from-blue-500 to-cyan-600', bg: 'from-blue-500/10 to-cyan-600/10', icon: 'bg-blue-500' },
                  { gradient: 'from-emerald-500 to-teal-600', bg: 'from-emerald-500/10 to-teal-600/10', icon: 'bg-emerald-500' }
                ];
                const color = colors[index];
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <Card className={`border-0 shadow-xl bg-gradient-to-br ${color.bg} backdrop-blur-sm overflow-hidden relative group cursor-pointer`}>
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color.gradient} opacity-20 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`}></div>
                      <CardContent className="pt-6 relative">
                        <div className="text-center">
                          <div className={`${color.icon} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-slate-600 text-sm mb-2 font-medium">{stat.label}</p>
                          <motion.p
                            className={`text-3xl font-bold bg-gradient-to-r ${color.gradient} bg-clip-text text-transparent`}
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

            {/* Mapa de Calor Mejorado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-600" />
                  Mapa de Calor - Ocupación por Franja Horaria
                </h4>
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
                  Semana Actual
                </Badge>
              </div>
              
              {occupationDetails.map((dia, idx) => {
                // Colores diferentes para cada día
                const dayColors = [
                  { border: 'border-violet-200', header: 'from-violet-500 to-purple-600', headerBg: 'from-violet-50 to-purple-50' },
                  { border: 'border-blue-200', header: 'from-blue-500 to-cyan-600', headerBg: 'from-blue-50 to-cyan-50' },
                  { border: 'border-emerald-200', header: 'from-emerald-500 to-teal-600', headerBg: 'from-emerald-50 to-teal-50' },
                  { border: 'border-amber-200', header: 'from-amber-500 to-orange-600', headerBg: 'from-amber-50 to-orange-50' },
                  { border: 'border-rose-200', header: 'from-rose-500 to-pink-600', headerBg: 'from-rose-50 to-pink-50' },
                  { border: 'border-indigo-200', header: 'from-indigo-500 to-purple-600', headerBg: 'from-indigo-50 to-purple-50' },
                  { border: 'border-slate-200', header: 'from-slate-500 to-gray-600', headerBg: 'from-slate-50 to-gray-50' }
                ];
                const dayColor = dayColors[idx % 7];
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.08, duration: 0.5 }}
                  >
                    <Card className={`border-2 ${dayColor.border} hover:shadow-2xl transition-all duration-300 overflow-hidden group`}>
                      <div className={`bg-gradient-to-r ${dayColor.header} p-4`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                              <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <h5 className="text-white text-lg font-bold">{dia.day}</h5>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 font-semibold">
                              {dia.franjas.reduce((sum, f) => sum + (f.espaciosUsados || 0), 0)} espacios usados
                            </Badge>
                            <motion.div
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              <Activity className="w-5 h-5 text-white" />
                            </motion.div>
                          </div>
                        </div>
                      </div>
                      
                      <CardContent className={`pt-6 bg-gradient-to-br ${dayColor.headerBg}`}>
                        <div className="space-y-3">
                          {dia.franjas.map((franja, fidx) => (
                            <motion.div
                              key={fidx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + idx * 0.05 + fidx * 0.03, duration: 0.4 }}
                              className="flex items-center gap-3"
                            >
                              <div className="flex items-center gap-2 w-36">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-700 text-sm font-semibold">{franja.hora}</span>
                              </div>
                              <div className="flex-1 bg-white rounded-xl h-12 overflow-hidden relative group/bar shadow-sm border border-slate-200">
                                <motion.div
                                  className={`bg-gradient-to-r ${franja.color} h-12 rounded-xl flex items-center justify-between px-4 text-white text-sm font-bold relative overflow-hidden shadow-lg`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${franja.ocupacion}%` }}
                                  transition={{ delay: 0.7 + idx * 0.05 + fidx * 0.03, duration: 0.8, ease: "easeOut" }}
                                  whileHover={{ scale: 1.03 }}
                                >
                                  <span className="relative z-10 flex items-center gap-2">
                                    <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                                      {franja.ocupacion}%
                                    </span>
                                  </span>
                                  <span className="relative z-10 flex items-center gap-2 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                                    <MapPin className="w-3 h-3" />
                                    {franja.espaciosUsados}/{franja.totalEspacios}
                                  </span>
                                  
                                  {/* Animación de brillo */}
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                                  />
                                  
                                  {/* Patrón de fondo */}
                                  <div className="absolute inset-0 opacity-10" style={{
                                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                                    backgroundSize: '10px 10px'
                                  }}></div>
                                </motion.div>
                                
                                {/* Tooltip mejorado */}
                                <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs opacity-0 group-hover/bar:opacity-100 transition-opacity shadow-xl whitespace-nowrap pointer-events-none z-20">
                                  <div className="font-bold mb-1">📊 {franja.hora}</div>
                                  <div>{franja.espaciosUsados} de {franja.totalEspacios} espacios ocupados</div>
                                  <div className="text-[10px] text-slate-300 mt-1">Ocupación: {franja.ocupacion}%</div>
                                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
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