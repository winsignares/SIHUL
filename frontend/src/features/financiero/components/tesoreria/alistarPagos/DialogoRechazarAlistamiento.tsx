import { Button } from '../../../../../components/ui/button';
import { Label } from '../../../../../components/ui/label';
import { Textarea } from '../../../../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../../../components/ui/dialog';
import type { useAlistarPagos } from '../../../hooks/tesoreria/useAlistarPagos';

type Gestion = ReturnType<typeof useAlistarPagos>;

/** Diálogo para rechazar el alistamiento de un pago. */
export function DialogoRechazarAlistamiento({ mostrarDialogRechazar, setMostrarDialogRechazar, motivoRechazo, setMotivoRechazo, isProcessing, rechazarAlistamiento }: Pick<Gestion, 'mostrarDialogRechazar' | 'setMostrarDialogRechazar' | 'motivoRechazo' | 'setMotivoRechazo' | 'isProcessing' | 'rechazarAlistamiento'>) {
  return (
    <Dialog open={mostrarDialogRechazar} onOpenChange={setMostrarDialogRechazar}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-800">Rechazar Alistamiento de Pago</DialogTitle>
          <DialogDescription>Registre la inconsistencia para devolver el tramite con la observacion correspondiente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="motivo">Observacion de rechazo</Label>
          <Textarea id="motivo" value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Detalle de la inconsistencia detectada (mínimo 10 caracteres)" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setMostrarDialogRechazar(false)}>Cancelar</Button>
          <Button onClick={rechazarAlistamiento} disabled={isProcessing} className="bg-red-600 hover:bg-red-700">
            {isProcessing ? 'Rechazando...' : 'Confirmar rechazo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
