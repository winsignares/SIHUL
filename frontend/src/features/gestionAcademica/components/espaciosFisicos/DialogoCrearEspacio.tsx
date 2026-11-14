import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { RecursosEspacio } from './RecursosEspacio';
import type { useEspaciosFisicos } from '../../hooks/useEspaciosFisicos';

type EspaciosFisicos = ReturnType<typeof useEspaciosFisicos>;

/** Diálogo para registrar un nuevo espacio. */
export function DialogoCrearEspacio({
  espacioForm,
  setEspacioForm,
  tiposParaFormulario,
  sedesParaFormulario,
  showCreateDialog,
  setShowCreateDialog,
  resetForm,
  handleCreateEspacio,
  mostrandoRecursos,
  setMostrandoRecursos,
  recursosDisponibles,
  recursosAgregados,
  setRecursosAgregados,
  recursoSeleccionado,
  setRecursoSeleccionado
}: Pick<EspaciosFisicos, 'espacioForm' | 'setEspacioForm' | 'tiposParaFormulario' | 'sedesParaFormulario' | 'showCreateDialog' | 'setShowCreateDialog' | 'resetForm' | 'handleCreateEspacio' | 'mostrandoRecursos' | 'setMostrandoRecursos' | 'recursosDisponibles' | 'recursosAgregados' | 'setRecursosAgregados' | 'recursoSeleccionado' | 'setRecursoSeleccionado'>) {
  return (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">Registrar Nuevo Espacio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Aula 101"
                value={espacioForm.nombre}
                onChange={(e) => setEspacioForm({ ...espacioForm, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacidad">Capacidad *</Label>
              <Input
                id="capacidad"
                type="number"
                min="1"
                placeholder="Ej: 40"
                value={espacioForm.capacidad}
                onChange={(e) => setEspacioForm({ ...espacioForm, capacidad: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
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
              <Label htmlFor="sede">Sede *</Label>
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
            <Label htmlFor="ubicacion">Ubicación (opcional)</Label>
            <Input
              id="ubicacion"
              placeholder="Ej: Edificio A, Pasillo 2"
              value={espacioForm.ubicacion}
              onChange={(e) => setEspacioForm({ ...espacioForm, ubicacion: e.target.value })}
            />
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
              setShowCreateDialog(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateEspacio}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
