import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Textarea } from '../../../../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog';
import { CheckCircle } from 'lucide-react';
import type { useRegistrarPagoAplicado } from '../../../hooks/tesoreria/useRegistrarPagoAplicado';

type Gestion = ReturnType<typeof useRegistrarPagoAplicado>;

/** Diálogo para registrar el pago aplicado de una factura. */
export function DialogoRegistrarPago({ isProcessing, facturaSeleccionada, mostrarDialogRegistrar, setMostrarDialogRegistrar, numeroTransaccion, setNumeroTransaccion, fechaPago, setFechaPago, archivoComprobante, observaciones, setObservaciones, registrarPago, onSelectComprobante }: Pick<Gestion, 'isProcessing' | 'facturaSeleccionada' | 'mostrarDialogRegistrar' | 'setMostrarDialogRegistrar' | 'numeroTransaccion' | 'setNumeroTransaccion' | 'fechaPago' | 'setFechaPago' | 'archivoComprobante' | 'observaciones' | 'setObservaciones' | 'registrarPago' | 'onSelectComprobante'>) {
  return (
    <Dialog open={mostrarDialogRegistrar} onOpenChange={setMostrarDialogRegistrar}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Registrar pago ejecutado
          </DialogTitle>
          <DialogDescription>Registre en el sistema el pago ya aplicado en el portal bancario externo.</DialogDescription>
        </DialogHeader>

        {facturaSeleccionada && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Factura</p>
                <p className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Proveedor</p>
                <p className="truncate font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Confirmación bancaria</p>
                <p className="font-semibold text-emerald-700">{facturaSeleccionada.numeroConfirmacion}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
              <div>
                <Label htmlFor="trans" className="text-xs text-slate-500">Número de transacción</Label>
                <Input id="trans" value={numeroTransaccion} onChange={(e) => setNumeroTransaccion(e.target.value)} placeholder="TRX-XXXX" />
              </div>
              <div>
                <Label htmlFor="fecha-pago" className="text-xs text-slate-500">Fecha de pago aplicado</Label>
                <Input id="fecha-pago" type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="comprobante-bancario" className="text-xs text-slate-500">Comprobante bancario (requerido)</Label>
                <Input id="comprobante-bancario" type="file" accept=".pdf,.xml,.png,.jpg,.jpeg" onChange={onSelectComprobante} />
                <Input value={archivoComprobante?.name || ''} readOnly placeholder="Sin archivo" />
                <p className="text-xs text-slate-500">Formatos: PDF, XML, PNG o JPG. Máximo 25 MB.</p>
              </div>
            </div>

            <div>
              <Label htmlFor="obs" className="text-sm font-medium text-slate-700">Observaciones</Label>
              <Textarea id="obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas de registro interno" />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setMostrarDialogRegistrar(false)}>Cancelar</Button>
          <Button onClick={registrarPago} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700">
            {isProcessing ? 'Registrando...' : 'Confirmar registro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
