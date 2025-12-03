import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Checkbox } from '../../share/checkbox';
import { Plus, Clock, AlertCircle, Trash2, CheckCircle, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { NotificationBanner } from '../../share/notificationBanner';
import { useHorariosAcademicos, PERIODO_FIJO, dias } from '../../hooks/gestionAcademica/useHorariosAcademicos';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function HorariosAcademicos() {
  const isMobile = useIsMobile();
  const {
    facultades,
    programas,
    asignaturas,
    espacios,
    docentes,
    facultadSeleccionada,
    programaSeleccionado,
    semestreSeleccionado,
    grupoSeleccionado,
    setGrupoSeleccionado,
    horarioActual,
    showCreateDialog, setShowCreateDialog,
    showDeleteDialog, setShowDeleteDialog,
    showAddAsignaturaDialog, setShowAddAsignaturaDialog,
    nuevaAsignatura, setNuevaAsignatura,
    nuevoHorarioForm, setNuevoHorarioForm,
    gruposDisponibles,
    programasFiltrados,
    semestresDisponibles,
    asignaturasDelSemestre,
    horarioAMostrar,
    mostrarHorario,
    handleFacultadChange,
    handleProgramaChange,
    handleSemestreChange,
    handleOpenCreateDialog,
    handleCreateHorario,
    handleOpenDeleteDialog,
    handleDeleteHorario,
    handleOpenAddAsignatura,
    handleAddAsignatura,
    handleDeleteAsignatura,
    getHorarioGridData,
    calcularFilasOcupadas,
    notification
  } = useHorariosAcademicos();

  // Renderizar grid de horario
  const renderHorarioGrid = () => {
    if (!horarioAMostrar) {
      return (
        <div className="text-center py-16">
          <Clock className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Seleccione todos los filtros para visualizar el horario</p>
        </div>
      );
    }

    const gridData = getHorarioGridData();
    if (!gridData) return null;
    const { franjasHorarias, celdasOcupadas } = gridData;

    return (
      <div className="space-y-4">
        {/* Botones de acción del horario */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-slate-900 dark:text-slate-100">
              Horario: {programas.find(p => p.id === horarioAMostrar.programaId)?.nombre} - Semestre {horarioAMostrar.semestre} - Grupo {horarioAMostrar.grupoNombre}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">Periodo: {PERIODO_FIJO}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleOpenAddAsignatura}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!facultadSeleccionada || !programaSeleccionado || !semestreSeleccionado || !grupoSeleccionado}
            >
              <Plus className="w-4 h-4 mr-2" />
              Asignar Asignatura
            </Button>
            <Button
              onClick={handleOpenDeleteDialog}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Horario
            </Button>
          </div>
        </div>

        {/* Grid del horario */}
        <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700">
          <div className="min-w-[800px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 min-w-[120px]">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <p className="text-slate-700 dark:text-slate-300">Hora</p>
                    </div>
                  </th>
                  {dias.map((dia) => (
                    <th key={dia} className="p-4 bg-gradient-to-br from-red-600 to-red-700 text-white border border-red-700">
                      <p className="tracking-wide">{dia}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {franjasHorarias.map((franja, franjaIdx) => (
                  <tr key={`franja-${franjaIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="p-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 align-top">
                      <p className="text-slate-700 dark:text-slate-300 text-center whitespace-nowrap">{franja.texto}</p>
                    </td>
                    {dias.map(dia => {
                      const key = `${dia}-${franjaIdx}`;
                      const celdaInfo = celdasOcupadas.get(key);

                      // Si la celda está ocupada pero no es el inicio, no renderizar
                      if (celdaInfo && !celdaInfo.isStart) {
                        return null;
                      }

                      // Si es el inicio de una asignatura, renderizar con rowSpan
                      if (celdaInfo && celdaInfo.isStart) {
                        const asignatura = celdaInfo.asignatura;
                        const filasOcupadas = calcularFilasOcupadas(asignatura, franjasHorarias);

                        return (
                          <td
                            key={key}
                            rowSpan={filasOcupadas}
                            className="p-0 border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 align-top"
                          >
                            <motion.div
                              className="p-3 h-full space-y-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              whileHover={{ scale: 1.01 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="space-y-1.5">
                                <p className="text-slate-900 dark:text-slate-100 leading-tight">
                                  {asignatura.asignaturaNombre}
                                </p>
                                <div className="space-y-0.5 text-sm">
                                  <p className="text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                    <span className="text-xs">📍</span>
                                    {asignatura.espacioNombre}
                                  </p>
                                  <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <span className="text-xs">👤</span>
                                    {(() => {
                                      // Si existe docenteId, buscar el nombre
                                      if ((asignatura as any).docenteId) {
                                        const docente = docentes.find(d => d.id === (asignatura as any).docenteId);
                                        return docente?.nombre || asignatura.docente;
                                      }
                                      return asignatura.docente;
                                    })()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-200 dark:border-blue-800">
                                <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5 hover:bg-blue-700">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {asignatura.horaInicio}-{asignatura.horaFin}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950"
                                  onClick={() => handleDeleteAsignatura(asignatura.id)}
                                  title="Eliminar asignatura"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </motion.div>
                          </td>
                        );
                      }

                      // Celda vacía
                      return (
                        <td
                          key={key}
                          className="p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors min-h-[80px] align-top"
                        >
                          <div className="h-16"></div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      <NotificationBanner notification={notification} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Gestión de Horarios Académicos</h1>
          <p className="text-slate-600 dark:text-slate-400">Crea y administra los horarios de clases por programa, grupo y espacio</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            Periodo {PERIODO_FIJO}
          </Badge>
          <Button
            onClick={handleOpenCreateDialog}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Horario
          </Button>
        </div>
      </div>

      {/* Filtros en cascada */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Filtros de Visualización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro 1: Facultad */}
            <div>
              <Select value={facultadSeleccionada} onValueChange={handleFacultadChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Facultad" />
                </SelectTrigger>
                <SelectContent>
                  {facultades.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro 2: Programa */}
            <div>
              <Select
                value={programaSeleccionado}
                onValueChange={handleProgramaChange}
                disabled={!facultadSeleccionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Programa" />
                </SelectTrigger>
                <SelectContent>
                  {programasFiltrados.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro 3: Semestre */}
            <div>
              <Select
                value={semestreSeleccionado}
                onValueChange={handleSemestreChange}
                disabled={!programaSeleccionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semestre" />
                </SelectTrigger>
                <SelectContent>
                  {semestresDisponibles.map(s => (
                    <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro 4: Grupo */}
            <div>
              <Select
                value={grupoSeleccionado}
                onValueChange={setGrupoSeleccionado}
                disabled={!semestreSeleccionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  {gruposDisponibles.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!mostrarHorario && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-yellow-900 dark:text-yellow-100">
                  Seleccione todos los filtros para gestionar el horario (asignar, modificar o eliminar asignaturas)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Horario Grid */}
      {mostrarHorario && (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            {renderHorarioGrid()}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 rounded"></div>
          <span>Clase programada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"></div>
          <span>Espacio libre</span>
        </div>
      </div>

      {/* Dialog: Crear Horario */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Horario</DialogTitle>
            <DialogDescription>
              Complete la información del grupo para crear un horario. El sistema validará que no existan duplicados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Facultad *</Label>
                <Select value={nuevoHorarioForm.facultadId} onValueChange={(v) => setNuevoHorarioForm({ ...nuevoHorarioForm, facultadId: v, programaId: '', semestre: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar facultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultades.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Programa *</Label>
                <Select
                  value={nuevoHorarioForm.programaId}
                  onValueChange={(v) => setNuevoHorarioForm({ ...nuevoHorarioForm, programaId: v, semestre: '' })}
                  disabled={!nuevoHorarioForm.facultadId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar programa" />
                  </SelectTrigger>
                  <SelectContent>
                    {programas.filter(p => p.facultadId === nuevoHorarioForm.facultadId).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Semestre *</Label>
              <Select
                value={nuevoHorarioForm.semestre}
                onValueChange={(v) => setNuevoHorarioForm({ ...nuevoHorarioForm, semestre: v })}
                disabled={!nuevoHorarioForm.programaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar semestre" />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set(asignaturas.filter(a => a.programaId === nuevoHorarioForm.programaId).map(a => a.semestre))].sort((a, b) => a - b).map(s => (
                    <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {nuevoHorarioForm.semestre && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  </div>
                  <div>
                    <p className="text-blue-900">
                      <strong>Creación automática de grupo</strong>
                    </p>
                    <p className="text-blue-700 mt-1">
                      El sistema creará automáticamente el siguiente grupo disponible para el semestre {nuevoHorarioForm.semestre}
                      (ejemplo: {nuevoHorarioForm.semestre}A, {nuevoHorarioForm.semestre}B, etc.)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateHorario} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              Crear Horario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Agregar Asignatura */}
      <Dialog open={showAddAsignaturaDialog} onOpenChange={setShowAddAsignaturaDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Asignatura al Horario</DialogTitle>
            <DialogDescription>
              Solo se mostrarán asignaturas del semestre {semestreSeleccionado} correspondiente al grupo seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Asignatura *</Label>
              <Select value={nuevaAsignatura.asignaturaId} onValueChange={(v) => setNuevaAsignatura({ ...nuevaAsignatura, asignaturaId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {asignaturasDelSemestre.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.nombre} ({a.creditos} créditos)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Días de la Semana *
              </Label>
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                {dias.map(dia => (
                  <div key={dia} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dia-${dia}`}
                      checked={nuevaAsignatura.dias.includes(dia)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNuevaAsignatura({
                            ...nuevaAsignatura,
                            dias: [...nuevaAsignatura.dias, dia]
                          });
                        } else {
                          setNuevaAsignatura({
                            ...nuevaAsignatura,
                            dias: nuevaAsignatura.dias.filter(d => d !== dia)
                          });
                        }
                      }}
                    />
                    <label
                      htmlFor={`dia-${dia}`}
                      className="text-sm cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      {dia}
                    </label>
                  </div>
                ))}
              </div>
              {nuevaAsignatura.dias.length > 0 && (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {nuevaAsignatura.dias.length} día(s) seleccionado(s): {nuevaAsignatura.dias.join(', ')}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora Inicio *</Label>
                <Input
                  type="time"
                  value={nuevaAsignatura.horaInicio}
                  onChange={(e) => setNuevaAsignatura({ ...nuevaAsignatura, horaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora Fin *</Label>
                <Input
                  type="time"
                  value={nuevaAsignatura.horaFin}
                  onChange={(e) => setNuevaAsignatura({ ...nuevaAsignatura, horaFin: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Docente *</Label>
              <Input
                placeholder="Nombre completo del docente"
                value={nuevaAsignatura.docente}
                onChange={(e) => setNuevaAsignatura({ ...nuevaAsignatura, docente: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Espacio *</Label>
              <Select value={nuevaAsignatura.espacioId} onValueChange={(v) => setNuevaAsignatura({ ...nuevaAsignatura, espacioId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar espacio" />
                </SelectTrigger>
                <SelectContent>
                  {espacios.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nombre} - Capacidad: {e.capacidad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-slate-600 dark:text-slate-400">
                <strong>Validaciones automáticas:</strong>
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 mt-2">
                <li>No solapamiento de horarios del grupo</li>
                <li>No asignación duplicada de espacios</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAsignaturaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAsignatura} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              Agregar Asignatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Eliminar Horario */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar este horario completo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {horarioActual && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <p className="text-slate-900 dark:text-slate-100">
                <strong>Programa:</strong> {programas.find(p => p.id === horarioActual.programaId)?.nombre}
              </p>
              <p className="text-slate-900 dark:text-slate-100">
                <strong>Semestre:</strong> {horarioActual.semestre}
              </p>
              <p className="text-slate-900 dark:text-slate-100">
                <strong>Grupo:</strong> {horarioActual.grupoNombre}
              </p>
              <p className="text-slate-900 dark:text-slate-100">
                <strong>Asignaturas:</strong> {horarioActual.asignaturas.length}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteHorario}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
