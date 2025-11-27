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
  Circle,
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

interface DashboardHomeProps {
  onNavigate?: (page: string) => void;
}

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
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
    showAllActivities
  } = state;

  const {
    setShowReportModal,
    setShowOccupationDetails,
    setShowAllActivities
  } = setters;

  const {
    handleGenerateReport,
    markActivityAsCompleted
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
          <Button
            onClick={() => setShowReportModal(true)}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Generar Reporte
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
                >
                  Ver Detalles
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {occupationStats.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 w-24">{item.day}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden relative">
                        <motion.div
                          className={`${item.color} h-8 rounded-full flex items-center justify-end pr-3 text-white relative overflow-hidden`}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ delay: 0.7 + index * 0.05, duration: 0.8, ease: "easeOut" }}
                        >
                          <span className="relative z-10">{item.value}%</span>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                          />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
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
                >
                  Ver Todo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ x: 4, backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                      className="flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all"
                    >
                      <div className={`${activity.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900">{activity.title}</p>
                        <p className="text-slate-600 truncate">{activity.description}</p>
                        <p className="text-slate-500 mt-1">{activity.time}</p>
                      </div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        {activity.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markActivityAsCompleted(activity.id);
                            }}
                            className="hover:bg-emerald-50 rounded-full p-1 transition-colors"
                          >
                            <Circle className="w-5 h-5 text-amber-600 hover:text-emerald-600" />
                          </button>
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
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
                { label: 'Crear Horario', icon: Clock, action: 'crear-horario' },
                { label: 'Visualizar Horario', icon: Clock, action: 'horarios' },
                { label: 'Asistente Virtual', icon: Bot, action: 'asistentes' },
                { label: 'Ver Reportes', icon: FileText, action: 'reportes' }
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={index}
                    onClick={() => onNavigate(action.action)}
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Detalles de Ocupación Semanal</DialogTitle>
            <DialogDescription>
              Información detallada del uso de espacios por día y hora
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Resumen General */}
            <div className="grid grid-cols-3 gap-4">
              {quickStats.map((stat, index) => (
                <Card key={index} className="border-slate-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-slate-600 mb-2">{stat.label}</p>
                      <p className="text-slate-900">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Gráfico Detallado por Día */}
            <div className="space-y-4">
              <h4 className="text-slate-900">Ocupación por Día y Franja Horaria</h4>
              {occupationDetails.map((dia, idx) => (
                <Card key={idx} className="border-slate-200">
                  <CardContent className="pt-6">
                    <h5 className="text-slate-900 mb-4">{dia.day}</h5>
                    <div className="space-y-2">
                      {dia.franjas.map((franja, fidx) => (
                        <div key={fidx} className="flex items-center gap-3">
                          <span className="text-slate-600 w-32">{franja.hora}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                            <motion.div
                              className={`${franja.color} h-6 flex items-center justify-end pr-2 text-white`}
                              initial={{ width: 0 }}
                              animate={{ width: `${franja.ocupacion}%` }}
                              transition={{ delay: idx * 0.1 + fidx * 0.05, duration: 0.5 }}
                            >
                              <span>{franja.ocupacion}%</span>
                            </motion.div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowOccupationDetails(false)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Ver Todas las Actividades */}
      <Dialog open={showAllActivities} onOpenChange={setShowAllActivities}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Todas las Actividades</DialogTitle>
            <DialogDescription>
              Lista completa de actividades recientes del sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${activity.status === 'completed'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div className={`${activity.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`${activity.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {activity.title}
                        </p>
                        <p className="text-slate-600">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-slate-500">{activity.time}</p>
                          <Badge variant="outline" className="text-slate-600">
                            {activity.date}
                          </Badge>
                        </div>
                      </div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        {activity.status === 'completed' ? (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Realizada</span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markActivityAsCompleted(activity.id)}
                            className="hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-600"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Marcar como realizada
                          </Button>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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