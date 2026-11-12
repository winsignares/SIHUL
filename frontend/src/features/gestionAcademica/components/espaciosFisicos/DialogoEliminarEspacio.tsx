import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import type { useEspaciosFisicos } from '../../hooks/useEspaciosFisicos';

type EspaciosFisicos = ReturnType<typeof useEspaciosFisicos>;

/** Confirmación para eliminar un espacio. */
export function DialogoEliminarEspacio({
  showDeleteDialog,
  setShowDeleteDialog,
  handleDeleteEspacio
}: Pick<EspaciosFisicos, 'showDeleteDialog' | 'setShowDeleteDialog' | 'handleDeleteEspacio'>) {
  return (
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">Eliminar Espacio</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-slate-600 dark:text-slate-400">
            ¿Estás seguro de que deseas eliminar este espacio? Esta acción no se puede deshacer.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteEspacio}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
