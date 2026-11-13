import { Button } from '../../../../../components/ui/button';
import { Textarea } from '../../../../../components/ui/textarea';
import { Label } from '../../../../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../../../components/ui/dialog';
import { XCircle } from 'lucide-react';
import type { useEnviarDireccionFinanciera } from '../../../hooks/tesoreria/useEnviarDireccionFinanciera';

type Gestion = ReturnType<typeof useEnviarDireccionFinanciera>;

/** Diálogo para rechazar una factura antes de enviarla. */
export function DialogoRechazarEnvio({ mostrarDialogRechazar, setMostrarDialogRechazar, motivoRechazo, setMotivoRechazo, isProcessing, rechazarEnvio }: Pick<Gestion, 'mostrarDialogRechazar' | 'setMostrarDialogRechazar' | 'motivoRechazo' | 'setMotivoRechazo' | 'isProcessing' | 'rechazarEnvio'>) {
  return (
    <Dialog open={mostrarDialogRechazar} onOpenChange={setMostrarDialogRechazar}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <XCircle className="h-5 w-5 text-red-600" />
            Rechazar envio
          </DialogTitle>
          <DialogDescription>Describe por que la factura no se enviara a Direccion Financiera.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="motivo-rechazo" className="text-sm font-semibold text-slate-700">Motivo del rechazo</Label>
          <Textarea
            id="motivo-rechazo"
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            placeholder="Explica brevemente la inconsistencia encontrada"
            className="min-h-[140px]"
          />
          <p className="text-xs text-slate-500">El comentario se registrara en tesoreria para seguimiento.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setMostrarDialogRechazar(false)}>Cancelar</Button>
          <Button onClick={rechazarEnvio} disabled={isProcessing} className="bg-red-600 text-white hover:bg-red-700">
            {isProcessing ? 'Registrando...' : 'Confirmar rechazo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
