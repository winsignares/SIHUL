import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../share/dialog';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { NotificationBanner } from '../../share/notificationBanner';
import { useSolicitudesEspacio } from '../../hooks/gestionAcademica/useSolicitudesEspacio';
import { type SolicitudEspacio } from '../../services/horarios/solicitudEspacioAPI';

export default function SolicitudesEspacio() {
  const {
    loading,
    solicitudesFiltradas,
    filtroEstado,
    setFiltroEstado,
    handleAprobarSolicitud,
    handleRechazarSolicitud,
    notification
  } = useSolicitudesEspacio();

  const [showModalAccion, setShowModalAccion] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudEspacio | null>(null);
  const [tipoAccion, setTipoAccion] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [comentario, setComentario] = useState('');

  const handleAbrirModalAccion = (solicitud: SolicitudEspacio, tipo: 'aprobar' | 'rechazar') => {
    setSolicitudSeleccionada(solicitud);
    setTipoAccion(tipo);
    setComentario('');
    setShowModalAccion(true);
  };

  const handleConfirmarAccion = async () => {
    if (!solicitudSeleccionada) return;

    // Validar que el motivo sea requerido para rechazo
    if (tipoAccion === 'rechazar' && !comentario.trim()) {
      alert('⚠️ Debes proporcionar un motivo para rechazar la solicitud');
      return;
    }

    if (tipoAccion === 'aprobar') {
      await handleAprobarSolicitud(solicitudSeleccionada.id, comentario);
    } else {
      await handleRechazarSolicitud(solicitudSeleccionada.id, comentario);
    }

    setShowModalAccion(false);
    setSolicitudSeleccionada(null);
    setComentario('');
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'aprobada':
        return <Badge className="bg-green-100 text-green-800">Aprobada</Badge>;
      case 'rechazada':
        return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <NotificationBanner notification={notification} />

      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-slate-900">Solicitudes de Espacio</h2>
        <p className="text-slate-600 mt-1">Gestiona las solicitudes de espacios realizadas por planificadores</p>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-orange-600" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filtro-estado">Estado</Label>
                <Select value={filtroEstado} onValueChange={(value: any) => setFiltroEstado(value)}>
                  <SelectTrigger id="filtro-estado">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="aprobada">Aprobada</SelectItem>
                    <SelectItem value="rechazada">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Solicitudes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Solicitudes ({solicitudesFiltradas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-slate-600">Cargando solicitudes...</p>
              </div>
            ) : solicitudesFiltradas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600">No hay solicitudes para mostrar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Asignatura</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Grupo</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Docente</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Espacio Solicitado</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Día/Hora</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Planificador</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Estado</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {solicitudesFiltradas.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-900 font-medium">{solicitud.asignatura_nombre}</td>
                        <td className="px-4 py-3 text-slate-700">{solicitud.grupo_nombre}</td>
                        <td className="px-4 py-3 text-slate-700">{solicitud.docente_nombre || 'Sin asignar'}</td>
                        <td className="px-4 py-3 text-slate-700">{solicitud.espacio_solicitado_nombre}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="text-sm">
                            <div className="font-medium capitalize">{solicitud.dia_semana}</div>
                            <div className="text-slate-600">{solicitud.hora_inicio} - {solicitud.hora_fin}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{solicitud.planificador_nombre || 'N/A'}</td>
                        <td className="px-4 py-3">
                          {getEstadoBadge(solicitud.estado)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            {solicitud.estado === 'pendiente' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleAbrirModalAccion(solicitud, 'aprobar')}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Aprobar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => handleAbrirModalAccion(solicitud, 'rechazar')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rechazar
                                </Button>
                              </>
                            )}
                            {solicitud.estado === 'aprobada' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-600 text-red-600 hover:bg-red-50"
                                onClick={() => handleAbrirModalAccion(solicitud, 'rechazar')}
                              >
                                Cambiar a Rechazar
                              </Button>
                            )}
                            {solicitud.estado === 'rechazada' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleAbrirModalAccion(solicitud, 'aprobar')}
                              >
                                Cambiar a Aprobar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de Acción */}
      <Dialog open={showModalAccion} onOpenChange={setShowModalAccion}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tipoAccion === 'aprobar' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Aprobar Solicitud
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  Rechazar Solicitud
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {solicitudSeleccionada && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div>
                  <span className="text-sm font-medium text-slate-600">Asignatura:</span>
                  <p className="text-slate-900">{solicitudSeleccionada.asignatura_nombre}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Grupo:</span>
                  <p className="text-slate-900">{solicitudSeleccionada.grupo_nombre}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Espacio Solicitado:</span>
                  <p className="text-slate-900">{solicitudSeleccionada.espacio_solicitado_nombre}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Horario:</span>
                  <p className="text-slate-900">
                    {solicitudSeleccionada.dia_semana} {solicitudSeleccionada.hora_inicio} - {solicitudSeleccionada.hora_fin}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="comentario" className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  {tipoAccion === 'rechazar' ? (
                    <>
                      <span>Motivo del Rechazo</span>
                      <span className="text-red-600 font-bold">*</span>
                    </>
                  ) : (
                    <span>Comentario (opcional)</span>
                  )}
                </Label>
                <textarea
                  id="comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder={tipoAccion === 'rechazar' 
                    ? "Explica por qué se rechaza esta solicitud..." 
                    : "Agregar un comentario..."}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none transition-all ${
                    tipoAccion === 'rechazar'
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-green-50/30'
                  }`}
                  rows={4}
                />
                {tipoAccion === 'rechazar' && (
                  <p className="text-xs text-slate-500 mt-2">
                    💡 El motivo será visible para el planificador en su notificación
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModalAccion(false)}
            >
              Cancelar
            </Button>
            <Button
              className={tipoAccion === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              onClick={handleConfirmarAccion}
            >
              {tipoAccion === 'aprobar' ? 'Aprobar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
