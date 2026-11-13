import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Calendar, Clock, MapPin, User, Mail, Phone, FileText, Users, Package, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Loading } from '../../../../components/common/Loading';
import { SolicitudDialog } from './SolicitudDialog';
import type { usePrestamosEspaciosPagina } from '../../hooks/usePrestamosEspaciosPagina';

type Gestion = ReturnType<typeof usePrestamosEspaciosPagina>;

/** Solicitudes de préstamo en vista de lista. */
export function ListaPrestamos({ user, puedeGestionarPrestamos, periodoEdicion, vista, verSolicitudDialog, setVerSolicitudDialog, comentariosAccion, setComentariosAccion, modoEdicion, prestamoEditando, setPrestamoEditando, espaciosDisponibles, tiposActividad, recursosDisponibles, paginatedPrestamos, totalFilteredPrestamos, aprobarSolicitud, rechazarSolicitud, iniciarEdicion, cancelarEdicion, guardarEdicion, eliminarSolicitud, loading, frecuenciaAMaxIntervalo, frecuenciaCabeEnPeriodo, frecuenciaAMaxOcurrencias, DIAS_LABELS, recurrenceSummary, getEstadoBadge, getEstadoIcon }: Pick<Gestion, 'user' | 'puedeGestionarPrestamos' | 'periodoEdicion' | 'vista' | 'verSolicitudDialog' | 'setVerSolicitudDialog' | 'comentariosAccion' | 'setComentariosAccion' | 'modoEdicion' | 'prestamoEditando' | 'setPrestamoEditando' | 'espaciosDisponibles' | 'tiposActividad' | 'recursosDisponibles' | 'paginatedPrestamos' | 'totalFilteredPrestamos' | 'aprobarSolicitud' | 'rechazarSolicitud' | 'iniciarEdicion' | 'cancelarEdicion' | 'guardarEdicion' | 'eliminarSolicitud' | 'loading' | 'frecuenciaAMaxIntervalo' | 'frecuenciaCabeEnPeriodo' | 'frecuenciaAMaxOcurrencias' | 'DIAS_LABELS' | 'recurrenceSummary' | 'getEstadoBadge' | 'getEstadoIcon'>) {
  return (
    <>
      {vista === 'lista' && (
      <div className="grid grid-cols-1 gap-4">
        {loading && totalFilteredPrestamos === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent>
              <Loading message="Cargando solicitudes de préstamo..." />
            </CardContent>
          </Card>
        ) : totalFilteredPrestamos === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No hay solicitudes que mostrar</p>
            </CardContent>
          </Card>
        ) : (
          paginatedPrestamos.map((prestamo) => (
            <motion.div
              key={prestamo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {(() => {
                    const solicitanteEsAdmin = Boolean(
                      user?.correo &&
                      prestamo.email &&
                      prestamo.email.toLowerCase() === user.correo.toLowerCase()
                    );
                    // La edición ya no está restringida por estado (incluye 'aprobado'):
                    // el backend decide si el préstamo permanece Aprobado o vuelve a Pendiente
                    // según si quien edita tiene permiso EDITAR en "Disponibilidad de Espacios".
                    const puedeEditarEliminar = puedeGestionarPrestamos || solicitanteEsAdmin;

                    return (
                  <div className="flex items-start justify-between gap-6">
                    {/* Left Section */}
                    <div className="flex-1 space-y-4">
                      {/* Header con Solicitante y Estado */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-slate-900 dark:text-slate-100">{prestamo.solicitante}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Mail className="w-3 h-3" />
                              {prestamo.email}
                            </div>
                            {prestamo.telefono && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Phone className="w-3 h-3" />
                                {prestamo.telefono}
                              </div>
                            )}
                          </div>
                        </div>
                        {getEstadoBadge(prestamo.estado)}
                      </div>

                      {/* Detalles del Evento */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Espacio</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.espacio}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Fecha</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.fecha}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Horario</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.horaInicio} - {prestamo.horaFin}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Asistentes</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.asistentes}</p>
                          </div>
                        </div>
                      </div>

                      {/* Tipo de Evento y Recursos */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {prestamo.tipoEvento}
                        </Badge>
                        {prestamo.recursosNecesarios.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {prestamo.recursosNecesarios.map((recurso, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs"
                                >
                                  {recurso}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Motivo */}
                      <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Motivo</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.motivo}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Ver Solicitud Button */}
                    <div className="flex flex-col items-end gap-2">
                      <SolicitudDialog prestamo={prestamo} aprobarSolicitud={aprobarSolicitud} cancelarEdicion={cancelarEdicion} comentariosAccion={comentariosAccion} eliminarSolicitud={eliminarSolicitud} espaciosDisponibles={espaciosDisponibles} guardarEdicion={guardarEdicion} iniciarEdicion={iniciarEdicion} modoEdicion={modoEdicion} prestamoEditando={prestamoEditando} rechazarSolicitud={rechazarSolicitud} recursosDisponibles={recursosDisponibles} setComentariosAccion={setComentariosAccion} setPrestamoEditando={setPrestamoEditando} setVerSolicitudDialog={setVerSolicitudDialog} tiposActividad={tiposActividad} verSolicitudDialog={verSolicitudDialog} DIAS_LABELS={DIAS_LABELS} frecuenciaAMaxIntervalo={frecuenciaAMaxIntervalo} frecuenciaCabeEnPeriodo={frecuenciaCabeEnPeriodo} frecuenciaAMaxOcurrencias={frecuenciaAMaxOcurrencias} recurrenceSummary={recurrenceSummary} getEstadoBadge={getEstadoBadge} getEstadoIcon={getEstadoIcon} periodoEdicion={periodoEdicion} puedeEditarEliminar={puedeEditarEliminar} puedeGestionarPrestamos={puedeGestionarPrestamos} />

                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {prestamo.fechaSolicitud}
                      </span>
                    </div>
                  </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
      )}
    </>
  );
}
