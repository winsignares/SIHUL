import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import type { useEspaciosFisicos } from '../../hooks/useEspaciosFisicos';

type EspaciosFisicos = ReturnType<typeof useEspaciosFisicos>;

/** Diálogo para registrar un tipo de espacio. */
export function DialogoTipoEspacio({
  showCreateTipoDialog,
  setShowCreateTipoDialog,
  tipoEspacioForm,
  setTipoEspacioForm,
  resetTipoEspacioForm,
  handleCreateTipoEspacio
}: Pick<EspaciosFisicos, 'showCreateTipoDialog' | 'setShowCreateTipoDialog' | 'tipoEspacioForm' | 'setTipoEspacioForm' | 'resetTipoEspacioForm' | 'handleCreateTipoEspacio'>) {
  return (
    <Dialog open={showCreateTipoDialog} onOpenChange={setShowCreateTipoDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">Registrar Tipo de Espacio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tipo-nombre">Nombre *</Label>
            <Input
              id="tipo-nombre"
              placeholder="Ej: Auditorio"
              value={tipoEspacioForm.nombre}
              onChange={(e) => setTipoEspacioForm({ ...tipoEspacioForm, nombre: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo-descripcion">Descripción</Label>
            <Input
              id="tipo-descripcion"
              placeholder="Descripción opcional"
              value={tipoEspacioForm.descripcion}
              onChange={(e) => setTipoEspacioForm({ ...tipoEspacioForm, descripcion: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateTipoDialog(false);
              resetTipoEspacioForm();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateTipoEspacio}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            Guardar Tipo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
