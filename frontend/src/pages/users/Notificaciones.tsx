import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../share/card';
import { Badge } from '../../share/badge';
import { Button } from '../../share/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../share/tabs';
import { Bell, Check, CheckCheck, Trash2, AlertCircle, MessageSquare, Calendar, Settings, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from '../../share/sonner';

interface Notificacion {
  id: string;
  tipo: 'solicitud' | 'mensaje' | 'alerta' | 'sistema' | 'exito' | 'error' | 'advertencia';
  titulo: string;
  descripcion: string;
  fecha: string;
  leida: boolean;
  eliminada: boolean;
  prioridad: 'alta' | 'media' | 'baja';
}

interface NotificacionesProps {
  onNotificacionesChange?: (count: number) => void;
}

export default function Notificaciones({ onNotificacionesChange }: NotificacionesProps) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([
    {
      id: '1',
      tipo: 'solicitud',
      titulo: 'Solicitud de cambio de aula',
      descripcion: 'El docente Juan Pérez solicita cambio del Aula 101 al Aula 205 para el horario del martes 14:00-16:00',
      fecha: '2025-10-22 10:30',
      leida: false,
      eliminada: false,
      prioridad: 'alta'
    },
    {
      id: '2',
      tipo: 'alerta',
      titulo: 'Conflicto de horario detectado',
      descripcion: 'Se detectó un conflicto en el Laboratorio 301 para el día miércoles entre las 08:00 y 10:00',
      fecha: '2025-10-22 09:15',
      leida: false,
      eliminada: false,
      prioridad: 'alta'
    },
    {
      id: '3',
      tipo: 'mensaje',
      titulo: 'Mensaje de María González',
      descripcion: 'Hola, necesito confirmar la disponibilidad del Auditorio Central para el evento del próximo mes',
      fecha: '2025-10-22 08:45',
      leida: false,
      eliminada: false,
      prioridad: 'media'
    },
    {
      id: '4',
      tipo: 'exito',
      titulo: 'Horario guardado exitosamente',
      descripcion: 'El horario del grupo 1A ha sido guardado correctamente en el sistema',
      fecha: '2025-10-21 18:00',
      leida: false,
      eliminada: false,
      prioridad: 'baja'
    },
    {
      id: '5',
      tipo: 'advertencia',
      titulo: 'Mantenimiento programado',
      descripcion: 'El Laboratorio 401 estará en mantenimiento del 25 al 27 de octubre',
      fecha: '2025-10-21 16:20',
      leida: true,
      eliminada: false,
      prioridad: 'media'
    },
    {
      id: '6',
      tipo: 'error',
      titulo: 'Error al procesar solicitud',
      descripcion: 'No se pudo procesar la solicitud de préstamo del Auditorio debido a un conflicto de horarios',
      fecha: '2025-10-21 14:00',
      leida: true,
      eliminada: false,
      prioridad: 'alta'
    },
    {
      id: '7',
      tipo: 'sistema',
      titulo: 'Actualización del sistema completada',
      descripcion: 'La actualización v2.3.1 se instaló correctamente. Revisa las nuevas funcionalidades en la sección de ayuda.',
      fecha: '2025-10-21 11:30',
      leida: true,
      eliminada: false,
      prioridad: 'baja'
    },
    {
      id: '8',
      tipo: 'exito',
      titulo: 'Reporte mensual generado',
      descripcion: 'El reporte de ocupación de octubre está disponible para descarga',
      fecha: '2025-10-21 09:00',
      leida: true,
      eliminada: false,
      prioridad: 'baja'
    }
  ]);

  const [filterTab, setFilterTab] = useState('todas');

  // Notificar cambios en el contador al componente padre
  useEffect(() => {
    const noLeidasCount = notificaciones.filter(n => !n.leida && !n.eliminada).length;
    if (onNotificacionesChange) {
      onNotificacionesChange(noLeidasCount);
    }
  }, [notificaciones, onNotificacionesChange]);

  const marcarComoLeida = (id: string) => {
    setNotificaciones(notificaciones.map(n => 
      n.id === id ? { ...n, leida: true } : n
    ));
    // Mostrar notificación: Notificación marcada como leída
  };

  const marcarTodasComoLeidas = () => {
    setNotificaciones(notificaciones.map(n => 
      n.eliminada ? n : { ...n, leida: true }
    ));
    // Mostrar notificación: Todas las notificaciones marcadas como leídas
  };

  const eliminarNotificacion = (id: string) => {
    setNotificaciones(notificaciones.map(n => 
      n.id === id ? { ...n, eliminada: true } : n
    ));
    // Mostrar notificación: Notificación eliminada
  };

  const restaurarNotificacion = (id: string) => {
    setNotificaciones(notificaciones.map(n => 
      n.id === id ? { ...n, eliminada: false } : n
    ));
    // Mostrar notificación: Notificación restaurada
  };

  const eliminarPermanentemente = (id: string) => {
    setNotificaciones(notificaciones.filter(n => n.id !== id));
    // Mostrar notificación: Notificación eliminada permanentemente
  };

  const filteredNotificaciones = notificaciones.filter(n => {
    if (filterTab === 'todas') return !n.eliminada;
    if (filterTab === 'pendientes') return !n.leida && !n.eliminada;
    if (filterTab === 'leidas') return n.leida && !n.eliminada;
    if (filterTab === 'eliminadas') return n.eliminada;
    return n.tipo === filterTab && !n.eliminada;
  });

  const getIcono = (tipo: string) => {
    switch (tipo) {
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
      default:
        return <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'solicitud':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      case 'mensaje':
        return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800';
      case 'alerta':
        return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
      case 'sistema':
        return 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700';
      case 'exito':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'advertencia':
        return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700';
    }
  };

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return <Badge className="bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">Alta</Badge>;
      case 'media':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800">Media</Badge>;
      case 'baja':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">Baja</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    total: notificaciones.filter(n => !n.eliminada).length,
    pendientes: notificaciones.filter(n => !n.leida && !n.eliminada).length,
    leidas: notificaciones.filter(n => n.leida && !n.eliminada).length,
    eliminadas: notificaciones.filter(n => n.eliminada).length
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Centro de Notificaciones</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestiona tus notificaciones, solicitudes y alertas del sistema</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={marcarTodasComoLeidas}
            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
            disabled={stats.pendientes === 0}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Marcar todas como leídas
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">Total</p>
                <p className="text-slate-900 dark:text-slate-100">{stats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 dark:text-red-400 mb-1">Pendientes</p>
                <p className="text-red-900 dark:text-red-100">{stats.pendientes}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 mb-1">Leídas</p>
                <p className="text-green-900 dark:text-green-100">{stats.leidas}</p>
              </div>
              <CheckCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">Eliminadas</p>
                <p className="text-slate-900 dark:text-slate-100">{stats.eliminadas}</p>
              </div>
              <Trash2 className="w-8 h-8 text-slate-600 dark:text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={filterTab} onValueChange={setFilterTab} className="w-full">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="todas">
            Todas
            {stats.total > 0 && (
              <Badge className="ml-2 bg-blue-600 text-white">{stats.total}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pendientes">
            Pendientes
            {stats.pendientes > 0 && (
              <Badge className="ml-2 bg-red-600 text-white">{stats.pendientes}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leidas">Leídas</TabsTrigger>
          <TabsTrigger value="solicitud">Solicitudes</TabsTrigger>
          <TabsTrigger value="alerta">Alertas</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
          <TabsTrigger value="eliminadas">Eliminadas</TabsTrigger>
        </TabsList>

        <TabsContent value={filterTab} className="mt-6 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredNotificaciones.length === 0 ? (
              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardContent className="p-12 text-center">
                  <Bell className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No hay notificaciones en esta categoría
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotificaciones.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className={`border ${getTipoColor(notif.tipo)} ${
                      !notif.leida && !notif.eliminada
                        ? 'shadow-lg' 
                        : 'opacity-70'
                    } hover:shadow-xl transition-shadow`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getIcono(notif.tipo)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-slate-900 dark:text-slate-100">
                                  {notif.titulo}
                                </h3>
                                {getPrioridadBadge(notif.prioridad)}
                                {!notif.leida && !notif.eliminada && (
                                  <Badge className="bg-blue-600 text-white">Nueva</Badge>
                                )}
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 mb-2">
                                {notif.descripcion}
                              </p>
                              <p className="text-slate-500 dark:text-slate-500 text-sm">
                                {notif.fecha}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!notif.eliminada ? (
                            <>
                              {!notif.leida && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => marcarComoLeida(notif.id)}
                                  className="text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                  title="Marcar como leída"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => eliminarNotificacion(notif.id)}
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => restaurarNotificacion(notif.id)}
                                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                title="Restaurar"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => eliminarPermanentemente(notif.id)}
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                title="Eliminar permanentemente"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
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
      <Toaster />
    </div>
  );
}
