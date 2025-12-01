import { Card, CardContent } from '../../share/card';
import { Badge } from '../../share/badge';
import { Button } from '../../share/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../share/tabs';
import { Bell, Check, CheckCheck, Trash2, AlertCircle, MessageSquare, Calendar, Settings, X, AlertTriangle, CheckCircle, Clock, Zap, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from '../../share/sonner';
import { useNotificaciones } from '../../hooks/users/useNotificaciones';

interface NotificacionesProps {
  onNotificacionesChange?: (count: number) => void;
}

export default function Notificaciones({ onNotificacionesChange }: NotificacionesProps) {
  const {
    filterTab,
    setFilterTab,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    filteredNotificaciones,
    stats,
    isLoading,
    recargar
  } = useNotificaciones(onNotificacionesChange);

  const getIcono = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'solicitud':
        return <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'mensaje':
        return <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'alerta':
        return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'sistema':
        return <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
      case 'exito':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'error':
        return <X className="w-5 h-5 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 rounded-full p-0.5" />;
      case 'advertencia':
        return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'horario':
        return <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'prestamo':
        return <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
      case 'espacio':
        return <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'facultad':
        return <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'solicitud':
        return 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 border-l-4 border-blue-500';
      case 'mensaje':
        return 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-950/50 dark:to-purple-900/50 border-l-4 border-purple-500';
      case 'alerta':
        return 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-950/50 dark:to-orange-900/50 border-l-4 border-orange-500';
      case 'sistema':
        return 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900/50 dark:to-slate-800/50 border-l-4 border-slate-500';
      case 'exito':
        return 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-950/50 dark:to-green-900/50 border-l-4 border-green-500';
      case 'error':
        return 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-950/50 dark:to-red-900/50 border-l-4 border-red-500';
      case 'advertencia':
        return 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-950/50 dark:to-yellow-900/50 border-l-4 border-yellow-500';
      case 'horario':
        return 'bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-950/50 dark:to-indigo-900/50 border-l-4 border-indigo-500';
      case 'prestamo':
        return 'bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-950/50 dark:to-cyan-900/50 border-l-4 border-cyan-500';
      case 'espacio':
        return 'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950/50 dark:to-emerald-900/50 border-l-4 border-emerald-500';
      case 'facultad':
        return 'bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-950/50 dark:to-violet-900/50 border-l-4 border-violet-500';
      default:
        return 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900/50 dark:to-slate-800/50 border-l-4 border-slate-400';
    }
  };

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg font-bold">
              🔥 Alta
            </Badge>
          </motion.div>
        );
      case 'media':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg font-bold">
              ⚡ Media
            </Badge>
          </motion.div>
        );
      case 'baja':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg font-bold">
              💧 Baja
            </Badge>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header con animación */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                <Bell className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Centro de Notificaciones
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Gestiona tus notificaciones y mantente al día con el sistema
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={recargar}
              className="border-2 border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500 hover:shadow-lg transition-all duration-300"
              disabled={isLoading}
            >
              <motion.div
                animate={isLoading ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
              >
                <Bell className="w-4 h-4 mr-2" />
              </motion.div>
              {isLoading ? 'Cargando...' : 'Actualizar'}
            </Button>
            <Button
              onClick={marcarTodasComoLeidas}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={stats.pendientes === 0 || isLoading}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
          </div>
        </motion.div>

        {/* Statistics con diseño mejorado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 mb-1 font-medium">Total</p>
                    <p className="text-4xl font-bold">{stats.total}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                    <Archive className="w-10 h-10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border-0 bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 mb-1 font-medium">Pendientes</p>
                    <p className="text-4xl font-bold">{stats.pendientes}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl animate-pulse">
                    <Zap className="w-10 h-10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 mb-1 font-medium">Leídas</p>
                    <p className="text-4xl font-bold">{stats.leidas}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

      {/* Tabs con diseño mejorado */}
      <Tabs value={filterTab} onValueChange={setFilterTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg p-2 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 gap-1">
          <TabsTrigger 
            value="importantes" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all duration-300"
          >
            <Zap className="w-4 h-4 mr-2" />
            Importantes
          </TabsTrigger>
          <TabsTrigger 
            value="pendientes"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white transition-all duration-300"
          >
            <Clock className="w-4 h-4 mr-2" />
            Pendientes
            {stats.pendientes > 0 && (
              <Badge className="ml-2 bg-white text-orange-600 font-bold">{stats.pendientes}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="horarios"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white transition-all duration-300"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Horarios
          </TabsTrigger>
          <TabsTrigger 
            value="espacios"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-300"
          >
            <Settings className="w-4 h-4 mr-2" />
            Espacios
          </TabsTrigger>
          <TabsTrigger 
            value="sistema"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white transition-all duration-300"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Sistema
          </TabsTrigger>
          <TabsTrigger 
            value="leidas"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-600 data-[state=active]:text-white transition-all duration-300"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Leídas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filterTab} className="mt-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredNotificaciones.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-xl">
                  <CardContent className="p-12 text-center">
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Bell className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-xl font-medium text-slate-600 dark:text-slate-400">
                      No hay notificaciones en esta categoría
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                      ¡Estás al día! 🎉
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              filteredNotificaciones.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card
                    className={`border-0 ${getTipoColor(notif.tipo)} ${
                      !notif.leida
                        ? 'shadow-xl ring-2 ring-offset-2 ring-offset-transparent'
                        : 'shadow-md opacity-90'
                    } hover:shadow-2xl transition-all duration-300 backdrop-blur-sm`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Ícono con animación */}
                        <motion.div 
                          className="flex-shrink-0 mt-1"
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm shadow-lg">
                            {getIcono(notif.tipo)}
                          </div>
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                  {notif.titulo}
                                </h3>
                                {getPrioridadBadge(notif.prioridad)}
                                {!notif.leida && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                  >
                                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                                      ✨ Nueva
                                    </Badge>
                                  </motion.div>
                                )}
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                                {notif.descripcion}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <Clock className="w-4 h-4" />
                                <p>{notif.fecha}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botones de acción con animaciones */}
                        <div className="flex items-center gap-2">
                          {!notif.leida && (
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                size="sm"
                                onClick={() => marcarComoLeida(notif.id)}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                                title="Marcar como leída"
                                disabled={isLoading}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          )}
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => eliminarNotificacion(notif.id)}
                              className="hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400"
                              title="Eliminar"
                              disabled={isLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
      </div>
      <Toaster />
    </div>
  );
}
