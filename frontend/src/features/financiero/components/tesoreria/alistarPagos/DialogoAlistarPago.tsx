import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Textarea } from '../../../../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../../../components/ui/dialog';
import { Upload } from 'lucide-react';
import type { useAlistarPagos } from '../../../hooks/tesoreria/useAlistarPagos';

type Gestion = ReturnType<typeof useAlistarPagos>;

/** Diálogo para alistar el pago de una factura. */
export function DialogoAlistarPago({ facturaSeleccionada, mostrarDialogAlistar, setMostrarDialogAlistar, numeroProcesoPago, setNumeroProcesoPago, archivoSeven, setArchivoSeven, observaciones, setObservaciones, isProcessing, alistarPago }: Pick<Gestion, 'facturaSeleccionada' | 'mostrarDialogAlistar' | 'setMostrarDialogAlistar' | 'numeroProcesoPago' | 'setNumeroProcesoPago' | 'archivoSeven' | 'setArchivoSeven' | 'observaciones' | 'setObservaciones' | 'isProcessing' | 'alistarPago'>) {
  return (
    <Dialog open={mostrarDialogAlistar} onOpenChange={setMostrarDialogAlistar}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-slate-800">Alistar Pago</DialogTitle>
          <DialogDescription>
            Cargue el archivo generado en SEVEN, registre el numero del proceso y deje la observacion del alistamiento.
          </DialogDescription>
        </DialogHeader>

        {facturaSeleccionada && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-slate-500">Factura</p>
                <p className="font-bold text-slate-800">{facturaSeleccionada.numeroFactura}</p>
              </div>
              <div>
                <p className="text-slate-500">Proveedor</p>
                <p className="font-bold text-slate-800">{facturaSeleccionada.proveedor}</p>
              </div>
              <div>
                <p className="text-slate-500">Área solicitante</p>
                <p className="font-bold text-slate-800">{facturaSeleccionada.areaSolicitante}</p>
              </div>
              <div>
                <p className="text-slate-500">Valor</p>
                <p className="font-bold text-green-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proceso" className="text-sm font-semibold text-slate-700">Numero Proceso Pago</Label>
              <Input
                id="proceso"
                value={numeroProcesoPago}
                onChange={(e) => setNumeroProcesoPago(e.target.value)}
                placeholder="Ej: PP-2026-001245"
              />
              <p className="text-xs text-slate-500">
                Debe coincidir con el consecutivo generado en SEVEN.
              </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="archivo-seven" className="text-sm font-semibold text-slate-700">Archivo plano generado en SEVEN</Label>
                <label htmlFor="archivo-seven" className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm hover:border-blue-300">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {archivoSeven ? archivoSeven.name : 'Seleccionar archivo'}
                    </p>
                    <p className="text-xs text-slate-500">Formato permitido: TXT</p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-blue-700">
                    <Upload className="h-4 w-4" />
                    <span className="text-xs font-semibold">Buscar</span>
                  </div>
                </label>
                <input
                  id="archivo-seven"
                  type="file"
                  accept=".txt"
                  onChange={(e) => setArchivoSeven(e.target.files?.[0] || null)}
                  className="hidden"
                />
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs" className="text-sm font-semibold text-slate-700">Observaciones del alistamiento</Label>
              <Textarea
                id="obs"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Explique brevemente el proceso realizado en SEVEN y cualquier novedad relevante"
                className="min-h-32"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setMostrarDialogAlistar(false)}>Cancelar</Button>
          <Button onClick={alistarPago} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
            {isProcessing ? 'Alistando...' : 'Confirmar alistamiento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
