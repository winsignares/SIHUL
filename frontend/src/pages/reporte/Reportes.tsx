import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../share/dialog';
import { Download, Calendar, FileSpreadsheet, Loader, Eye, Clock, MapPin, Search } from 'lucide-react';
import { Badge } from '../../share/badge';
import { Toaster } from '../../share/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { motion, AnimatePresence } from 'motion/react';
import { useReportes } from '../../hooks/reporte/useReportes';
import type { HorarioPrograma, HorarioDocente } from '../../models/reporte/reportes-general.model';

export default function Reportes() {
  const {
    PERIODO_TRABAJO,
    tipoReporte,
    setTipoReporte,
    filtroDocente,
    setFiltroDocente,
    filtroPrograma,
    setFiltroPrograma,
    datosOcupacion,
    espaciosMasUsados,
    horariosDocente,
    horariosPrograma,
    disponibilidadEspacios,
    capacidadUtilizada,
    reportesDisponibles,
    docentes,
    programas,
    exportarPDF,
    exportarExcel,
    cargandoOcupacion,
    errorOcupacion,
    cargandoDisponibilidad,
    errorDisponibilidad,
    cargandoCapacidad,
    errorCapacidad,
    showHorarioModal,
    setShowHorarioModal,
    grupoSeleccionado,
    handleVerHorarioGrupo,
    obtenerHorariosGrupo,
    docenteSeleccionado,
    showHorarioDocenteModal,
    setShowHorarioDocenteModal,
    handleVerHorarioDocente,
    obtenerHorariosDocente
  } = useReportes();

  const renderReporteContent = () => {
    switch (tipoReporte) {
      case 'ocupacion':
        return (
          <div className="grid lg:grid-cols-2 gap-6">
            {errorOcupacion && (
              <div className="lg:col-span-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">{errorOcupacion}</p>
              </div>
            )}
            
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Ocupación por Jornada - Semana Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cargandoOcupacion ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 text-slate-400 animate-spin" />
                    <span className="ml-2 text-slate-600 dark:text-slate-400">Cargando datos...</span>
                  </div>
                ) : (
                  datosOcupacion.map((dato, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-slate-900 dark:text-slate-100">{dato.jornada}</span>
                          <p className="text-slate-600 dark:text-slate-400">{dato.espacios} espacios</p>
                        </div>
                        <span className="text-slate-900 dark:text-slate-100">{dato.ocupacion}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <motion.div
                          className={`${dato.color} h-3 rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${dato.ocupacion}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        ></motion.div>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Espacios Más Utilizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cargandoOcupacion ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-6 h-6 text-slate-400 animate-spin" />
                      <span className="ml-2 text-slate-600 dark:text-slate-400">Cargando datos...</span>
                    </div>
                  ) : (
                    espaciosMasUsados.map((espacio, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                            <span className="text-white">{index + 1}</span>
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-slate-100">{espacio.espacio}</p>
                            <p className="text-slate-600 dark:text-slate-400">{espacio.usos} clases/semana</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400">
                          {espacio.ocupacion}%
                        </Badge>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'horarios-docente':
        // Agrupar horarios por docente
        const docentesAgrupados = horariosDocente
          .reduce((acc, horario) => {
            const key = horario.docente;
            if (!acc[key]) {
              acc[key] = {
                docente: horario.docente,
                facultad: horario.facultad,
                horarios: []
              };
            }
            acc[key].horarios.push(horario);
            return acc;
          }, {} as Record<string, { docente: string; facultad?: string; horarios: HorarioDocente[] }>);

        const docentesListaAgrupada = Object.values(docentesAgrupados);

        return (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Horarios por Docente</CardTitle>
            </CardHeader>
            <CardContent>
              {docentesListaAgrupada.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">No se encontraron docentes</p>
                  <p className="text-slate-500">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-700">Facultad</th>
                        <th className="px-4 py-3 text-left text-slate-700">Nombre Docente</th>
                        <th className="px-4 py-3 text-center text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docentesListaAgrupada.map((item) => (
                        <tr key={item.docente} className="border-t border-slate-200 hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-900">{item.facultad || 'N/A'}</td>
                          <td className="px-4 py-3 text-slate-900">{item.docente}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleVerHorarioDocente(item.docente)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Horario
                              </Button>
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
        );

      case 'horarios-programa':
        // Agrupar horarios por programa, grupo y semestre
        const horariosAgrupados = horariosPrograma
          .filter(horario => 
            filtroPrograma === 'todos' || 
            horario.programa?.toLowerCase() === filtroPrograma.toLowerCase()
          )
          .reduce((acc, horario) => {
            const key = `${horario.programa}-${horario.grupo}`;
            if (!acc[key]) {
              acc[key] = {
                programa: horario.programa,
                grupo: horario.grupo,
                horarios: []
              };
            }
            acc[key].horarios.push(horario);
            return acc;
          }, {} as Record<string, { programa?: string; grupo: string; horarios: HorarioPrograma[] }>);

        const gruposAgrupados = Object.values(horariosAgrupados);

        return (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900 dark:text-slate-100">Horarios por Programa</CardTitle>
                <Select value={filtroPrograma} onValueChange={setFiltroPrograma}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Seleccionar programa" />
                  </SelectTrigger>
                  <SelectContent>
                    {programas.map(prog => (
                      <SelectItem key={prog} value={prog.toLowerCase()}>{prog}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {gruposAgrupados.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">No se encontraron grupos</p>
                  <p className="text-slate-500">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-700">Programa</th>
                        <th className="px-4 py-3 text-left text-slate-700">Grupo</th>
                        <th className="px-4 py-3 text-left text-slate-700">Semestre</th>
                        <th className="px-4 py-3 text-center text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gruposAgrupados.map((grupo) => (
                        <tr key={`${grupo.programa}-${grupo.grupo}`} className="border-t border-slate-200 hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-900">{grupo.programa || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="border-blue-600 text-blue-600">
                              {grupo.grupo}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {grupo.horarios[0]?.semestre || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleVerHorarioGrupo(grupo.grupo)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Horario
                              </Button>
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
        );

      case 'disponibilidad':
        return (
          <div className="grid lg:grid-cols-2 gap-6">
            {errorDisponibilidad && (
              <div className="lg:col-span-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">{errorDisponibilidad}</p>
              </div>
            )}
            
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Disponibilidad de Espacios</CardTitle>
              </CardHeader>
              <CardContent>
                {cargandoDisponibilidad ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 text-slate-400 animate-spin" />
                    <span className="ml-2 text-slate-600 dark:text-slate-400">Cargando datos...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Espacio</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Disponible</TableHead>
                        <TableHead>Ocupado</TableHead>
                        <TableHead>%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disponibilidadEspacios.map((espacio, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-slate-900 dark:text-slate-100">{espacio.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{espacio.tipo}</Badge>
                          </TableCell>
                          <TableCell className="text-green-600 dark:text-green-400">{espacio.horasDisponibles}h</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{espacio.horasOcupadas}h</TableCell>
                          <TableCell>
                            <Badge className={`${espacio.porcentajeOcupacion > 70 ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'}`}>
                              {espacio.porcentajeOcupacion}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Resumen de Disponibilidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cargandoDisponibilidad ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 text-slate-400 animate-spin" />
                    <span className="ml-2 text-slate-600 dark:text-slate-400">Cargando datos...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-green-600 dark:text-green-400 mb-1">Total Disponible</p>
                        <p className="text-green-900 dark:text-green-100">110 horas</p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-blue-600 dark:text-blue-400 mb-1">Total Ocupado</p>
                        <p className="text-blue-900 dark:text-blue-100">135 horas</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-600 dark:text-slate-400 mb-2">Promedio de Ocupación</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                          <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-3 rounded-full" style={{ width: '56%' }}></div>
                        </div>
                        <span className="text-slate-900 dark:text-slate-100">56%</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'capacidad':
        return (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Capacidad Utilizada por Tipo de Espacio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {errorCapacidad && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200">{errorCapacidad}</p>
                </div>
              )}
              
              {cargandoCapacidad ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-slate-400 animate-spin" />
                  <span className="ml-2 text-slate-600 dark:text-slate-400">Cargando datos...</span>
                </div>
              ) : (
                <>
                  {capacidadUtilizada.map((dato, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-900 dark:text-slate-100">{dato.tipo}</p>
                          <p className="text-slate-600 dark:text-slate-400">
                            {dato.capacidadUsada} de {dato.capacidadTotal} estudiantes
                          </p>
                        </div>
                        <Badge className={`${Math.min(dato.porcentaje, 100) > 75 ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400'}`}>
                          {Math.min(dato.porcentaje, 100)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-purple-600 to-purple-700 h-4 rounded-full flex items-center justify-end pr-2"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(dato.porcentaje, 100)}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <span className="text-white text-xs">{Math.min(dato.porcentaje, 100)}%</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Reportes y Estadísticas</h1>
          <p className="text-slate-600 dark:text-slate-400">Genera reportes personalizados del sistema diferenciados por rol (RF20)</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-900 dark:text-blue-100"><strong>{PERIODO_TRABAJO}</strong></span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={tipoReporte} onValueChange={setTipoReporte}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Tipo de reporte" />
          </SelectTrigger>
          <SelectContent>
            {reportesDisponibles.map(reporte => (
              <SelectItem key={reporte.id} value={reporte.id}>
                {reporte.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
          onClick={exportarPDF}
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
        <Button
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
          onClick={exportarExcel}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Descargar Excel
        </Button>
      </div>

      {/* Main Report View */}
      <motion.div
        key={tipoReporte}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderReporteContent()}
      </motion.div>

      {/* Modal de Horario por Grupo */}
      <Dialog open={showHorarioModal} onOpenChange={setShowHorarioModal}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Horario Completo del Grupo {grupoSeleccionado}
            </DialogTitle>
          </DialogHeader>
          {grupoSeleccionado && (
            <div className="space-y-6 py-4">
              {/* Información del Grupo */}
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Grupo</p>
                      <Badge className="bg-blue-600">{grupoSeleccionado}</Badge>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Total de Clases</p>
                      <p className="text-slate-900">{obtenerHorariosGrupo(grupoSeleccionado).length} clases</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grid Semanal */}
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
                      {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map((hora) => (
                        <tr key={hora} className="hover:bg-slate-50 transition-colors">
                          <td className="border-2 border-slate-300 p-3 bg-slate-100 text-center text-slate-700">
                            {hora}
                          </td>
                          {['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].map((dia) => {
                            const horariosDelGrupo = obtenerHorariosGrupo(grupoSeleccionado);
                            const clase = horariosDelGrupo.find(h => {
                              const diaMatch = h.dia.toLowerCase() === dia;
                              if (!diaMatch) return false;
                              
                              // Parsear el rango de horas (ej: "10:00-12:00")
                              const [horaInicio, horaFin] = h.hora.split('-');
                              const horaActual = parseInt(hora.split(':')[0]);
                              const horaInicioNum = parseInt(horaInicio.split(':')[0]);
                              const horaFinNum = parseInt(horaFin.split(':')[0]);
                              
                              // Verificar si la hora actual está dentro del rango
                              return horaActual >= horaInicioNum && horaActual < horaFinNum;
                            });
                            
                            return (
                              <td
                                key={dia}
                                className={`border-2 border-slate-300 p-2 transition-all ${clase
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer'
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
                                        <p className="text-sm mb-1">{clase.asignatura}</p>
                                        <p className="text-xs text-yellow-200">{clase.docente}</p>
                                      </div>
                                      <div className="flex items-center justify-center gap-2 bg-white/10 rounded-md p-1.5">
                                        <MapPin className="w-4 h-4 text-yellow-300" />
                                        <span className="text-sm">{clase.espacio}</span>
                                      </div>
                                      <div className="text-xs text-yellow-100 mt-1">
                                        {clase.hora}
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
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded"></div>
                  <span className="text-slate-600">Clase asignada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded"></div>
                  <span className="text-slate-600">Hora libre</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowHorarioModal(false)} className="bg-blue-600 hover:bg-blue-700">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Horario por Docente */}
      <Dialog open={showHorarioDocenteModal} onOpenChange={setShowHorarioDocenteModal}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Horario Completo del Docente {docenteSeleccionado}
            </DialogTitle>
          </DialogHeader>
          {docenteSeleccionado && (
            <div className="space-y-6 py-4">
              {/* Información del Docente */}
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Docente</p>
                      <Badge className="bg-blue-600">{docenteSeleccionado}</Badge>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Total de Clases</p>
                      <p className="text-slate-900">{obtenerHorariosDocente(docenteSeleccionado).length} clases</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grid Semanal */}
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
                      {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map((hora) => (
                        <tr key={hora} className="hover:bg-slate-50 transition-colors">
                          <td className="border-2 border-slate-300 p-3 bg-slate-100 text-center text-slate-700">
                            {hora}
                          </td>
                          {['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].map((dia) => {
                            const horariosDelDocente = obtenerHorariosDocente(docenteSeleccionado);
                            const clase = horariosDelDocente.find(h => {
                              const diaMatch = h.dia.toLowerCase() === dia;
                              if (!diaMatch) return false;
                              
                              // Parsear el rango de horas (ej: "10:00-12:00")
                              const [horaInicio, horaFin] = h.hora.split('-');
                              const horaActual = parseInt(hora.split(':')[0]);
                              const horaInicioNum = parseInt(horaInicio.split(':')[0]);
                              const horaFinNum = parseInt(horaFin.split(':')[0]);
                              
                              // Verificar si la hora actual está dentro del rango
                              return horaActual >= horaInicioNum && horaActual < horaFinNum;
                            });
                            
                            return (
                              <td
                                key={dia}
                                className={`border-2 border-slate-300 p-2 transition-all ${clase
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer'
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
                                        <p className="text-sm mb-1">{clase.asignatura}</p>
                                        <p className="text-xs text-yellow-200">{clase.grupo}</p>
                                      </div>
                                      <div className="flex items-center justify-center gap-2 bg-white/10 rounded-md p-1.5">
                                        <MapPin className="w-4 h-4 text-yellow-300" />
                                        <span className="text-sm">{clase.espacio}</span>
                                      </div>
                                      <div className="text-xs text-yellow-100 mt-1">
                                        {clase.hora}
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
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded"></div>
                  <span className="text-slate-600">Clase asignada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded"></div>
                  <span className="text-slate-600">Hora libre</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowHorarioDocenteModal(false)} className="bg-blue-600 hover:bg-blue-700">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
