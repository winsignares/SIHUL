import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { RecursosEspacio } from './RecursosEspacio';
import type { useEspaciosFisicos } from '../../hooks/useEspaciosFisicos';

type EspaciosFisicos = ReturnType<typeof useEspaciosFisicos>;

/** Diálogo para editar un espacio. */
export function DialogoEditarEspacio({
  espacioForm,
  setEspacioForm,
  tiposParaFormulario,
  sedesParaFormulario,
  showEditDialog,
  setShowEditDialog,
  resetForm,
  handleEditEspacio,
  mostrandoRecursos,
  setMostrandoRecursos,
  recursosDisponibles,
  recursosAgregados,
  setRecursosAgregados,
  recursoSeleccionado,
  setRecursoSeleccionado
}: Pick<EspaciosFisicos, 'espacioForm' | 'setEspacioForm' | 'tiposParaFormulario' | 'sedesParaFormulario' | 'showEditDialog' | 'setShowEditDialog' | 'resetForm' | 'handleEditEspacio' | 'mostrandoRecursos' | 'setMostrandoRecursos' | 'recursosDisponibles' | 'recursosAgregados' | 'setRecursosAgregados' | 'recursoSeleccionado' | 'setRecursoSeleccionado'>) {
  return (
    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">Editar Espacio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre *</Label>
              <Input
                id="edit-nombre"
                value={espacioForm.nombre}
                onChange={(e) => setEspacioForm({ ...espacioForm, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-capacidad">Capacidad *</Label>
              <Input
                id="edit-capacidad"
                type="number"
                min="1"
                value={espacioForm.capacidad}
                onChange={(e) => setEspacioForm({ ...espacioForm, capacidad: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tipo">Tipo *</Label>
              <Select
                value={espacioForm.tipo_id}
                onValueChange={(value) => setEspacioForm({ ...espacioForm, tipo_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposParaFormulario.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id?.toString() || ''}>{tipo.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sede">Sede *</Label>
              <Select
                value={espacioForm.sede_id}
                onValueChange={(value) => setEspacioForm({ ...espacioForm, sede_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sede" />
                </SelectTrigger>
                <SelectContent>
                  {sedesParaFormulario.map(sede => (
                    <SelectItem key={sede.id} value={sede.id?.toString() || ''}>{sede.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-ubicacion">Ubicación (opcional)</Label>
            <Input
              id="edit-ubicacion"
              placeholder="Ej: Edificio A, Pasillo 2"
              value={espacioForm.ubicacion}
              onChange={(e) => setEspacioForm({ ...espacioForm, ubicacion: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-estado">Estado *</Label>
            <Select
              value={espacioForm.estado}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onValueChange={(value: any) => setEspacioForm({ ...espacioForm, estado: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Disponible">Disponible</SelectItem>
                <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="No Disponible">No Disponible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recursos Necesarios */}
          <RecursosEspacio
              mostrandoRecursos={mostrandoRecursos}
              setMostrandoRecursos={setMostrandoRecursos}
              recursosDisponibles={recursosDisponibles}
              recursosAgregados={recursosAgregados}
              setRecursosAgregados={setRecursosAgregados}
              recursoSeleccionado={recursoSeleccionado}
              setRecursoSeleccionado={setRecursoSeleccionado}
            />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              setShowEditDialog(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEditEspacio}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          >
            Actualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
