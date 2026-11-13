import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { TabsContent } from '../../../../components/ui/tabs';
import { Bell, Check, X, CheckCircle, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getIcono, getPrioridadBadge, getTipoColor } from './notificacionesUtils';
import type { useNotificacionesPagina } from '../../hooks/useNotificacionesPagina';

type Gestion = ReturnType<typeof useNotificacionesPagina>;

/** Notificaciones de la pestaña activa, con las acciones de cada una. */
export function ListaNotificaciones({
  filterTab, filteredNotificaciones, procesando, isLoading, navigate, marcarComoLeida,
  handleAprobarSolicitud, handleAbrirModalRechazo, handleModificarSolicitud, getFacturaRoute,
}: Pick<Gestion, 'filterTab' | 'filteredNotificaciones' | 'procesando' | 'isLoading' | 'navigate' | 'marcarComoLeida' | 'handleAprobarSolicitud' | 'handleAbrirModalRechazo' | 'handleModificarSolicitud' | 'getFacturaRoute'>) {
  return (
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
                      {/* Botones para solicitudes de espacio */}
                      {notif.tipo === 'solicitud_espacio' && (
                        <>
                          {!notif.leida && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAprobarSolicitud(notif)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                title="Aprobar solicitud"
                                disabled={procesando || isLoading}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAbrirModalRechazo(notif)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                title="Rechazar solicitud"
                                disabled={procesando || isLoading}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {notif.leida && (
                            <Button
                              size="sm"
                              onClick={() => handleModificarSolicitud(notif)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              title="Modificar solicitud"
                              disabled={procesando || isLoading}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                      
                      {!notif.leida && notif.tipo !== 'solicitud_espacio' && (
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

                      {getFacturaRoute(notif) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const route = getFacturaRoute(notif);
                            if (route) {
                              navigate(route);
                            }
                          }}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          title="Abrir factura relacionada"
                        >
                          Ver factura
                        </Button>
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
  );
}
