import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import { Label } from '../../../../components/ui/label';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import type { useControlPrevio } from '../../hooks/auditoria/useControlPrevio';

type Gestion = ReturnType<typeof useControlPrevio>;

/** Diálogo para aprobar una factura con su lista de verificación. */
export function DialogoAprobarControlPrevio({ auditoriaChecklist, facturaSeleccionada, mostrarDialogAprobar, setMostrarDialogAprobar, observaciones, setObservaciones, procesando, checklistState, setChecklistState, checklistCompleto, confirmarAprobacion }: Pick<Gestion, 'auditoriaChecklist' | 'facturaSeleccionada' | 'mostrarDialogAprobar' | 'setMostrarDialogAprobar' | 'observaciones' | 'setObservaciones' | 'procesando' | 'checklistState' | 'setChecklistState' | 'checklistCompleto' | 'confirmarAprobacion'>) {
  return (
    <Dialog open={mostrarDialogAprobar} onOpenChange={setMostrarDialogAprobar}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aprobar Factura</DialogTitle>
          <DialogDescription>Confirme la aprobacion para continuar el flujo financiero</DialogDescription>
        </DialogHeader>

        {facturaSeleccionada && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600">Factura: <span className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</span></p>
              <p className="text-sm text-slate-600">Proveedor: <span className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</span></p>
              <p className="text-sm text-slate-600">Monto: <span className="font-semibold text-green-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</span></p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-800 mb-3">Checklist de validacion</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {auditoriaChecklist.map((item) => {
                  const activo = checklistState[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setChecklistState((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all ${
                        activo ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{item.label}</span>
                      {activo ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4 text-slate-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Observaciones <span className="text-red-600">*</span></Label>
              <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones de auditoría (obligatorio, mínimo 10 caracteres)" className="mt-2" />
              {observaciones.trim().length > 0 && observaciones.trim().length < 10 && (
                <p className="text-xs text-red-600 mt-1">Mínimo 10 caracteres ({observaciones.trim().length}/10)</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setMostrarDialogAprobar(false)}>Cancelar</Button>
          <Button onClick={confirmarAprobacion} disabled={procesando || !checklistCompleto || observaciones.trim().length < 10} className="bg-green-600 hover:bg-green-700 text-white">
            {procesando ? 'Aprobando...' : !checklistCompleto ? 'Complete el checklist' : observaciones.trim().length < 10 ? 'Ingrese observaciones' : 'Confirmar aprobacion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
