import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../share/card';
import { Button } from '../share/button';
import { CheckCircle, Clock, XCircle, Calendar, TrendingUp, AlertCircle, ChevronRight, BarChart3, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../share/badge';

export default function AudiovisualHome() {
  const navigate = useNavigate();
  const onNavigate = (menu: string) => navigate(`/dashboard/${menu}`);
  const estadisticas = [
    { 
      id: 1, 
      titulo: 'Solicitudes Pendientes', 
      valor: '5', 
      change: '+2 hoy',
      icon: Clock, 
      gradient: 'from-amber-500 to-amber-600',
      changePositive: false,
      accion: () => onNavigate('prestamos')
    },
    { 
      id: 2, 
      titulo: 'Aprobadas Hoy', 
      valor: '8', 
      change: '+3 esta semana',
      icon: CheckCircle, 
      gradient: 'from-emerald-500 to-emerald-600',
      changePositive: true,
      accion: () => onNavigate('prestamos')
    },
    { 
      id: 3, 
      titulo: 'Rechazadas Hoy', 
      valor: '2', 
      change: '-1 vs ayer',
      icon: XCircle, 
      gradient: 'from-red-500 to-red-600',
      changePositive: true,
      accion: () => onNavigate('prestamos')
    },
    { 
      id: 4, 
      titulo: 'Préstamos Activos', 
      valor: '12', 
      change: 'En curso',
      icon: Calendar, 
      gradient: 'from-blue-500 to-blue-600',
      changePositive: true,
      accion: () => onNavigate('prestamos')
    }
  ];

  const solicitudesRecientes = [
    { id: 1, solicitante: 'María González', espacio: 'Auditorio Central', fecha: '2025-11-05', hora: '14:00', estado: 'pendiente' },
    { id: 2, solicitante: 'Carlos Ruiz', espacio: 'Laboratorio 301', fecha: '2025-11-04', hora: '18:00', estado: 'pendiente' },
    { id: 3, solicitante: 'Ana Martínez', espacio: 'Sala de Juntas 1', fecha: '2025-11-03', hora: '09:00', estado: 'aprobado' },
    { id: 4, solicitante: 'Pedro López', espacio: 'Aula 205', fecha: '2025-11-02', hora: '16:00', estado: 'aprobado' },
    { id: 5, solicitante: 'Juan Pérez', espacio: 'Auditorio Central', fecha: '2025-11-01', hora: '08:00', estado: 'rechazado' }
  ];

  const prestamosProximos = [
    { espacio: 'Auditorio Central', fecha: '2025-11-05', hora: '10:00', solicitante: 'Depto. Sistemas' },
    { espacio: 'Lab 301', fecha: '2025-11-05', hora: '15:00', solicitante: 'Prof. García' },
    { espacio: 'Sala Juntas 2', fecha: '2025-11-06', hora: '09:00', solicitante: 'Decanatura' }
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">Pendiente</Badge>;
      case 'aprobado':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">Aprobado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400">Rechazado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-900 dark:via-blue-950/10 dark:to-slate-800 min-h-full">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-white mb-2">Panel de Control - Gestión Académica</h1>
          <p className="text-emerald-100 mb-6">
            Administra horarios académicos, visualiza información y gestiona préstamos de espacios
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={() => onNavigate('prestamos')}
              className="bg-white text-emerald-600 hover:bg-emerald-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Ver Solicitudes
            </Button>
            <Button 
              onClick={() => onNavigate('calendario')}
              className="bg-white text-emerald-600 hover:bg-emerald-50"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendario
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {estadisticas.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
              onClick={stat.accion}
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
                  <p className="text-slate-600 dark:text-slate-400 mb-1">{stat.titulo}</p>
                  <h3 className="text-slate-900 dark:text-slate-100 mb-2">{stat.valor}</h3>
                  <p className={`text-sm ${stat.changePositive ? 'text-green-600' : 'text-amber-600'}`}>
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Solicitudes Recientes */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-slate-100">Solicitudes Recientes</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('prestamos')}
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              >
                Ver Todas
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {solicitudesRecientes.map((solicitud, index) => (
                <motion.div
                  key={solicitud.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-slate-900 dark:text-slate-100">{solicitud.solicitante}</p>
                      {getEstadoBadge(solicitud.estado)}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">{solicitud.espacio}</p>
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-500 text-xs">
                      <span>{solicitud.fecha}</span>
                      <span>•</span>
                      <span>{solicitud.hora}</span>
                    </div>
                  </div>
                  {solicitud.estado === 'pendiente' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Próximos Préstamos */}
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Próximos Préstamos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prestamosProximos.map((prestamo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 to-blue-600 text-white rounded-lg p-2 w-14 h-14 flex-shrink-0">
                    <span className="text-xs">{prestamo.fecha.split('-')[1]}</span>
                    <span className="text-lg">{prestamo.fecha.split('-')[2]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-slate-100 text-sm mb-1">{prestamo.espacio}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mb-1">{prestamo.solicitante}</p>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{prestamo.hora}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h2 className="text-slate-900 dark:text-slate-100 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-all bg-white dark:bg-slate-800"
              onClick={() => onNavigate('horarios')}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4 shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-slate-900 dark:text-slate-100 mb-1">Horarios Académicos</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">Crear y gestionar horarios</p>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm">
                  <span>Acceder</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-all bg-white dark:bg-slate-800"
              onClick={() => onNavigate('visualizacion')}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-slate-900 dark:text-slate-100 mb-1">Visualización de Horarios</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">Consultar horarios de grupos</p>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm">
                  <span>Acceder</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-all bg-white dark:bg-slate-800"
              onClick={() => onNavigate('prestamos')}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-slate-900 dark:text-slate-100 mb-1">Préstamo de Espacios</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">Gestionar préstamos de espacios</p>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm">
                  <span>Acceder</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-all bg-white dark:bg-slate-800"
              onClick={() => onNavigate('ocupacion')}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-slate-900 dark:text-slate-100 mb-1">Ocupación Semanal</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">Ver ocupación de espacios</p>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm">
                  <span>Acceder</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-all bg-white dark:bg-slate-800"
              onClick={() => onNavigate('reportes')}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-slate-900 dark:text-slate-100 mb-1">Reportes Generales</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">Generar reportes del sistema</p>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm">
                  <span>Acceder</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
