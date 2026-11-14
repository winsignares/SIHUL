import { Button } from '../../../../../components/ui/button';
import { Textarea } from '../../../../../components/ui/textarea';
import { Label } from '../../../../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../../../components/ui/dialog';
import { Send } from 'lucide-react';
import type { useEnviarDireccionFinanciera } from '../../../hooks/tesoreria/useEnviarDireccionFinanciera';

type Gestion = ReturnType<typeof useEnviarDireccionFinanciera>;

/** Diálogo para enviar una factura a dirección financiera. */
export function DialogoEnviarDireccion({ facturaSeleccionada, mostrarDialogEnviar, setMostrarDialogEnviar, observaciones, setObservaciones, isProcessing, enviarDireccionFinanciera }: Pick<Gestion, 'facturaSeleccionada' | 'mostrarDialogEnviar' | 'setMostrarDialogEnviar' | 'observaciones' | 'setObservaciones' | 'isProcessing' | 'enviarDireccionFinanciera'>) {
  return (
    <Dialog open={mostrarDialogEnviar} onOpenChange={setMostrarDialogEnviar}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Send className="h-5 w-5 text-purple-600" />
            Enviar a Direccion Financiera
          </DialogTitle>
          <DialogDescription>Confirme el envio formal de la factura aprobada por auditoria.</DialogDescription>
        </DialogHeader>

        {facturaSeleccionada && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="text-slate-600">Factura: <span className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</span></p>
              <p className="text-slate-600">Proveedor: <span className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</span></p>
              <p className="text-slate-600">Monto: <span className="font-semibold text-green-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</span></p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs-envio" className="text-sm font-semibold text-slate-700">Observaciones de envio <span className="text-red-500">*</span></Label>
              <Textarea
                id="obs-envio"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones requeridas para Direccion Financiera"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setMostrarDialogEnviar(false)}>Cancelar</Button>
          <Button onClick={enviarDireccionFinanciera} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700">
            {isProcessing ? 'Enviando...' : 'Confirmar envio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
