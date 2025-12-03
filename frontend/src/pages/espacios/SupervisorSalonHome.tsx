import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { Badge } from '../../share/badge';
import { DoorOpen, DoorClosed, Building2, Clock, MapPin, Users, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { useAperturaCierre } from '../../hooks/espacios/useAperturaCierre';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function SupervisorSalonHome() {
  const isMobile = useIsMobile();
  const {
    aperturasPendientes,
    cierresPendientes,
    horaActual,
    diaActual,
    fechaActual,
    loading,
    error,
    refrescar
  } = useAperturaCierre();

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-900 dark:via-blue-950/10 dark:to-slate-800 min-h-full`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <DoorOpen className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Gestión de Apertura y Cierre de Salones</h1>
              </div>
              <p className="text-blue-100">
                Sistema automático - Se actualizan los salones próximos a abrir (15 min antes) y cerrar (5 min antes)
              </p>
            </div>
            <Button
              onClick={refrescar}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {/* Info de hora actual */}
          <div className="mt-4 flex items-center gap-4 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Hora actual: {horaActual}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{diaActual}, {fechaActual}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-orange-200 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <DoorOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Próximos a Abrir</p>
                  <p className="text-slate-900 dark:text-slate-100 text-3xl font-bold">{aperturasPendientes.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">15 minutos antes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <DoorClosed className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Próximos a Cerrar</p>
                  <p className="text-slate-900 dark:text-slate-100 text-3xl font-bold">{cierresPendientes.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">5 minutos antes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Error al cargar datos</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salones Próximos a Abrir */}
      {aperturasPendientes.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-700 bg-white dark:bg-slate-800">
          <CardHeader className="border-b border-orange-200 dark:border-orange-700 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-800">
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-orange-600" />
              Salones Próximos a Abrir ({aperturasPendientes.length})
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Estos salones tienen actividades programadas que inician en 15 minutos
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence>
                {aperturasPendientes.map((salon, index) => (
                  <motion.div
                    key={salon.idEspacio}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-2 border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                              {salon.nombreEspacio}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-orange-600 text-white">
                                <DoorOpen className="w-3 h-3 mr-1" />
                                Por Abrir
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {salon.tipoUso}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Información */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Building2 className="w-4 h-4 text-orange-600" />
                            <span>{salon.sede}</span>
                            <span className="text-slate-400">•</span>
                            <MapPin className="w-4 h-4 text-orange-600" />
                            <span>{salon.piso}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span className="font-semibold">{salon.horaInicio} - {salon.horaFin}</span>
                          </div>

                          {/* Info específica por tipo */}
                          {salon.tipoUso === 'Clase' ? (
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Asignatura</p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{salon.asignatura}</p>
                              {salon.docente && (
                                <>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-1">Docente</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">{salon.docente}</p>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Actividad</p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{salon.tipoActividad}</p>
                              {salon.solicitante && (
                                <>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-1">Solicitante</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">{salon.solicitante}</p>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Acción */}
                        <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
                          <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                            <DoorOpen className="w-4 h-4 mr-2" />
                            Abrir Salón
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salones Próximos a Cerrar */}
      {cierresPendientes.length > 0 && (
        <Card className="border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-800">
          <CardHeader className="border-b border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-800">
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DoorClosed className="w-5 h-5 text-purple-600" />
              Salones Próximos a Cerrar ({cierresPendientes.length})
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Estos salones tienen actividades que finalizan en 5 minutos
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence>
                {cierresPendientes.map((salon, index) => (
                  <motion.div
                    key={salon.idEspacio}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-2 border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                              {salon.nombreEspacio}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-purple-600 text-white">
                                <DoorClosed className="w-3 h-3 mr-1" />
                                Por Cerrar
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {salon.tipoUso}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Información */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Building2 className="w-4 h-4 text-purple-600" />
                            <span>{salon.sede}</span>
                            <span className="text-slate-400">•</span>
                            <MapPin className="w-4 h-4 text-purple-600" />
                            <span>{salon.piso}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Clock className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold">{salon.horaInicio} - {salon.horaFin}</span>
                          </div>

                          {/* Info específica por tipo */}
                          {salon.tipoUso === 'Clase' ? (
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Asignatura</p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{salon.asignatura}</p>
                              {salon.docente && (
                                <>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-1">Docente</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">{salon.docente}</p>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Actividad</p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{salon.tipoActividad}</p>
                              {salon.solicitante && (
                                <>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-1">Solicitante</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">{salon.solicitante}</p>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Acción */}
                        <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                          <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                            <DoorClosed className="w-4 h-4 mr-2" />
                            Cerrar Salón
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado Vacío */}
      {!loading && !error && aperturasPendientes.length === 0 && cierresPendientes.length === 0 && (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-12">
            <div className="text-center">
              <Clock className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No hay salones pendientes
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                En este momento no hay salones próximos a abrir o cerrar.
                <br />
                El sistema se actualiza automáticamente cada minuto.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && aperturasPendientes.length === 0 && cierresPendientes.length === 0 && (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-12">
            <div className="text-center">
              <RefreshCw className="w-20 h-20 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Cargando datos...
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Consultando salones próximos a abrir y cerrar
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Toaster />
    </div>
  );
}