import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import { Label } from '../../../../components/ui/label';
import { XCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import type { useControlPrevio } from '../../hooks/auditoria/useControlPrevio';

type Gestion = ReturnType<typeof useControlPrevio>;

/** Diálogo para rechazar una factura con su motivo. */
export function DialogoRechazarControlPrevio({ opcionesRechazo, facturaSeleccionada, mostrarDialogRechazar, setMostrarDialogRechazar, motivoRechazo, setMotivoRechazo, procesando, rechazoSeleccion, setRechazoSeleccion, buildRechazoMotivo, confirmarRechazo }: Pick<Gestion, 'opcionesRechazo' | 'facturaSeleccionada' | 'mostrarDialogRechazar' | 'setMostrarDialogRechazar' | 'motivoRechazo' | 'setMotivoRechazo' | 'procesando' | 'rechazoSeleccion' | 'setRechazoSeleccion' | 'buildRechazoMotivo' | 'confirmarRechazo'>) {
  return (
    <Dialog open={mostrarDialogRechazar} onOpenChange={setMostrarDialogRechazar}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Rechazar Factura</DialogTitle>
          <DialogDescription>Registre el motivo para devolver a Tesorería</DialogDescription>
        </DialogHeader>

        {facturaSeleccionada && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600">Factura: <span className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</span></p>
              <p className="text-sm text-slate-600">Proveedor: <span className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</span></p>
              <p className="text-sm text-slate-600">Monto: <span className="font-semibold text-red-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</span></p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-800 mb-3">Checklist de hallazgos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {opcionesRechazo.map((item) => {
                  const activo = rechazoSeleccion.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const next = rechazoSeleccion.includes(item.id)
                          ? rechazoSeleccion.filter((r) => r !== item.id)
                          : [...rechazoSeleccion, item.id];
                        setRechazoSeleccion(next);
                        const auto = buildRechazoMotivo(next);
                        if (!motivoRechazo.trim() || motivoRechazo.startsWith('Hallazgos:')) {
                          setMotivoRechazo(auto);
                        }
                      }}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all ${
                        activo ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{item.label}</span>
                      {activo ? <XCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4 text-slate-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Motivo de rechazo</Label>
              <Textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Detalle de la inconsistencia (mínimo 10 caracteres)" className="mt-2" />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setMostrarDialogRechazar(false)}>Cancelar</Button>
          <Button onClick={confirmarRechazo} disabled={procesando} className="bg-red-600 hover:bg-red-700 text-white">
            {procesando ? 'Rechazando...' : 'Confirmar rechazo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
