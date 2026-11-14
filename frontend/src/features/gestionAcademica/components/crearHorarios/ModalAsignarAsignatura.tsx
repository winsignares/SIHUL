import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { SearchableSelect } from '../../../../components/ui/searchableSelect';
import { BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { useCrearHorarios } from '../../hooks/useCrearHorarios';

type CrearHorarios = ReturnType<typeof useCrearHorarios>;

type PropsModal = Pick<CrearHorarios,
  | 'showModalAsignar' | 'setShowModalAsignar' | 'role' | 'grupoSeleccionado'
  | 'asignaturaSeleccionada' | 'setAsignaturaSeleccionada'
  | 'cantidadEstudiantes' | 'setCantidadEstudiantes'
  | 'docentes' | 'docenteSeleccionado' | 'setDocenteSeleccionado'
  | 'espacioSeleccionado' | 'setEspacioSeleccionado'
  | 'diasSemana' | 'diasSeleccionados' | 'handleToggleDia'
  | 'horasPorDia' | 'handleHoraChange' | 'handleGuardarAsignacion'
> & {
  /** Asignaturas del programa y semestre del grupo. */
  asignaturasFiltradas: ReturnType<CrearHorarios['getAsignaturasByProgramaYSemestre']>;
  /** Espacios con capacidad para la cantidad de estudiantes indicada. */
  espaciosDisponibles: ReturnType<CrearHorarios['getEspaciosDisponibles']>;
};

/** Modal para asignar una asignatura (o solicitar un espacio) al grupo. */
export function ModalAsignarAsignatura({
  showModalAsignar, setShowModalAsignar, role, grupoSeleccionado,
  asignaturaSeleccionada, setAsignaturaSeleccionada,
  cantidadEstudiantes, setCantidadEstudiantes,
  docentes, docenteSeleccionado, setDocenteSeleccionado,
  espacioSeleccionado, setEspacioSeleccionado,
  diasSemana, diasSeleccionados, handleToggleDia,
  horasPorDia, handleHoraChange, handleGuardarAsignacion,
  asignaturasFiltradas, espaciosDisponibles
}: PropsModal) {
  return (
      <Dialog open={showModalAsignar} onOpenChange={setShowModalAsignar}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <BookOpen className="w-5 h-5 text-red-600" />
              {role?.nombre === 'admin' ? 'Añadir Espacio' : 'Asignar Asignatura'} al Grupo {grupoSeleccionado?.nombre}
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
                <SearchableSelect
                  items={asignaturasFiltradas}
                  value={asignaturaSeleccionada}
                  onSelect={(asignatura) => setAsignaturaSeleccionada(asignatura.id || '')}
                  getItemId={(asignatura) => asignatura.id || 0}
                  getItemLabel={(asignatura) => asignatura.nombre}
                  getItemSecondary={(asignatura) => `${asignatura.codigo} • ${asignatura.creditos} créditos`}
                  placeholder="Seleccionar asignatura..."
                  searchPlaceholder="Buscar por nombre o código..."
                  emptyMessage={
                    grupoSeleccionado?.programa_nombre 
                      ? `No hay asignaturas asignadas al programa ${grupoSeleccionado.programa_nombre}`
                      : 'No hay asignaturas disponibles'
                  }
                  clearable
                  onClear={() => setAsignaturaSeleccionada('')}
                  filterFn={(asignatura, searchTerm) => {
                    return (
                      asignatura.nombre.toLowerCase().includes(searchTerm) ||
                      asignatura.codigo.toLowerCase().includes(searchTerm) ||
                      asignatura.creditos.toString().includes(searchTerm)
                    );
                  }}
                />
              </div>

              <div className="col-span-2">
                <Label>
                  Cantidad de Estudiantes <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="cantidad-estudiantes"
                  aria-label="Cantidad de estudiantes"
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
                <SearchableSelect
                  items={docentes}
                  value={docenteSeleccionado}
                  onSelect={(docente) => setDocenteSeleccionado(docente.id ?? '')}
                  getItemId={(docente) => docente.id ?? ''}
                  getItemLabel={(docente) => docente.nombre}
                  getItemSecondary={(docente) => docente.correo}
                  placeholder="Seleccionar docente..."
                  searchPlaceholder="Buscar docente..."
                  emptyMessage="No hay docentes disponibles."
                  clearable
                  onClear={() => setDocenteSeleccionado('')}
                />
              </div>

              <div className="col-span-2">
                <Label>
                  Espacio Físico <span className="text-red-600">*</span>
                </Label>
                <SearchableSelect
                  items={espaciosDisponibles}
                  value={espacioSeleccionado}
                  onSelect={(espacio) => setEspacioSeleccionado(espacio.id ?? '')}
                  getItemId={(espacio) => espacio.id ?? ''}
                  getItemLabel={(espacio) => espacio.nombre}
                  getItemSecondary={(espacio) => `Capacidad: ${espacio.capacidad} personas`}
                  placeholder="Seleccionar espacio..."
                  searchPlaceholder="Buscar espacio..."
                  emptyMessage={
                    cantidadEstudiantes && cantidadEstudiantes > 0
                      ? `No hay espacios con capacidad para ${cantidadEstudiantes} estudiantes`
                      : 'No hay espacios disponibles'
                  }
                  clearable
                  onClear={() => setEspacioSeleccionado('')}
                />
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
              {role?.nombre === 'admin' ? 'Añadir Espacio' : 'Realizar Solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
