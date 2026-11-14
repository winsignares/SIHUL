import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog';
import { Label } from '../../../../../components/ui/label';
import { Textarea } from '../../../../../components/ui/textarea';
import type { useMisPendientesFuncionario } from '../../../hooks/funcionario/useMisPendientesFuncionario';

type Gestion = ReturnType<typeof useMisPendientesFuncionario>;

/** Diálogo para rechazar una factura. */
export function DialogoRechazarPendiente({ rechazarOpen, setRechazarOpen, rechazarMotivo, setRechazarMotivo, rechazarError, setRechazarError, rechazarLoading, confirmarRechazo }: Pick<Gestion, 'rechazarOpen' | 'setRechazarOpen' | 'rechazarMotivo' | 'setRechazarMotivo' | 'rechazarError' | 'setRechazarError' | 'rechazarLoading' | 'confirmarRechazo'>) {
  return (
    <Dialog open={rechazarOpen} onOpenChange={setRechazarOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar factura</DialogTitle>
          <DialogDescription>
            Este rechazo se registrará en el historial y la factura volverá al proveedor para corrección.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="rechazo-motivo">Motivo del rechazo</Label>
          <Textarea
            id="rechazo-motivo"
            value={rechazarMotivo}
            onChange={(event) => {
              setRechazarMotivo(event.target.value);
              setRechazarError(null);
            }}
            placeholder="Describe claramente la razón del rechazo (mínimo 10 caracteres)."
            rows={4}
          />
          {rechazarError && <p className="text-sm text-red-600">{rechazarError}</p>}
        </div>
        <DialogFooter>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={() => setRechazarOpen(false)}
            disabled={rechazarLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
            onClick={confirmarRechazo}
            disabled={rechazarLoading}
          >
            {rechazarLoading ? 'Rechazando...' : 'Confirmar rechazo'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
