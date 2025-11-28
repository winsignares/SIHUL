import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { Label } from '../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Checkbox } from '../../share/checkbox';
import { Textarea } from '../../share/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../share/dialog';
import { DoorOpen, DoorClosed, Building2, Clock, MapPin, Users, CheckCircle, Layers, Search, LightbulbOff, Wind, Monitor, Armchair, Eraser, ClipboardCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { useSupervisorSalonHome } from '../../hooks/espacios/useSupervisorSalonHome';

export default function SupervisorSalonHome() {
  const {
    sedes,
    pisos,
    sedeSeleccionada,
    setSedeSeleccionada,
    pisoSeleccionado,
    setPisoSeleccionado,
    horaSeleccionada,
    setHoraSeleccionada,
    busquedaActiva,
    setBusquedaActiva,
    salonesFiltrados,
    estadosSalones,
    modalCierreAbierto,
    setModalCierreAbierto,
    salonParaCerrar,
    checklist,
    setChecklist,
    buscarSalones,
    abrirSalon,
    abrirModalCierre,
    cerrarSalon,
    estadisticas,
    getEstadoConfig
  } = useSupervisorSalonHome();

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-900 dark:via-blue-950/10 dark:to-slate-800 min-h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <DoorOpen className="w-8 h-8" />
            <h1 className="text-white">Gestión de Apertura y Cierre de Salones</h1>
          </div>
          <p className="text-blue-100">
            Control completo del ciclo de vida de los salones: apertura, seguimiento y cierre con verificación de condiciones
          </p>
        </div>
      </motion.div>

      {/* Estadísticas */}
      {busquedaActiva && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Total</p>
                    <p className="text-slate-900 dark:text-slate-100 text-xl">{estadisticas.totalSalones}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Con Clase</p>
                    <p className="text-slate-900 dark:text-slate-100 text-xl">{estadisticas.salonesConClase}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <DoorOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Abiertos</p>
                    <p className="text-slate-900 dark:text-slate-100 text-xl">{estadisticas.salonesAbiertos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Por Cerrar</p>
                    <p className="text-slate-900 dark:text-slate-100 text-xl">{estadisticas.salonesPorCerrar}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Cerrados</p>
                    <p className="text-slate-900 dark:text-slate-100 text-xl">{estadisticas.salonesCerrados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Filtros con Botón Buscar */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Filtros de Búsqueda
          </CardTitle>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Selecciona sede, piso y hora para buscar los salones a gestionar
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Sede */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Sede
              </Label>
              <Select value={sedeSeleccionada} onValueChange={(value) => {
                setSedeSeleccionada(value);
                setPisoSeleccionado('');
                setBusquedaActiva(false);
              }}>
                <SelectTrigger className="h-12 border-slate-300 dark:border-slate-600">
                  <SelectValue placeholder="Selecciona una sede" />
                </SelectTrigger>
                <SelectContent>
                  {sedes.map(sede => (
                    <SelectItem key={sede} value={sede}>{sede}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Piso */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Piso
              </Label>
              <Select
                value={pisoSeleccionado}
                onValueChange={(value) => {
                  setPisoSeleccionado(value);
                  setBusquedaActiva(false);
                }}
                disabled={!sedeSeleccionada}
              >
                <SelectTrigger className="h-12 border-slate-300 dark:border-slate-600">
                  <SelectValue placeholder={sedeSeleccionada ? "Selecciona un piso" : "Primero selecciona una sede"} />
                </SelectTrigger>
                <SelectContent>
                  {pisos.map(piso => (
                    <SelectItem key={piso} value={piso}>Piso {piso}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hora */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Hora Actual
              </Label>
              <Select
                value={horaSeleccionada}
                onValueChange={(value) => {
                  setHoraSeleccionada(value);
                  setBusquedaActiva(false);
                }}
              >
                <SelectTrigger className="h-12 border-slate-300 dark:border-slate-600">
                  <SelectValue placeholder="Selecciona una hora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:00">6:00 AM</SelectItem>
                  <SelectItem value="07:00">7:00 AM</SelectItem>
                  <SelectItem value="08:00">8:00 AM</SelectItem>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="13:00">1:00 PM</SelectItem>
                  <SelectItem value="14:00">2:00 PM</SelectItem>
                  <SelectItem value="15:00">3:00 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                  <SelectItem value="17:00">5:00 PM</SelectItem>
                  <SelectItem value="18:00">6:00 PM</SelectItem>
                  <SelectItem value="19:00">7:00 PM</SelectItem>
                  <SelectItem value="20:00">8:00 PM</SelectItem>
                  <SelectItem value="21:00">9:00 PM</SelectItem>
                  <SelectItem value="22:00">10:00 PM</SelectItem>
                  <SelectItem value="23:00">11:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón Buscar */}
            <div className="space-y-2">
              <Label className="text-transparent select-none">.</Label>
              <Button
                onClick={buscarSalones}
                disabled={!sedeSeleccionada || !pisoSeleccionado}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-5 h-5 mr-2" />
                Buscar Salones
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Salones */}
      <AnimatePresence mode="wait">
        {!busquedaActiva ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-12">
                <div className="text-center">
                  <Search className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-slate-900 dark:text-slate-100 mb-2">Realiza una búsqueda</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Selecciona sede, piso y hora, luego haz clic en "Buscar Salones" para ver los resultados
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : salonesFiltrados.length === 0 ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-12">
                <div className="text-center">
                  <MapPin className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-slate-900 dark:text-slate-100 mb-2">No hay salones</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    No se encontraron salones en {sedeSeleccionada} - Piso {pisoSeleccionado}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>Salones Encontrados ({salonesFiltrados.length})</span>
                  <Badge variant="outline" className="text-sm">
                    {sedeSeleccionada} - Piso {pisoSeleccionado} - {horaSeleccionada}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {salonesFiltrados.map((salon, index) => {
                    const estadoConfig = getEstadoConfig(salon.estadoSalon);

                    return (
                      <motion.div
                        key={salon.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`border-2 transition-all hover:shadow-lg ${salon.estadoSalon === 'cerrado'
                          ? 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50'
                          : salon.estadoSalon === 'en-clase'
                            ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                            : salon.estadoSalon === 'por-cerrar'
                              ? 'border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20'
                              : salon.estadoSalon === 'abierto'
                                ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
                                : salon.estadoSalon === 'por-abrir'
                                  ? 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20'
                                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                          }`}>
                          <CardContent className="p-6">
                            {/* Header del salón */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-slate-900 dark:text-slate-100">
                                    {salon.nombre}
                                  </h3>
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {salon.tipo}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                                    {salon.codigo}
                                  </code>
                                  <Badge className={`${estadoConfig.className} border`}>
                                    <estadoConfig.icon className="w-3 h-3 mr-1" />
                                    <span className="ml-1">{estadoConfig.label}</span>
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Información de la clase */}
                            {salon.tieneClase && salon.infoGrupo && (
                              <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 mb-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                                  <Clock className="w-4 h-4 text-blue-600" />
                                  <span className="text-slate-900 dark:text-slate-100">Clase en Curso</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Asignatura</p>
                                      <p className="text-sm text-slate-900 dark:text-slate-100">{salon.infoGrupo.asignatura}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Grupo</p>
                                      <p className="text-sm text-slate-900 dark:text-slate-100">{salon.infoGrupo.grupo}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Horario</p>
                                      <p className="text-sm text-slate-900 dark:text-slate-100">{salon.infoGrupo.horario}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Estudiantes</p>
                                      <p className="text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {salon.infoGrupo.estudiantes} / {salon.capacidad}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Docente</p>
                                  <p className="text-sm text-slate-900 dark:text-slate-100">{salon.infoGrupo.docente}</p>
                                </div>
                              </div>
                            )}

                            {/* Info del estado */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>Cap. {salon.capacidad}</span>
                                </div>
                                {estadosSalones.get(salon.id)?.horaApertura && (
                                  <div className="flex items-center gap-1">
                                    <DoorOpen className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs">Abierto: {estadosSalones.get(salon.id)?.horaApertura}</span>
                                  </div>
                                )}
                                {estadosSalones.get(salon.id)?.horaCierre && (
                                  <div className="flex items-center gap-1">
                                    <Lock className="w-4 h-4 text-slate-600" />
                                    <span className="text-xs">Cerrado: {estadosSalones.get(salon.id)?.horaCierre}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-2">
                              {salon.estadoSalon === 'por-abrir' && (
                                <Button
                                  onClick={() => abrirSalon(salon.id)}
                                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                                >
                                  <DoorOpen className="w-4 h-4 mr-2" />
                                  Abrir Salón
                                </Button>
                              )}

                              {(salon.estadoSalon === 'por-cerrar') && (
                                <Button
                                  onClick={() => abrirModalCierre(salon)}
                                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                                >
                                  <DoorClosed className="w-4 h-4 mr-2" />
                                  Cerrar Salón
                                </Button>
                              )}

                              {salon.estadoSalon === 'en-clase' && (
                                <Button
                                  disabled
                                  className="flex-1 bg-green-600 text-white cursor-not-allowed"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Clase en Curso
                                </Button>
                              )}

                              {salon.estadoSalon === 'cerrado' && (
                                <Button
                                  disabled
                                  className="flex-1 bg-slate-600 text-white cursor-not-allowed"
                                >
                                  <Lock className="w-4 h-4 mr-2" />
                                  Cerrado
                                </Button>
                              )}

                              {salon.estadoSalon === 'sin-clase' && (
                                <Button
                                  disabled
                                  variant="outline"
                                  className="flex-1 cursor-not-allowed"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Sin Clase Programada
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Checklist de Cierre */}
      <Dialog open={modalCierreAbierto} onOpenChange={setModalCierreAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <ClipboardCheck className="w-6 h-6 text-purple-600" />
              Checklist de Cierre - {salonParaCerrar?.nombre}
            </DialogTitle>
            <DialogDescription>
              Verifica que el salón quede en perfectas condiciones antes de cerrar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Checklist Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox
                  id="luces"
                  checked={checklist.lucesApagadas}
                  onCheckedChange={(checked) => setChecklist({ ...checklist, lucesApagadas: checked as boolean })}
                />
                <label htmlFor="luces" className="flex items-center gap-2 cursor-pointer flex-1">
                  <LightbulbOff className="w-5 h-5 text-yellow-600" />
                  <span className="text-slate-700 dark:text-slate-300">Luces apagadas</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox
                  id="aire"
                  checked={checklist.aireApagado}
                  onCheckedChange={(checked) => setChecklist({ ...checklist, aireApagado: checked as boolean })}
                />
                <label htmlFor="aire" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Wind className="w-5 h-5 text-blue-600" />
                  <span className="text-slate-700 dark:text-slate-300">Aire acondicionado apagado</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox
                  id="proyector"
                  checked={checklist.proyectorApagado}
                  onCheckedChange={(checked) => setChecklist({ ...checklist, proyectorApagado: checked as boolean })}
                />
                <label htmlFor="proyector" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Monitor className="w-5 h-5 text-indigo-600" />
                  <span className="text-slate-700 dark:text-slate-300">Proyector apagado</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox
                  id="pupitres"
                  checked={checklist.pupitresOrdenados}
                  onCheckedChange={(checked) => setChecklist({ ...checklist, pupitresOrdenados: checked as boolean })}
                />
                <label htmlFor="pupitres" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Armchair className="w-5 h-5 text-orange-600" />
                  <span className="text-slate-700 dark:text-slate-300">Pupitres ordenados</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox
                  id="pizarra"
                  checked={checklist.pizarraLimpia}
                  onCheckedChange={(checked) => setChecklist({ ...checklist, pizarraLimpia: checked as boolean })}
                />
                <label htmlFor="pizarra" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Eraser className="w-5 h-5 text-slate-600" />
                  <span className="text-slate-700 dark:text-slate-300">Pizarra limpia</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox
                  id="ventanas"
                  checked={checklist.ventanasCerradas}
                  onCheckedChange={(checked) => setChecklist({ ...checklist, ventanasCerradas: checked as boolean })}
                />
                <label htmlFor="ventanas" className="flex items-center gap-2 cursor-pointer flex-1">
                  <DoorClosed className="w-5 h-5 text-teal-600" />
                  <span className="text-slate-700 dark:text-slate-300">Ventanas cerradas</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors md:col-span-2">
                <Checkbox
                  id="objetos"
                  checked={checklist.sinObjetosOlvidados}
                  onCheckedChange={(checked) => setChecklist({ ...checklist, sinObjetosOlvidados: checked as boolean })}
                />
                <label htmlFor="objetos" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Search className="w-5 h-5 text-red-600" />
                  <span className="text-slate-700 dark:text-slate-300">Sin objetos olvidados</span>
                </label>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones (opcional)</Label>
              <Textarea
                id="observaciones"
                placeholder="Reportar daños, objetos encontrados o novedades..."
                value={checklist.observaciones}
                onChange={(e) => setChecklist({ ...checklist, observaciones: e.target.value })}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCierreAbierto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={cerrarSalon}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={
                !checklist.lucesApagadas ||
                !checklist.aireApagado ||
                !checklist.proyectorApagado ||
                !checklist.pupitresOrdenados ||
                !checklist.pizarraLimpia ||
                !checklist.ventanasCerradas ||
                !checklist.sinObjetosOlvidados
              }
            >
              <Lock className="w-4 h-4 mr-2" />
              Confirmar Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  );
}