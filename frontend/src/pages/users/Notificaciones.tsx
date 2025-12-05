import React from 'react';
import { Card, CardContent } from '../../share/card';
import { Badge } from '../../share/badge';
import { Button } from '../../share/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../share/dialog';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../share/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Bell, Check, CheckCheck, AlertCircle, MessageSquare, Calendar, Settings, X, AlertTriangle, CheckCircle, Edit, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from '../../share/sonner';
import { toast } from 'sonner';
import { useNotificaciones } from '../../hooks/users/useNotificaciones';
import { useAuth } from '../../context/AuthContext';
import { solicitudEspacioService } from '../../services/horarios/solicitudEspacioAPI';

interface NotificacionesProps {
  onNotificacionesChange?: (count: number) => void;
}

export default function Notificaciones({ onNotificacionesChange }: NotificacionesProps) {
  const { user } = useAuth();
  const [procesando, setProcesando] = React.useState(false);
  const [showModalRechazo, setShowModalRechazo] = React.useState(false);
  const [motivoRechazo, setMotivoRechazo] = React.useState('');
  const [notificacionSeleccionada, setNotificacionSeleccionada] = React.useState<any>(null);
  const {
    filterTab,
    setFilterTab,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    filteredNotificaciones,
    stats,
    isLoading,
    paginaActual,
    totalPaginas,
    totalNotificaciones,
    cambiarPagina,
    busqueda,
    setBusqueda,
    filtroTiempo,
    setFiltroTiempo,
    filtroPrioridad,
    setFiltroPrioridad,
  } = useNotificaciones(onNotificacionesChange);

  const handleAprobarSolicitud = async (notificacion: any) => {
    if (!user?.id) return;
    try {
      setProcesando(true);
      // Extraer ID de solicitud del mensaje (formato: "ID: {numero}")
      console.log('Notificación:', notificacion);
      console.log('Descripción:', notificacion.descripcion);
      
      // Intentar extraer ID de varias formas
      let solicitudId = 0;
      
      // Intento 1: Buscar "ID: numero"
      let match = notificacion.descripcion.match(/ID:\s*(\d+)/);
      if (match) {
        solicitudId = parseInt(match[1]);
      } else {
        // Intento 2: Buscar solo números al inicio
        match = notificacion.descripcion.match(/\((\d+)\)/);
        if (match) {
          solicitudId = parseInt(match[1]);
        } else {
          // Intento 3: Buscar cualquier número
          match = notificacion.descripcion.match(/\d+/);
          if (match) {
            solicitudId = parseInt(match[0]);
          }
        }
      }
      
      console.log('Solicitud ID extraído:', solicitudId);
      
      if (!solicitudId) {
        toast.error('No se pudo identificar la solicitud. Mensaje: ' + notificacion.descripcion);
        return;
      }
      
      await solicitudEspacioService.aprobar({
        solicitud_id: solicitudId,
        admin_id: user.id,
        comentario: 'Aprobado desde notificaciones'
      });
      
      // Marcar como leída para que se mueva a "Espacios"
      await marcarComoLeida(notificacion.id);
      await recargar();
      toast.success('✅ Solicitud aprobada correctamente');
    } catch (error: any) {
      console.error('Error completo:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Error desconocido';
      toast.error(`Error al aprobar: ${errorMsg}`);
    } finally {
      setProcesando(false);
    }
  };

  const handleModificarSolicitud = async (notificacion: any) => {
    if (!user?.id) return;
    try {
      setProcesando(true);
      // Extraer ID de solicitud del mensaje (formato: "ID: {numero}")
      console.log('Notificación:', notificacion);
      console.log('Descripción:', notificacion.descripcion);
      
      // Intentar extraer ID de varias formas
      let solicitudId = 0;
      
      // Intento 1: Buscar "ID: numero"
      let match = notificacion.descripcion.match(/ID:\s*(\d+)/);
      if (match) {
        solicitudId = parseInt(match[1]);
      } else {
        // Intento 2: Buscar solo números al inicio
        match = notificacion.descripcion.match(/\((\d+)\)/);
        if (match) {
          solicitudId = parseInt(match[1]);
        } else {
          // Intento 3: Buscar cualquier número
          match = notificacion.descripcion.match(/\d+/);
          if (match) {
            solicitudId = parseInt(match[0]);
          }
        }
      }
      
      console.log('Solicitud ID extraído:', solicitudId);
      
      if (!solicitudId) {
        toast.error('No se pudo identificar la solicitud. Mensaje: ' + notificacion.descripcion);
        return;
      }
      
      // Navegar a la página de solicitudes para editar
      window.location.href = `/admin/solicitudes-espacio?edit=${solicitudId}`;
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Error al intentar modificar la solicitud');
    } finally {
      setProcesando(false);
    }
  };

  const handleAbrirModalRechazo = (notificacion: any) => {
    setNotificacionSeleccionada(notificacion);
    setMotivoRechazo('');
    setShowModalRechazo(true);
  };

  const handleConfirmarRechazo = async () => {
    if (!user?.id || !notificacionSeleccionada) return;
    
    // Validar que el motivo no esté vacío
    if (!motivoRechazo.trim()) {
      toast.error('⚠️ Debes proporcionar un motivo para rechazar la solicitud');
      return;
    }

    try {
      setProcesando(true);
      const notificacion = notificacionSeleccionada;
      
      // Extraer ID de solicitud del mensaje
      console.log('Notificación:', notificacion);
      console.log('Descripción:', notificacion.descripcion);
      
      // Intentar extraer ID de varias formas
      let solicitudId = 0;
      
      // Intento 1: Buscar "ID: numero"
      let match = notificacion.descripcion.match(/ID:\s*(\d+)/);
      if (match) {
        solicitudId = parseInt(match[1]);
      } else {
        // Intento 2: Buscar solo números al inicio
        match = notificacion.descripcion.match(/\((\d+)\)/);
        if (match) {
          solicitudId = parseInt(match[1]);
        } else {
          // Intento 3: Buscar cualquier número
          match = notificacion.descripcion.match(/\d+/);
          if (match) {
            solicitudId = parseInt(match[0]);
          }
        }
      }
      
      console.log('Solicitud ID extraído:', solicitudId);
      
      if (!solicitudId) {
        toast.error('No se pudo identificar la solicitud. Mensaje: ' + notificacion.descripcion);
        return;
      }
      
      await solicitudEspacioService.rechazar({
        solicitud_id: solicitudId,
        admin_id: user.id,
        comentario: motivoRechazo
      });
      
      // Marcar como leída para que se mueva a "Espacios"
      await marcarComoLeida(notificacion.id);
      await recargar();
      toast.success('✅ Solicitud rechazada correctamente');
      
      // Cerrar modal
      setShowModalRechazo(false);
      setMotivoRechazo('');
      setNotificacionSeleccionada(null);
    } catch (error: any) {
      console.error('Error completo:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Error desconocido';
      toast.error(`Error al rechazar: ${errorMsg}`);
    } finally {
      setProcesando(false);
    }
  };

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
      case 'solicitud_espacio':
        return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'solicitud_aprobada':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'solicitud_rechazada':
        return <X className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'grupo':
        return <Bell className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      case 'cambio_nombre':
        return <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'cambio_contrasena':
        return <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'licencia':
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'periodo_academico':
        return <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'profesor_sin_asignar':
        return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'grupo_sin_espacio':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
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
      case 'horario':
        return 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800';
      case 'prestamo':
        return 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800';
      case 'espacio':
        return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
      case 'facultad':
        return 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800';
      case 'solicitud_espacio':
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      case 'solicitud_aprobada':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
      case 'solicitud_rechazada':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'grupo':
        return 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800';
      case 'cambio_nombre':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      case 'cambio_contrasena':
        return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800';
      case 'licencia':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'periodo_academico':
        return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
      case 'profesor_sin_asignar':
        return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
      case 'grupo_sin_espacio':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Tabs */}
      <Tabs value={filterTab} onValueChange={setFilterTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="pendientes">
            Pendientes
            {stats.pendientes > 0 && (
              <Badge className="ml-2 bg-red-600 text-white">{stats.pendientes}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leidas">Leídas</TabsTrigger>
        </TabsList>

        {/* Filtros */}
        <div className="mt-6 space-y-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar notificaciones por título o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 dark:border-slate-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            />
            {busqueda && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBusqueda('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filtros con Selects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro de Tiempo */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Período de Tiempo
              </Label>
              <Select value={filtroTiempo} onValueChange={(value) => setFiltroTiempo(value as any)}>
                <SelectTrigger className="w-full border border-slate-300 dark:border-slate-600">
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Hoy (últimas 24h)</SelectItem>
                  <SelectItem value="semana">Esta Semana (7 días)</SelectItem>
                  <SelectItem value="mes">Este Mes (30 días)</SelectItem>
                  <SelectItem value="todo">Todo el Tiempo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Prioridad */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Prioridad
              </Label>
              <Select value={filtroPrioridad} onValueChange={(value) => setFiltroPrioridad(value as any)}>
                <SelectTrigger className="w-full border border-slate-300 dark:border-slate-600">
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las Prioridades</SelectItem>
                  <SelectItem value="alta">Alta - Urgente</SelectItem>
                  <SelectItem value="media">Media - Importante</SelectItem>
                  <SelectItem value="baja">Baja - Informativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

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

      {/* Controles de Paginación */}
      {totalPaginas > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando página <span className="font-bold text-blue-600 dark:text-blue-400">{paginaActual}</span> de <span className="font-bold text-blue-600 dark:text-blue-400">{totalPaginas}</span>
            {' '}({totalNotificaciones} notificación{totalNotificaciones !== 1 ? 'es' : ''} en total)
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1 || isLoading}
              className="border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let pageNum;
                if (totalPaginas <= 5) {
                  pageNum = i + 1;
                } else if (paginaActual <= 3) {
                  pageNum = i + 1;
                } else if (paginaActual >= totalPaginas - 2) {
                  pageNum = totalPaginas - 4 + i;
                } else {
                  pageNum = paginaActual - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={paginaActual === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => cambiarPagina(pageNum)}
                    disabled={isLoading}
                    className={`w-8 h-8 p-0 ${
                      paginaActual === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas || isLoading}
              className="border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Rechazo */}
      <Dialog open={showModalRechazo} onOpenChange={setShowModalRechazo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Rechazar Solicitud
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ Por favor, proporciona un motivo para rechazar esta solicitud de espacio.
              </p>
            </div>

            <div>
              <Label htmlFor="motivo-rechazo" className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4" />
                <span>Motivo del Rechazo</span>
                <span className="text-red-600 font-bold">*</span>
              </Label>
              <textarea
                id="motivo-rechazo"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Explica por qué se rechaza esta solicitud..."
                className="w-full px-4 py-3 border-2 border-red-300 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/30 transition-all"
                rows={4}
              />
              <p className="text-xs text-slate-500 mt-2">
                💡 El motivo será visible para el planificador en su notificación
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowModalRechazo(false);
                setMotivoRechazo('');
                setNotificacionSeleccionada(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmarRechazo}
              disabled={procesando || !motivoRechazo.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
