import {
  X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Button } from '../../../share/button';
import type { useEnviarFactura } from '../../../hooks/financiero/proveedor/useEnviarFactura';

interface Props {
  hook: ReturnType<typeof useEnviarFactura>;
}

/** Confirmación de eliminar un documento. */
export function EliminarDocumentoDialog({ hook }: Props) {
  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    docToDelete,
    setDocToDelete,
    deletingDoc,
    confirmRemoveDoc,
  } = hook;

  return (
  <Dialog
    open={deleteDialogOpen}
    onOpenChange={(open) => {
      setDeleteDialogOpen(open);
      if (!open) setDocToDelete(null);
    }}
  >
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg">
          <X className="w-5 h-5 text-red-600" />
          Eliminar documento
        </DialogTitle>
        <DialogDescription>
          {docToDelete
            ? `¿Deseas eliminar el documento "${docToDelete.existingName || docToDelete.file?.name || docToDelete.type}"? Esta acción no se puede deshacer.`
            : '¿Deseas eliminar este documento? Esta acción no se puede deshacer.'}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deletingDoc}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={() => void confirmRemoveDoc()} disabled={deletingDoc}>
          {deletingDoc ? 'Eliminando...' : 'Eliminar documento'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  );
}
