import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { SearchableSelect } from '../../../../components/ui/searchableSelect';
import {
  Clock,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { useCentroHorarios } from '../../hooks/useCentroHorarios';

interface Props {
  hook: ReturnType<typeof useCentroHorarios>;
}

/** Modales de detalles, edición y eliminación de grupo del Centro de Horarios. */
export function HorariosModales({ hook }: Props) {
  const {
    espacios,
    docentes,
    showEditModal,
    setShowEditModal,
    horarioEditar,
    setHorarioEditar,
    showDetallesModal,
    setShowDetallesModal,
    grupoDetalles,
    generarHoras,
    obtenerClaseEnHora,
    handleGuardarEdicion,
    showDeleteGrupoModal,
    setShowDeleteGrupoModal,
    grupoAEliminar,
    setGrupoAEliminar,
    eliminandoGrupo,
    progresoEliminacion,
    handleEliminarGrupoCompleto,
    dias,
  } = hook;

  return (
    <>
  <Dialog open={showDetallesModal} onOpenChange={setShowDetallesModal}>
    <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-red-600" />
          Horario Completo del Grupo {grupoDetalles?.grupo}
        </DialogTitle>
      </DialogHeader>
      {grupoDetalles && (
        <div className="space-y-6 py-4">
          {/* Información del Grupo */}
          <Card className="bg-gradient-to-r from-red-50 to-yellow-50 border-red-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-600 text-sm mb-1">Programa</p>
                  <p className="text-slate-900">{grupoDetalles.horarios[0]?.programa_nombre || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-sm mb-1">Grupo</p>
                  <Badge className="bg-red-600">{grupoDetalles.grupo}</Badge>
                </div>
                <div>
                  <p className="text-slate-600 text-sm mb-1">Semestre</p>
                  <p className="text-slate-900">{grupoDetalles.semestre}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid Semanal - Estilo ROJO AsignacionAutomatica */}
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-slate-900">
                    <th className="border-2 border-slate-300 p-4 text-white w-32">
                      <Clock className="w-5 h-5 mx-auto mb-1" />
                      Hora
                    </th>
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dia) => (
                      <th key={dia} className="border-2 border-slate-300 p-4 text-white">
                        {dia}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {generarHoras().map((hora) => {
                    // Convertir hora a rango (ej: "6:00" -> "6:00 - 7:00")
                    const horaNum = parseInt(hora.split(':')[0]);
                    const horaFin = horaNum + 1;
                    const horaRango = `${hora} - ${horaFin.toString().padStart(2, '0')}:00`;
                  
                    return (
                    <tr key={hora} className="hover:bg-slate-50 transition-colors">
                      <td className="border-2 border-slate-300 p-3 bg-slate-100 text-center text-slate-700 text-xs font-medium">
                        <div>{horaRango}</div>
                      </td>
                      {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => {
                        const clase = obtenerClaseEnHora(dia, hora, grupoDetalles.horarios);
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
                                    <p className="text-sm mb-1">{clase.asignatura_nombre}</p>
                                    <p className="text-xs text-yellow-200">{clase.docente_nombre}</p>
                                  </div>
                                  <div className="flex items-center justify-center gap-2 bg-white/10 rounded-md p-1.5">
                                    <MapPin className="w-4 h-4 text-yellow-300" />
                                    <span className="text-sm">{clase.espacio_nombre}</span>
                                  </div>
                                  <div className="text-xs text-yellow-100 mt-1">
                                    {clase.hora_inicio} - {clase.hora_fin}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex items-center justify-center gap-6 text-sm">
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
      <DialogFooter>
        <Button onClick={() => setShowDetallesModal(false)} className="bg-red-600 hover:bg-red-700">
          Cerrar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* Modal de Edición */}
  <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Edit className="w-5 h-5 text-orange-600" />
          Editar Horario
        </DialogTitle>
      </DialogHeader>
      {horarioEditar && (
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Asignatura</Label>
              <Input
                value={horarioEditar.asignatura_nombre || ''}
                disabled
                className="bg-slate-100"
              />
            </div>
            <div>
              <Label>Grupo</Label>
              <Input
                value={horarioEditar.grupo_nombre || ''}
                disabled
                className="bg-slate-100"
              />
            </div>
            <div>
              <Label>Docente</Label>
              <SearchableSelect
                items={docentes}
                value={horarioEditar.docente_id}
                onSelect={(docente) => setHorarioEditar({ 
                  ...horarioEditar, 
                  docente_id: docente.id,
                  docente_nombre: docente.nombre
                })}
                getItemId={(docente) => docente.id}
                getItemLabel={(docente) => docente.nombre}
                getItemSecondary={(docente) => docente.correo}
                placeholder="Seleccionar docente..."
                searchPlaceholder="Buscar docente..."
                emptyMessage="No se encontró ningún docente."
                clearable
                onClear={() => setHorarioEditar({ 
                  ...horarioEditar, 
                  docente_id: null,
                  docente_nombre: ''
                })}
              />
            </div>
            <div>
              <Label>Día</Label>
              <Select
                value={horarioEditar.dia_semana}
                onValueChange={(v) => setHorarioEditar({ ...horarioEditar, dia_semana: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dias.map(d => (
                    <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hora Inicio</Label>
              <Input
                type="time"
                value={horarioEditar.hora_inicio}
                onChange={(e) => setHorarioEditar({ ...horarioEditar, hora_inicio: e.target.value })}
              />
            </div>
            <div>
              <Label>Hora Fin</Label>
              <Input
                type="time"
                value={horarioEditar.hora_fin}
                onChange={(e) => setHorarioEditar({ ...horarioEditar, hora_fin: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Espacio</Label>
              <SearchableSelect
                items={espacios}
                value={horarioEditar.espacio_id}
                onSelect={(espacio) => setHorarioEditar({ 
                  ...horarioEditar, 
                  espacio_id: espacio.id ?? null,
                  espacio_nombre: espacio.nombre
                })}
                getItemId={(espacio) => espacio.id ?? 0}
                getItemLabel={(espacio) => espacio.nombre}
                getItemSecondary={(espacio) => `Capacidad: ${espacio.capacidad}`}
                placeholder="Seleccionar espacio..."
                searchPlaceholder="Buscar espacio..."
                emptyMessage="No se encontró ningún espacio."
              />
            </div>
          </div>
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={() => setShowEditModal(false)}>
          Cancelar
        </Button>
        <Button
          onClick={handleGuardarEdicion}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* Modal de Confirmación de Eliminación de Grupo */}
  <Dialog open={showDeleteGrupoModal} onOpenChange={setShowDeleteGrupoModal}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3 text-red-600">
          <motion.div
            animate={{ rotate: eliminandoGrupo ? 360 : 0 }}
            transition={{ duration: 2, repeat: eliminandoGrupo ? Infinity : 0, ease: "linear" }}
          >
            <Trash2 className="w-6 h-6" />
          </motion.div>
          {eliminandoGrupo ? 'Eliminando Grupo...' : '¿Eliminar Grupo Completo?'}
        </DialogTitle>
      </DialogHeader>

      {grupoAEliminar && (
        <div className="space-y-6 py-4">
          {!eliminandoGrupo ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Advertencia */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 rounded-full p-2 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-900 mb-2">Esta acción no se puede deshacer</h4>
                    <p className="text-red-700 text-sm">
                      Se eliminarán <strong>{grupoAEliminar.horarios.length} clases</strong> del grupo <strong>{grupoAEliminar.grupo}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del Grupo */}
              <Card className="border-slate-200">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Programa</p>
                      <p className="text-slate-900">{grupoAEliminar.horarios[0]?.programa_nombre}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Semestre</p>
                      <Badge className="bg-slate-600">{grupoAEliminar.semestre}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Grupo</p>
                    <Badge className="bg-red-600 text-lg px-3 py-1">{grupoAEliminar.grupo}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Asignaturas */}
              <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-lg border border-slate-200 p-3">
                <p className="text-slate-600 text-xs mb-2">Asignaturas a eliminar:</p>
                <div className="space-y-1">
                  {grupoAEliminar.horarios.map((horario, idx) => (
                    <motion.div
                      key={horario.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-2 text-sm text-slate-700 bg-white rounded px-2 py-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-slate-400" />
                      <span>{horario.asignatura_nombre}</span>
                      <span className="text-slate-400 text-xs ml-auto">
                        {horario.dia_semana.charAt(0).toUpperCase() + horario.dia_semana.slice(1)} {horario.hora_inicio}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Animación de Progreso */}
              <div className="flex flex-col items-center justify-center py-8">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="mb-6"
                >
                  <Trash2 className="w-16 h-16 text-red-600" />
                </motion.div>

                <h3 className="text-slate-900 mb-2">Eliminando clases...</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Por favor espera mientras se eliminan las {grupoAEliminar.horarios.length} clases
                </p>

                {/* Barra de Progreso */}
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progresoEliminacion}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-end"
                  >
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </motion.div>
                </div>

                {/* Porcentaje */}
                <motion.p
                  key={progresoEliminacion}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl mt-4 text-red-600"
                >
                  {progresoEliminacion}%
                </motion.p>

                {/* Clases Eliminadas */}
                <p className="text-slate-500 text-sm mt-2">
                  {Math.round((progresoEliminacion / 100) * grupoAEliminar.horarios.length)} de {grupoAEliminar.horarios.length} clases eliminadas
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {!eliminandoGrupo && (
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteGrupoModal(false);
              setGrupoAEliminar(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEliminarGrupoCompleto}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Sí, Eliminar Grupo
          </Button>
        </DialogFooter>
      )}
    </DialogContent>
  </Dialog>
    </>
  );
}
