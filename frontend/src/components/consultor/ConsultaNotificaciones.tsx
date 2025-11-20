import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Bell, Check, Trash2, MessageSquare, Calendar, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface Notificacion {
  id: string;
  tipo: 'mensaje' | 'info' | 'sistema';
  titulo: string;
  descripcion: string;
  fecha: string;
  leida: boolean;
}

export default function ConsultaNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([
    {
      id: '1',
      tipo: 'mensaje',
      titulo: 'Mensaje del Administrador',
      descripcion: 'El horario del próximo semestre ya está disponible para consulta',
      fecha: '2025-10-22 11:00',
      leida: false
    },
    {
      id: '2',
      tipo: 'info',
      titulo: 'Disponibilidad de espacios actualizada',
      descripcion: 'Se han habilitado nuevos espacios en el edificio C',
      fecha: '2025-10-22 09:30',
      leida: false
    },
    {
      id: '3',
      tipo: 'sistema',
      titulo: 'Actualización del sistema',
      descripcion: 'El sistema estará en mantenimiento este sábado de 2:00 AM a 4:00 AM',
      fecha: '2025-10-21 16:00',
      leida: true
    },
    {
      id: '4',
      tipo: 'mensaje',
      titulo: 'Respuesta a tu consulta',
      descripcion: 'Tu solicitud sobre el Laboratorio 301 ha sido procesada',
      fecha: '2025-10-21 14:20',
      leida: true
    }
  ]);

  const [filterTab, setFilterTab] = useState('todas');

  const marcarComoLeida = (id: string) => {
    setNotificaciones(notificaciones.map(n => 
      n.id === id ? { ...n, leida: true } : n
    ));
    toast.success('Notificación marcada como leída');
  };

  const eliminarNotificacion = (id: string) => {
    setNotificaciones(notificaciones.filter(n => n.id !== id));
    toast.success('Notificación eliminada');
  };

  const filteredNotificaciones = notificaciones.filter(n => {
    if (filterTab === 'todas') return true;
    if (filterTab === 'no-leidas') return !n.leida;
    return n.tipo === filterTab;
  });

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case 'mensaje':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-yellow-600" />;
      case 'sistema':
        return <Calendar className="w-5 h-5 text-slate-600" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const stats = {
    total: notificaciones.length,
    noLeidas: notificaciones.filter(n => !n.leida).length
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 dark:text-slate-100 mb-2">Notificaciones</h1>
        <p className="text-slate-600 dark:text-slate-400">Mantente informado sobre actualizaciones del sistema</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">Total</p>
                <p className="text-slate-900 dark:text-slate-100">{stats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 mb-1">No Leídas</p>
                <p className="text-blue-900 dark:text-blue-100">{stats.noLeidas}</p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white">{stats.noLeidas}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notificaciones */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Todas las Notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filterTab} onValueChange={setFilterTab}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="no-leidas">
                No Leídas
                {stats.noLeidas > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white">{stats.noLeidas}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="mensaje">Mensajes</TabsTrigger>
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="sistema">Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value={filterTab} className="space-y-3">
              {filteredNotificaciones.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">No hay notificaciones</p>
                </div>
              ) : (
                filteredNotificaciones.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 transition-colors ${
                      notif.leida 
                        ? 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700' 
                        : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        notif.leida ? 'bg-slate-200 dark:bg-slate-700' : 'bg-white dark:bg-slate-800'
                      }`}>
                        {getIcono(notif.tipo)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            {notif.titulo}
                            {!notif.leida && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-3">{notif.descripcion}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-slate-500 dark:text-slate-500">{notif.fecha}</p>
                          <div className="flex gap-2">
                            {!notif.leida && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => marcarComoLeida(notif.id)}
                                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Marcar como leída
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => eliminarNotificacion(notif.id)}
                              className="border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
