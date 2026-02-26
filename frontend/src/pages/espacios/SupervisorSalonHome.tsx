import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { Badge } from '../../share/badge';
import { DoorOpen, DoorClosed, Building2, Clock, MapPin, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import { useAperturaCierre } from '../../hooks/espacios/useAperturaCierre';
import { useIsMobile } from '../../hooks/useIsMobile';
import CountdownTimer from '../../components/espacios/CountdownTimer';
import { espaciosAPI } from '../../services/espacios/espaciosAPI';

export default function SupervisorSalonHome() {
  const isMobile = useIsMobile();
  const {
    espacios,
    horaActual,
    diaActual,
    fechaActual,
    loading,
    error,
    refrescar
  } = useAperturaCierre();

  // Estado para manejar botones de carga individual
  const [loadingAcciones, setLoadingAcciones] = useState<Record<number, boolean>>({});

  // Función para abrir un salón
  const handleAbrirSalon = async (espacioId: number, nombreEspacio: string) => {
    setLoadingAcciones(prev => ({ ...prev, [espacioId]: true }));
    
    try {
      await espaciosAPI.cambiarEstado(espacioId, 'Disponible');
      toast.success(`✅ ${nombreEspacio} abierto correctamente`);
      // Refrescar datos después de la acción
      await refrescar();
    } catch (err: any) {
      console.error('Error abriendo salón:', err);
      toast.error(`❌ Error al abrir ${nombreEspacio}: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoadingAcciones(prev => ({ ...prev, [espacioId]: false }));
    }
  };

  // Función para cerrar un salón
  const handleCerrarSalon = async (espacioId: number, nombreEspacio: string) => {
    setLoadingAcciones(prev => ({ ...prev, [espacioId]: true }));
    
    try {
      await espaciosAPI.cambiarEstado(espacioId, 'No Disponible');
      toast.success(`✅ ${nombreEspacio} cerrado correctamente`);
      // Refrescar datos después de la acción
      await refrescar();
    } catch (err: any) {
      console.error('Error cerrando salón:', err);
      toast.error(`❌ Error al cerrar ${nombreEspacio}: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoadingAcciones(prev => ({ ...prev, [espacioId]: false }));
    }
  };

  // Calcular estadísticas (contar horarios totales, no espacios)
  const totalSalones = espacios?.reduce((count, esp) => 
    count + (esp.horarios?.length || 0), 0) || 0;
  const salonesPorAbrir = espacios?.reduce((count, esp) => 
    count + (esp.horarios?.filter(h => h.proximaAccion === 'apertura').length || 0), 0) || 0;
  const salonesPorCerrar = espacios?.reduce((count, esp) => 
    count + (esp.horarios?.filter(h => h.proximaAccion === 'cierre').length || 0), 0) || 0;

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
                Sistema en tiempo real - Todos los salones ordenados por urgencia con temporizadores
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Total Pendientes</p>
                  <p className="text-slate-900 dark:text-slate-100 text-3xl font-bold">{totalSalones}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">En tiempo real</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-orange-200 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <DoorOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Por Abrir</p>
                  <p className="text-slate-900 dark:text-slate-100 text-3xl font-bold">{salonesPorAbrir}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Aperturas pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <DoorClosed className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Por Cerrar</p>
                  <p className="text-slate-900 dark:text-slate-100 text-3xl font-bold">{salonesPorCerrar}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cierres pendientes</p>
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

      {/* Lista de Horarios Pendientes - Una tarjeta por horario */}
      {espacios && espacios.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Horarios Pendientes - Ordenados por Urgencia
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Cada tarjeta muestra un horario. Solo el botón de la acción pendiente está habilitado. Actualización automática cada 30 segundos.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence>
                {espacios.flatMap((espacio) => 
                  espacio.horarios?.map((horario, horarioIndex) => {
                    const isLoading = loadingAcciones[espacio.idEspacio] || false;
                    const isApertura = horario.proximaAccion === 'apertura';
                    
                    return (
                      <motion.div
                        key={`${espacio.idEspacio}-${horarioIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: horarioIndex * 0.05 }}
                      >
                        <Card className={`border-2 ${
                          isApertura 
                            ? 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20' 
                            : 'border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20'
                        } hover:shadow-lg transition-all`}>
                          <CardContent className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                                  {espacio.nombreEspacio}
                                </h3>
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <Badge className={
                                    isApertura 
                                      ? 'bg-orange-600 text-white' 
                                      : 'bg-purple-600 text-white'
                                  }>
                                    {isApertura ? <DoorOpen className="w-3 h-3 mr-1" /> : <DoorClosed className="w-3 h-3 mr-1" />}
                                    {isApertura ? 'Por Abrir' : 'Por Cerrar'}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {horario.tipoUso}
                                  </Badge>
                                </div>
                                <Badge 
                                  variant="outline"
                                  className={espacio.estadoActual === 'Disponible' 
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-red-50 text-red-700 border-red-200'}
                                >
                                  {espacio.estadoActual}
                                </Badge>
                              </div>
                            </div>

                            {/* Temporizador */}
                            <div className="mb-4">
                              <CountdownTimer
                                minutosRestantes={horario.minutosRestantes}
                                segundosRestantes={horario.segundosRestantes}
                                tipo={horario.proximaAccion}
                              />
                            </div>

                            {/* Información */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <Building2 className={`w-4 h-4 ${isApertura ? 'text-orange-600' : 'text-purple-600'}`} />
                                <span>{espacio.sede}</span>
                                <span className="text-slate-400">•</span>
                                <MapPin className={`w-4 h-4 ${isApertura ? 'text-orange-600' : 'text-purple-600'}`} />
                                <span>{espacio.piso}</span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <Clock className={`w-4 h-4 ${isApertura ? 'text-orange-600' : 'text-purple-600'}`} />
                                <span className="font-semibold">{horario.horaInicio} - {horario.horaFin}</span>
                              </div>

                              {/* Info específica por tipo */}
                              {horario.tipoUso === 'Clase' ? (
                                <div className={`bg-white dark:bg-slate-900 rounded-lg p-3 border ${
                                  isApertura 
                                    ? 'border-orange-200 dark:border-orange-800' 
                                    : 'border-purple-200 dark:border-purple-800'
                                }`}>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Asignatura</p>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{horario.asignatura}</p>
                                  {horario.docente && (
                                    <>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-1">Docente</p>
                                      <p className="text-sm text-slate-700 dark:text-slate-300">{horario.docente}</p>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className={`bg-white dark:bg-slate-900 rounded-lg p-3 border ${
                                  isApertura 
                                    ? 'border-orange-200 dark:border-orange-800' 
                                    : 'border-purple-200 dark:border-purple-800'
                                }`}>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Actividad</p>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{horario.tipoActividad}</p>
                                  {horario.solicitante && (
                                    <>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-1">Solicitante</p>
                                      <p className="text-sm text-slate-700 dark:text-slate-300">{horario.solicitante}</p>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Botones de Acción - Ambos visibles, solo uno habilitado */}
                            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                              <Button 
                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:from-orange-500 disabled:hover:to-orange-600"
                                onClick={() => handleAbrirSalon(espacio.idEspacio, espacio.nombreEspacio)}
                                disabled={!isApertura || isLoading}
                                title={!isApertura ? 'Este horario requiere cierre' : 'Abrir salón'}
                              >
                                {isLoading && isApertura ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <DoorOpen className="w-4 h-4 mr-2" />
                                    Abrir
                                  </>
                                )}
                              </Button>
                              
                              <Button 
                                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:from-purple-500 disabled:hover:to-purple-600"
                                onClick={() => handleCerrarSalon(espacio.idEspacio, espacio.nombreEspacio)}
                                disabled={isApertura || isLoading}
                                title={isApertura ? 'Este horario requiere apertura' : 'Cerrar salón'}
                              >
                                {isLoading && !isApertura ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <DoorClosed className="w-4 h-4 mr-2" />
                                    Cerrar
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  }) || []
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado Vacío */}
      {!loading && !error && (!espacios || espacios.length === 0) && (
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
                El sistema se actualiza automáticamente cada 30 segundos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (!espacios || espacios.length === 0) && (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-12">
            <div className="text-center">
              <RefreshCw className="w-20 h-20 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Cargando datos...
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Consultando todos los salones pendientes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Toaster />
    </div>
  );
}