import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  FileText,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Activity,
  ChevronRight,
  BarChart3,
  HandCoins
} from 'lucide-react';
import { motion } from 'motion/react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';

interface ConsultorDashboardHomeProps {
  onNavigate: (page: string) => void;
}

export default function ConsultorDashboardHome({ onNavigate }: ConsultorDashboardHomeProps) {
  const stats = [
    { 
      label: 'Espacios Disponibles', 
      value: '28', 
      change: '+5 desde ayer', 
      icon: MapPin, 
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/10',
      iconBg: 'bg-blue-500',
      changePositive: true
    },
    { 
      label: 'Horarios Consultados', 
      value: '156', 
      change: '+12 esta semana', 
      icon: Clock, 
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-500/10 to-emerald-600/10',
      iconBg: 'bg-emerald-500',
      changePositive: true
    },
    { 
      label: 'Reportes Generados', 
      value: '24', 
      change: '+8 este mes', 
      icon: FileText, 
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-500/10 to-amber-600/10',
      iconBg: 'bg-amber-500',
      changePositive: true
    },
    { 
      label: 'Ocupación Promedio', 
      value: '82%', 
      change: 'Óptimo', 
      icon: BarChart3, 
      gradient: 'from-violet-500 to-violet-600',
      bgGradient: 'from-violet-500/10 to-violet-600/10',
      iconBg: 'bg-violet-500',
      changePositive: true
    }
  ];

  const quickActions = [
    { 
      title: 'Consultar Horarios', 
      description: 'Ver horarios disponibles',
      icon: Clock, 
      color: 'from-emerald-500 to-emerald-600',
      action: 'horarios'
    },
    { 
      title: 'Ver Disponibilidad', 
      description: 'Espacios disponibles ahora',
      icon: MapPin, 
      color: 'from-blue-500 to-blue-600',
      action: 'espacios'
    },
    { 
      title: 'Generar Reporte', 
      description: 'Crear nuevo reporte',
      icon: FileText, 
      color: 'from-amber-500 to-amber-600',
      action: 'reportes'
    },
    { 
      title: 'Ver Ocupación', 
      description: 'Estadísticas de uso',
      icon: BarChart3, 
      color: 'from-violet-500 to-violet-600',
      action: 'ocupacion'
    }
  ];

  const recentActivities = [
    { 
      title: 'Consulta de Horario', 
      description: 'Ingeniería de Sistemas - Grupo A', 
      time: 'Hace 5 minutos',
      status: 'completed',
      icon: Clock,
      color: 'bg-emerald-500'
    },
    { 
      title: 'Reporte Generado', 
      description: 'Ocupación Semanal - Periodo 2025-1', 
      time: 'Hace 15 minutos',
      status: 'completed',
      icon: FileText,
      color: 'bg-amber-500'
    },
    { 
      title: 'Espacio Consultado', 
      description: 'Laboratorio 301 - Edificio C', 
      time: 'Hace 1 hora',
      status: 'completed',
      icon: MapPin,
      color: 'bg-blue-500'
    },
    { 
      title: 'Préstamo Solicitado', 
      description: 'Auditorio Central - 15 de Octubre', 
      time: 'Hace 2 horas',
      status: 'pending',
      icon: HandCoins,
      color: 'bg-violet-500'
    }
  ];

  const upcomingEvents = [
    { 
      date: '22 Oct', 
      title: 'Mantenimiento Programado', 
      location: 'Laboratorio 301',
      time: '14:00 - 17:00',
      type: 'maintenance'
    },
    { 
      date: '23 Oct', 
      title: 'Evento Académico', 
      location: 'Auditorio Central',
      time: '09:00 - 12:00',
      type: 'event'
    },
    { 
      date: '24 Oct', 
      title: 'Reserva Aprobada', 
      location: 'Sala de Juntas 2',
      time: '10:00 - 11:30',
      type: 'approved'
    }
  ];

  const occupancyData = [
    { day: 'Lun', percentage: 85, classes: 68 },
    { day: 'Mar', percentage: 92, classes: 72 },
    { day: 'Mié', percentage: 78, classes: 65 },
    { day: 'Jue', percentage: 70, classes: 58 },
    { day: 'Vie', percentage: 55, classes: 45 }
  ];

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-900 dark:via-blue-950/10 dark:to-slate-800 min-h-full">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-white mb-2">Bienvenido al Sistema de Consultas</h1>
          <p className="text-blue-100 mb-6">
            Accede a información actualizada sobre espacios, horarios y disponibilidad
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={() => onNavigate('horarios')}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Clock className="w-4 h-4 mr-2" />
              Consultar Horarios
            </Button>
            <Button 
              onClick={() => onNavigate('espacios')}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Ver Disponibilidad
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {stat.changePositive ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-1">{stat.label}</p>
                  <h3 className="text-slate-900 dark:text-slate-100 mb-2">{stat.value}</h3>
                  <p className={`text-sm ${stat.changePositive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-slate-900 dark:text-slate-100 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-all bg-white dark:bg-slate-800"
                  onClick={() => onNavigate(action.action)}
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-slate-900 dark:text-slate-100 mb-1">{action.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{action.description}</p>
                    <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm">
                      <span>Acceder</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className={`${activity.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-slate-900 dark:text-slate-100">{activity.title}</p>
                        {activity.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">{activity.description}</p>
                      <p className="text-slate-500 dark:text-slate-500 text-xs">{activity.time}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-lg p-2 w-14 h-14 flex-shrink-0">
                    <span className="text-xs">{event.date.split(' ')[1]}</span>
                    <span className="text-lg">{event.date.split(' ')[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-slate-900 dark:text-slate-100 text-sm">{event.title}</p>
                      {event.type === 'approved' && (
                        <Badge className="bg-green-100 text-green-800 border-green-300">Aprobado</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs mb-1">
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Chart */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 dark:text-slate-100">Ocupación de la Semana</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate('ocupacion')}
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              Ver Detalle
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4 h-48">
            {occupancyData.map((data, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="w-full flex flex-col items-center gap-2 flex-1 justify-end">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{data.classes}</span>
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-blue-600 to-violet-500 rounded-t-lg relative"
                    style={{ height: `${data.percentage}%`, transformOrigin: 'bottom' }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-900 dark:text-slate-100">
                      {data.percentage}%
                    </div>
                  </motion.div>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">{data.day}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
