import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Alert, AlertDescription, AlertTitle } from '../../share/alert';
import { Badge } from '../../share/badge';
import { Progress } from '../../share/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../share/dialog';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Zap,
  Calendar,
  Users,
  MapPin,
  Clock,
  Download,
  X,
  Info,
  RefreshCw,
  Eye,
  Check,
  XCircle,
  BookOpen,
  GraduationCap,
  UsersRound,
  UserRound,
  Sun,
  Timer,
  TimerOff,
  UserCheck,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationBanner } from '../../share/notificationBanner';
import { useAsignacionAutomatica } from '../../hooks/gestionAcademica/useAsignacionAutomatica';

export default function AsignacionAutomatica() {
  const {
    horariosImportados,
    procesando,
    progreso,
    resultados,
    etapa,
    asignacionesConfirmadas,
    asignacionesRechazadas,
    horarioSeleccionado,
    mostrarCalendario,
    mostrarHorarioCompleto,
    grupoSeleccionado,
    horariosGrupoSeleccionado,
    handleFileChange,
    iniciarAsignacionAutomatica,
    descargarPlantilla,
    reiniciar,
    confirmarAsignacion,
    rechazarAsignacion,
    verCalendarioHorario,
    verHorarioCompleto,
    confirmarGrupoCompleto,
    rechazarGrupoCompleto,
    setMostrarCalendario,
    setMostrarHorarioCompleto,
    generarHoras,
    obtenerClaseEnHora,
    capitalize,
    gruposUnicos,
    notification
  } = useAsignacionAutomatica();

  return (
    <div className="p-8 space-y-6">
      <NotificationBanner notification={notification} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Asignación Automática de Horarios</h1>
          <p className="text-slate-600">Sube un archivo con los horarios y el sistema asignará espacios automáticamente</p>
        </div>
        <Button
          onClick={descargarPlantilla}
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar Plantilla
        </Button>
      </div>

      {/* Info Card */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-900">¿Cómo funciona?</AlertTitle>
        <AlertDescription className="text-blue-700">
          El sistema analiza cada horario y asigna el espacio más adecuado considerando:
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Capacidad del espacio vs cantidad de estudiantes</li>
            <li>Recursos disponibles vs recursos requeridos</li>
            <li>Disponibilidad temporal (sin conflictos de horario)</li>
            <li>Estado del espacio (solo espacios disponibles)</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Etapa 1: Carga de Archivo */}
      {etapa === 'carga' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-6 h-6 text-red-600" />
                Cargar Archivo de Horarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Zona de carga */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-red-500 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <div className="flex justify-center gap-4">
                      <FileSpreadsheet className="w-16 h-16 text-green-600" />
                      <FileText className="w-16 h-16 text-red-600" />
                    </div>
                    <div>
                      <p className="text-slate-900 mb-2">
                        Arrastra y suelta tu archivo aquí o <span className="text-red-600 underline">selecciona un archivo</span>
                      </p>
                      <p className="text-slate-500">
                        Formatos aceptados: Excel (.xlsx, .xls) o CSV
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Información de formato */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-slate-900 dark:text-slate-100">Columnas requeridas en el archivo</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 rounded-md bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-slate-100">Programa</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nombre del programa</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-slate-100">Asignatura</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nombre de la materia</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 rounded-md bg-green-100 dark:bg-green-950/30 flex items-center justify-center flex-shrink-0">
                      <UsersRound className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-slate-100">Grupo</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">ID del grupo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 rounded-md bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
                      <UserRound className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-slate-100">Docente</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nombre del profesor</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 rounded-md bg-yellow-100 dark:bg-yellow-950/30 flex items-center justify-center flex-shrink-0">
                      <Sun className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-slate-100">Día</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Día de la semana</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 rounded-md bg-cyan-100 dark:bg-cyan-950/30 flex items-center justify-center flex-shrink-0">
                      <Timer className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-slate-100">Hora Inicio</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Ej: 08:00</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 rounded-md bg-red-100 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                      <TimerOff className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-slate-100">Hora Fin</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Ej: 10:00</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 rounded-md bg-pink-100 dark:bg-pink-950/30 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-slate-100">Estudiantes</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Cantidad total</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-slate-100">Recursos</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Separados por coma</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Etapa 2: Revisión de Datos */}
      {etapa === 'revision' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-slate-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  Datos Cargados - Revisión
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={reiniciar}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={iniciarAsignacionAutomatica}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Iniciar Asignación Automática
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-green-900">Archivo procesado correctamente</p>
                    <p className="text-green-700">{horariosImportados.length} horarios encontrados</p>
                  </div>
                </div>

                {/* Vista previa de datos */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 p-3 border-b border-slate-200">
                    <p className="text-slate-900">Vista Previa (primeros 5 registros)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-slate-700">Programa</th>
                          <th className="px-4 py-2 text-left text-slate-700">Asignatura</th>
                          <th className="px-4 py-2 text-left text-slate-700">Grupo</th>
                          <th className="px-4 py-2 text-left text-slate-700">Día</th>
                          <th className="px-4 py-2 text-left text-slate-700">Horario</th>
                          <th className="px-4 py-2 text-left text-slate-700">Estudiantes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {horariosImportados.slice(0, 5).map((horario, idx) => (
                          <tr key={idx} className="border-t border-slate-200">
                            <td className="px-4 py-2 text-slate-900">{horario.programa}</td>
                            <td className="px-4 py-2 text-slate-900">{horario.asignatura}</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline">{horario.grupo}</Badge>
                            </td>
                            <td className="px-4 py-2 text-slate-700">{horario.diaSemana}</td>
                            <td className="px-4 py-2 text-slate-700">
                              {horario.horaInicio} - {horario.horaFin}
                            </td>
                            <td className="px-4 py-2 text-slate-700">{horario.cantidadEstudiantes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {horariosImportados.length > 5 && (
                    <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-slate-600">
                      ... y {horariosImportados.length - 5} registros más
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Etapa 3: Procesando */}
      {etapa === 'procesando' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-slate-200 shadow-lg">
            <CardContent className="p-12">
              <div className="space-y-6 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 mx-auto"
                >
                  <RefreshCw className="w-20 h-20 text-red-600" />
                </motion.div>
                <div>
                  <h3 className="text-slate-900 mb-2">Procesando Asignación Automática...</h3>
                  <p className="text-slate-600">Analizando espacios y recursos disponibles</p>
                </div>
                <div className="space-y-2">
                  <Progress value={progreso} className="h-3" />
                  <p className="text-slate-700">{Math.round(progreso)}% completado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Etapa 4: Resultados */}
      {etapa === 'completado' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-slate-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  Asignación Completada
                </CardTitle>
                <Button
                  onClick={reiniciar}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nueva Asignación
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-green-600 mb-1">Exitosos</p>
                    <p className="text-green-900 text-3xl">
                      {resultados.filter(r => r.exito).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-red-600 mb-1">Fallidos</p>
                    <p className="text-red-900 text-3xl">
                      {resultados.filter(r => !r.exito).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-blue-600 mb-1">Total</p>
                    <p className="text-blue-900 text-3xl">
                      {resultados.length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Botones por Grupo - VER HORARIO COMPLETO */}
              {gruposUnicos.length > 0 && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="w-6 h-6 text-blue-600" />
                      <h3 className="text-slate-900">Visualizar Horarios Completos por Grupo</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {gruposUnicos.map((grupo) => {
                        const horariosGrupo = resultados.filter(r => r.exito && r.horario.grupo === grupo);
                        const programa = horariosGrupo[0]?.horario.programa || 'N/A';
                        return (
                          <Button
                            key={grupo}
                            onClick={() => verHorarioCompleto(grupo)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-auto py-4"
                          >
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="font-semibold">{grupo}</span>
                              </div>
                              <p className="text-xs text-white/80">{programa}</p>
                              <p className="text-xs text-white/70 mt-1">{horariosGrupo.length} horarios asignados</p>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabla de resultados */}
              <AnimatePresence mode="wait">
                {!mostrarHorarioCompleto ? (
                  <motion.div
                    key="tabla-resultados"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full">
                        <thead className="bg-slate-100 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-slate-700">Estado</th>
                            <th className="px-4 py-3 text-left text-slate-700">Programa</th>
                            <th className="px-4 py-3 text-left text-slate-700">Asignatura</th>
                            <th className="px-4 py-3 text-left text-slate-700">Grupo</th>
                            <th className="px-4 py-3 text-left text-slate-700">Horario</th>
                            <th className="px-4 py-3 text-left text-slate-700">Espacio Asignado</th>
                            <th className="px-4 py-3 text-left text-slate-700">Observación</th>
                            <th className="px-4 py-3 text-center text-slate-700">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultados.map((resultado, idx) => (
                            <tr
                              key={idx}
                              className={`border-t border-slate-200 hover:bg-slate-50 transition-colors ${asignacionesConfirmadas.has(idx) ? 'bg-green-50' :
                                  asignacionesRechazadas.has(idx) ? 'bg-red-50' : ''
                                }`}
                            >
                              <td className="px-4 py-3">
                                {asignacionesConfirmadas.has(idx) ? (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="text-green-600 text-sm">Confirmado</span>
                                  </div>
                                ) : asignacionesRechazadas.has(idx) ? (
                                  <div className="flex items-center gap-2">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-red-600 text-sm">Rechazado</span>
                                  </div>
                                ) : resultado.exito ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-red-600" />
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-900">{resultado.horario.programa}</td>
                              <td className="px-4 py-3 text-slate-900">{resultado.horario.asignatura}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline">{resultado.horario.grupo}</Badge>
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                {capitalize(resultado.horario.diaSemana)} {resultado.horario.horaInicio}-{resultado.horario.horaFin}
                              </td>
                              <td className="px-4 py-3">
                                {resultado.exito ? (
                                  <Badge className="bg-green-600">{resultado.espacioAsignado}</Badge>
                                ) : (
                                  <span className="text-slate-400">N/A</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-600 text-sm">{resultado.razon}</td>
                              <td className="px-4 py-3">
                                {resultado.exito && (
                                  <div className="flex items-center justify-center gap-2">
                                    {!asignacionesConfirmadas.has(idx) && !asignacionesRechazadas.has(idx) && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-green-600 text-green-600 hover:bg-green-50"
                                          onClick={() => confirmarAsignacion(idx)}
                                        >
                                          <Check className="w-4 h-4 mr-1" />
                                          Confirmar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                          onClick={() => verCalendarioHorario(resultado)}
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          Ver
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-red-600 text-red-600 hover:bg-red-50"
                                          onClick={() => rechazarAsignacion(idx, resultado)}
                                        >
                                          <X className="w-4 h-4 mr-1" />
                                          Rechazar
                                        </Button>
                                      </>
                                    )}
                                    {asignacionesConfirmadas.has(idx) && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                        onClick={() => verCalendarioHorario(resultado)}
                                      >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Ver Horario
                                      </Button>
                                    )}
                                    {asignacionesRechazadas.has(idx) && (
                                      <span className="text-slate-400 text-sm">Rechazado</span>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="horario-completo"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white"
                  >
                    {/* Header con botones de acción */}
                    <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 p-6 border-b-4 border-yellow-400">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-8 h-8 text-white" />
                          <div>
                            <h2 className="text-white text-2xl mb-1">Horario Completo del Grupo {grupoSeleccionado}</h2>
                            <p className="text-yellow-200">
                              {horariosGrupoSeleccionado[0]?.horario.programa} • {horariosGrupoSeleccionado.length} clases asignadas
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                            onClick={() => setMostrarHorarioCompleto(false)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Volver a Lista
                          </Button>
                          <Button
                            className="bg-red-900 hover:bg-red-950 text-white border-2 border-white/20"
                            onClick={rechazarGrupoCompleto}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rechazar Todo
                          </Button>
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={confirmarGrupoCompleto}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Confirmar Todo
                          </Button>
                        </div>
                      </div>
                    </div>

                    {horariosGrupoSeleccionado.length > 0 && (
                      <div className="bg-slate-50 p-6">
                        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-slate-200">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-slate-900">
                                  <th className="border-2 border-slate-300 p-4 text-white w-24">
                                    <Clock className="w-5 h-5 mx-auto mb-1" />
                                    Hora
                                  </th>
                                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((dia) => (
                                    <th key={dia} className="border-2 border-slate-300 p-4 text-white">
                                      {dia}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {generarHoras().map((hora) => (
                                  <tr key={hora} className="hover:bg-slate-50 transition-colors">
                                    <td className="border-2 border-slate-300 p-3 bg-slate-100 text-center font-semibold text-slate-700">
                                      {hora}
                                    </td>
                                    {['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].map((dia) => {
                                      const clase = obtenerClaseEnHora(dia, hora);
                                      return (
                                        <td
                                          key={dia}
                                          className={`border-2 border-slate-300 p-2 transition-all ${clase
                                              ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 cursor-pointer'
                                              : 'bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                          {clase ? (
                                            <motion.div
                                              initial={{ scale: 0.9, opacity: 0 }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              className="h-full min-h-[120px] flex flex-col justify-center items-center text-white p-3 rounded-lg"
                                            >
                                              <div className="text-center space-y-2 w-full">
                                                <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm mb-2">
                                                  <p className="font-bold text-sm mb-1">{clase.horario.asignatura}</p>
                                                  <p className="text-xs text-yellow-200">{clase.horario.docente}</p>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 bg-white/10 rounded-md p-1.5">
                                                  <MapPin className="w-4 h-4 text-yellow-300" />
                                                  <span className="font-semibold text-sm">{clase.espacioAsignado}</span>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 bg-white/10 rounded-md p-1.5">
                                                  <Users className="w-4 h-4 text-yellow-300" />
                                                  <span className="text-xs">{clase.horario.cantidadEstudiantes} estudiantes</span>
                                                </div>
                                                <div className="text-xs text-yellow-100 mt-1">
                                                  {clase.horario.horaInicio} - {clase.horario.horaFin}
                                                </div>
                                              </div>
                                            </motion.div>
                                          ) : (
                                            <div className="h-full min-h-[120px] flex items-center justify-center">
                                              <span className="text-slate-300 text-xs">—</span>
                                            </div>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Leyenda */}
                        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded"></div>
                            <span className="text-slate-600">Clase asignada</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded"></div>
                            <span className="text-slate-600">Hora libre</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Modal de Calendario Creativo */}
      <Dialog open={mostrarCalendario} onOpenChange={setMostrarCalendario}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-red-600" />
              Visualización de Horario
            </DialogTitle>
          </DialogHeader>

          {horarioSeleccionado && (
            <div className="space-y-6">
              {/* Información General */}
              <Card className="bg-gradient-to-r from-red-50 to-yellow-50 border-red-200">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Programa</p>
                      <p className="text-slate-900">{horarioSeleccionado.horario.programa}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Asignatura</p>
                      <p className="text-slate-900">{horarioSeleccionado.horario.asignatura}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Docente</p>
                      <p className="text-slate-900">{horarioSeleccionado.horario.docente}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Grupo</p>
                      <Badge className="bg-red-600">{horarioSeleccionado.horario.grupo}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Calendario Semanal Creativo */}
              <div className="grid grid-cols-5 gap-3">
                {['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].map((dia) => {
                  const esDiaAsignado = dia === horarioSeleccionado.horario.diaSemana.toLowerCase();

                  return (
                    <motion.div
                      key={dia}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].indexOf(dia) * 0.1 }}
                    >
                      <Card className={`${esDiaAsignado
                          ? 'bg-gradient-to-br from-red-600 to-red-700 border-red-700 shadow-lg transform scale-105'
                          : 'bg-slate-50 border-slate-200'
                        } transition-all duration-300`}>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className={`text-sm mb-3 ${esDiaAsignado ? 'text-white' : 'text-slate-600'}`}>
                              {capitalize(dia)}
                            </p>

                            {esDiaAsignado ? (
                              <div className="space-y-3">
                                <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                                  <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-white" />
                                    <p className="text-white">
                                      {horarioSeleccionado.horario.horaInicio}
                                    </p>
                                  </div>
                                  <div className="h-px bg-white/40 my-2"></div>
                                  <div className="flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4 text-white" />
                                    <p className="text-white">
                                      {horarioSeleccionado.horario.horaFin}
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                                  <div className="flex items-center justify-center gap-2">
                                    <MapPin className="w-4 h-4 text-yellow-300" />
                                    <p className="text-white text-sm">{horarioSeleccionado.espacioAsignado}</p>
                                  </div>
                                </div>

                                <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                                  <div className="flex items-center justify-center gap-2">
                                    <Users className="w-4 h-4 text-yellow-300" />
                                    <p className="text-white text-sm">
                                      {horarioSeleccionado.horario.cantidadEstudiantes} estudiantes
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="py-8">
                                <p className="text-slate-400 text-xs">Sin clases</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Recursos Requeridos */}
              {horarioSeleccionado.horario.recursosRequeridos.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <p className="text-blue-900 mb-3">Recursos Requeridos:</p>
                    <div className="flex flex-wrap gap-2">
                      {horarioSeleccionado.horario.recursosRequeridos.map((recurso, idx) => (
                        <Badge key={idx} variant="outline" className="border-blue-400 text-blue-700">
                          {recurso}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botones de Acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setMostrarCalendario(false)}
                >
                  Cerrar
                </Button>
                <Button
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  onClick={() => {
                    setMostrarCalendario(false);
                    // Mostrar notificación: Horario visualizado correctamente
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Entendido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}