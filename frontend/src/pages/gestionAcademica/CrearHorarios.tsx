import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../share/dialog';
import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import {
  Clock,
  Search,
  Filter,
  Calendar,
  User,
  Plus,
  ArrowLeft,
  Eraser,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { NotificationBanner } from '../../share/notificationBanner';
import { useCrearHorarios } from '../../hooks/gestionAcademica/useCrearHorarios';

interface CrearHorariosProps {
  onHorarioCreado?: () => void;
}

export default function CrearHorarios({ onHorarioCreado }: CrearHorariosProps = {}) {
  const {
    facultades,
    espacios,
    asignaturas,
    docentes,
    filtroFacultad, setFiltroFacultad,
    filtroPrograma, setFiltroPrograma,
    filtroSemestre, setFiltroSemestre,
    filtroGrupo, setFiltroGrupo,
    vistaActual,
    grupoSeleccionado,
    horariosAsignados,
    showModalAsignar, setShowModalAsignar,
    asignaturaSeleccionada, setAsignaturaSeleccionada,
    docenteSeleccionado, setDocenteSeleccionado,
    espacioSeleccionado, setEspacioSeleccionado,
    cantidadEstudiantes, setCantidadEstudiantes,
    diasSeleccionados,
    horasPorDia,
    handleAsignarHorario,
    handleVolverALista,
    handleAbrirModalAsignar,
    handleToggleDia,
    handleHoraChange,
    handleGuardarAsignacion,
    handleEliminarHorarioAsignado,
    limpiarFiltros,
    loadData,
    gruposSinHorarioFiltrados,
    programasFiltrados,
    getAsignaturasByProgramaYSemestre,
    getEspaciosDisponibles,
    diasSemana,
    semestres,
    horas,
    obtenerClaseEnHora,
    notification
  } = useCrearHorarios({ onHorarioCreado });

  // Obtener asignaturas filtradas por programa y semestre del grupo seleccionado
  const asignaturasFiltradas = (grupoSeleccionado?.programa_id && grupoSeleccionado?.semestre)
    ? getAsignaturasByProgramaYSemestre(grupoSeleccionado.programa_id, grupoSeleccionado.semestre)
    : [];

  // Obtener espacios disponibles según la cantidad de estudiantes
  const espaciosDisponibles = getEspaciosDisponibles(cantidadEstudiantes as number);

  // VISTA LISTA DE GRUPOS SIN HORARIO
  if (vistaActual === 'lista') {
    return (
      <div className="p-6 space-y-6">
        <NotificationBanner notification={notification} />
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-slate-900">Crear Horarios</h2>
          <p className="text-slate-600 mt-1">Crear y gestionar horarios académicos por grupo</p>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-yellow-50 border-b border-slate-200">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Filter className="w-5 h-5 text-red-600" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Facultad</Label>
                  <Select value={filtroFacultad} onValueChange={setFiltroFacultad}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las facultades</SelectItem>
                      {facultades.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Programa</Label>
                  <Select value={filtroPrograma} onValueChange={setFiltroPrograma}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los programas</SelectItem>
                      {programasFiltrados.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Semestre</Label>
                  <Select value={filtroSemestre} onValueChange={setFiltroSemestre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los semestres</SelectItem>
                      {semestres.map(s => (
                        <SelectItem key={s} value={s.toString()}>Semestre {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Grupo</Label>
                  <Input
                    placeholder="Buscar grupo..."
                    value={filtroGrupo === 'all' ? '' : filtroGrupo}
                    onChange={(e) => setFiltroGrupo(e.target.value || 'all')}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={limpiarFiltros}
                  className="flex items-center gap-2"
                >
                  <Eraser className="w-4 h-4" />
                  Limpiar Filtros
                </Button>
                <Button
                  onClick={() => loadData()}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                >
                  <Search className="w-4 h-4" />
                  Buscar / Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabla de grupos sin horarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <CardTitle className="flex items-center justify-between text-slate-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  Grupos sin horarios creados ({gruposSinHorarioFiltrados.length})
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-slate-700">Programa</th>
                      <th className="text-left px-6 py-4 text-slate-700">Grupo</th>
                      <th className="text-left px-6 py-4 text-slate-700">Semestre</th>
                      <th className="text-center px-6 py-4 text-slate-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gruposSinHorarioFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-500">
                          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                          <p>No hay grupos sin horarios con los filtros seleccionados</p>
                        </td>
                      </tr>
                    ) : (
                      gruposSinHorarioFiltrados.map((grupo, index) => (
                        <motion.tr
                          key={grupo.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-slate-900">{grupo.programa_nombre || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {grupo.nombre}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-600">Semestre {grupo.semestre}</td>
                          <td className="px-6 py-4 text-center">
                            <Button
                              onClick={() => handleAsignarHorario(grupo)}
                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Asignar Horario
                            </Button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // VISTA DE ASIGNACIÓN DE HORARIOS
  return (
    <div className="h-full flex flex-col">
      <NotificationBanner notification={notification} />
      {/* Header fijo - NO scrolleable */}
      <div className="bg-white border-b border-slate-200 shadow-sm p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-slate-900">Horario del Grupo — {grupoSeleccionado?.nombre}</h2>
            <p className="text-slate-600 mt-1">
              {grupoSeleccionado?.programa_nombre} • Semestre {grupoSeleccionado?.semestre}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleAbrirModalAsignar}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Asignar Asignatura
            </Button>
            <Button
              variant="outline"
              onClick={handleVolverALista}
              className="border-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto p-6">
        {horariosAsignados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Calendar className="w-20 h-20 text-slate-300 mb-4" />
            <h3 className="text-slate-700 mb-2">No hay asignaturas asignadas</h3>
            <p className="text-slate-500 mb-6">Comienza asignando la primera asignatura a este grupo</p>
            <Button
              onClick={handleAbrirModalAsignar}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Asignar Primera Asignatura
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Grid semanal */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardTitle className="text-slate-900">Vista Semanal</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                      <tr>
                        <th className="border border-slate-200 bg-slate-50 p-2 w-20 sticky left-0 z-10">Hora</th>
                        {diasSemana.map(dia => (
                          <th key={dia} className="border border-slate-200 bg-slate-50 p-2 text-slate-700">
                            {dia}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {horas.map(hora => (
                        <tr key={hora}>
                          <td className="border border-slate-200 bg-slate-50 p-2 text-slate-600 text-center sticky left-0 z-10">
                            {hora}
                          </td>
                          {diasSemana.map(dia => {
                            const clase = obtenerClaseEnHora(dia, hora);
                            return (
                              <td key={`${dia}-${hora}`} className="border border-slate-200 p-1 h-16 align-top">
                                {clase && parseInt(hora.split(':')[0]) === parseInt(clase.hora_inicio.split(':')[0]) && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-red-100 to-yellow-50 border-l-4 border-red-600 rounded p-2 text-xs h-full relative group"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 truncate">{clase.asignatura_nombre}</p>
                                        <p className="text-slate-600 text-xs truncate mt-1">
                                          <User className="w-3 h-3 inline mr-1" />
                                          {clase.docente_nombre}
                                        </p>
                                        <p className="text-slate-500 text-xs truncate">
                                          <Clock className="w-3 h-3 inline mr-1" />
                                          {clase.hora_inicio} - {clase.hora_fin}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => handleEliminarHorarioAsignado(clase.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-red-600 hover:text-red-800"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Lista de asignaturas */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardTitle className="text-slate-900">Asignaturas Asignadas ({horariosAsignados.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {horariosAsignados.map((horario, index) => {
                    return (
                      <motion.div
                        key={horario.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1 grid grid-cols-5 gap-4">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Asignatura</p>
                            <p className="text-slate-900">{horario.asignatura_nombre}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Docente</p>
                            <p className="text-slate-700">{horario.docente_nombre}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Espacio</p>
                            <p className="text-slate-700">{horario.espacio_nombre}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Día</p>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {horario.dia_semana.charAt(0).toUpperCase() + horario.dia_semana.slice(1)}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Horario</p>
                            <p className="text-slate-700">{horario.hora_inicio} - {horario.hora_fin}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminarHorarioAsignado(horario.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Asignar Asignatura */}
      <Dialog open={showModalAsignar} onOpenChange={setShowModalAsignar}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <BookOpen className="w-5 h-5 text-red-600" />
              Asignar Asignatura al Grupo {grupoSeleccionado?.nombre}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Información del grupo */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Programa:</span>
                  <span className="text-slate-900 ml-2">{grupoSeleccionado?.programa_nombre}</span>
                </div>
                <div>
                  <span className="text-slate-600">Semestre:</span>
                  <span className="text-slate-900 ml-2">{grupoSeleccionado?.semestre}</span>
                </div>
              </div>
            </div>

            {/* Campos del formulario */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>
                  Asignatura <span className="text-red-600">*</span>
                </Label>
                <Select 
                  value={asignaturaSeleccionada?.toString() || ''} 
                  onValueChange={(v) => setAsignaturaSeleccionada(v ? parseInt(v) : '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {asignaturasFiltradas.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-slate-500">
                        {grupoSeleccionado?.programa_nombre 
                          ? `No hay asignaturas asignadas al programa ${grupoSeleccionado.programa_nombre}`
                          : 'No hay asignaturas disponibles'}
                      </div>
                    ) : (
                      asignaturasFiltradas.map(a => (
                        <SelectItem key={a.id} value={a.id?.toString() || ''}>
                          {a.nombre} ({a.creditos} créditos)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>
                  Cantidad de Estudiantes <span className="text-red-600">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ejemplo: 30"
                  value={cantidadEstudiantes}
                  onChange={(e) => setCantidadEstudiantes(e.target.value ? parseInt(e.target.value) : '')}
                />
                {cantidadEstudiantes && cantidadEstudiantes > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Se mostrarán solo espacios con capacidad ≥ {cantidadEstudiantes} estudiantes
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label>
                  Docente <span className="text-red-600">*</span>
                </Label>
                <Select 
                  value={docenteSeleccionado?.toString() || ''} 
                  onValueChange={(v) => setDocenteSeleccionado(v ? parseInt(v) : '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {docentes.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-slate-500">No hay docentes disponibles</div>
                    ) : docentes.map(d => (
                      <SelectItem key={d.id} value={d.id?.toString() || ''}>
                        {d.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>
                  Espacio Físico <span className="text-red-600">*</span>
                </Label>
                <Select 
                  value={espacioSeleccionado?.toString() || ''} 
                  onValueChange={(v) => setEspacioSeleccionado(v ? parseInt(v) : '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar espacio" />
                  </SelectTrigger>
                  <SelectContent>
                    {espaciosDisponibles.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-slate-500">
                        {cantidadEstudiantes && cantidadEstudiantes > 0
                          ? `No hay espacios con capacidad para ${cantidadEstudiantes} estudiantes`
                          : 'No hay espacios disponibles'}
                      </div>
                    ) : espaciosDisponibles.map(e => (
                      <SelectItem key={e.id} value={e.id?.toString() || ''}>
                        {e.nombre} - Capacidad: {e.capacidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selección de días */}
            <div>
              <Label className="mb-3 block">
                Días de Clase <span className="text-red-600">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {diasSemana.map(dia => (
                  <label
                    key={dia}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${diasSeleccionados.includes(dia)
                        ? 'border-red-600 bg-red-50'
                        : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={diasSeleccionados.includes(dia)}
                      onChange={() => handleToggleDia(dia)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-slate-900">{dia}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Horarios por día */}
            {diasSeleccionados.length > 0 && (
              <div className="space-y-4">
                <Label>Horarios por Día</Label>
                {diasSeleccionados.map(dia => (
                  <div key={dia} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-slate-900 mb-3">{dia}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Hora de Inicio</Label>
                        <Input
                          type="time"
                          value={horasPorDia[dia]?.inicio || ''}
                          onChange={(e) => handleHoraChange(dia, 'inicio', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hora de Fin</Label>
                        <Input
                          type="time"
                          value={horasPorDia[dia]?.fin || ''}
                          onChange={(e) => handleHoraChange(dia, 'fin', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mensaje de ayuda */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="mb-1">
                  El sistema validará automáticamente conflictos de horario con:
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Disponibilidad del docente</li>
                  <li>Disponibilidad del espacio físico</li>
                  <li>Horarios del mismo grupo</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModalAsignar(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarAsignacion}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Guardar Asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}