import type { DocumentoAdjunto } from '../../../models/financiero/core.models';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Label } from '../../../share/label';
import { Textarea } from '../../../share/textarea';
import type { useRegistrarFactura } from '../../../hooks/financiero/funcionario/useRegistrarFactura';

interface Props {
  hook: ReturnType<typeof useRegistrarFactura>;
}

/** Rechazo de la factura en revisión. */
export function RechazarFacturaDialog({ hook }: Props) {
  const {
    rechazarOpen,
    setRechazarOpen,
    rechazarMotivo,
    setRechazarMotivo,
    rechazarError,
    setRechazarError,
    rechazarLoading,
    selectedExistingDocs,
    confirmReject,
  } = hook;

  return (
  <Dialog open={rechazarOpen} onOpenChange={setRechazarOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Rechazar factura</DialogTitle>
        <DialogDescription>
          La factura volverá al proveedor para corrección. Si marcaste documentos, se incluirán en el motivo del rechazo.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        {selectedExistingDocs.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-semibold mb-2">✓ Documentos seleccionados para rechazo:</p>
            <p className="text-green-700 font-medium">{selectedExistingDocs.map((doc: DocumentoAdjunto) => doc.tipo_documento).join(', ')}</p>
            <p className="text-xs text-green-600 mt-2 italic">Se rechazaron los siguientes documentos: {selectedExistingDocs.map((doc: DocumentoAdjunto) => doc.tipo_documento).join(', ')}, por favor modificar documentos.</p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="rechazo-registro-motivo">Motivo del rechazo</Label>
          <Textarea
            id="rechazo-registro-motivo"
            value={rechazarMotivo}
            onChange={(event) => {
              setRechazarMotivo(event.target.value);
              setRechazarError(null);
            }}
            placeholder="Describe que debe corregir el proveedor..."
            rows={4}
          />
          {rechazarError && <p className="text-sm text-red-600">{rechazarError}</p>}
        </div>
      </div>
      <DialogFooter>
        <button
          type="button"
          onClick={() => setRechazarOpen(false)}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          disabled={rechazarLoading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => { void confirmReject(); }}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          disabled={rechazarLoading}
        >
          {rechazarLoading ? 'Rechazando...' : 'Confirmar rechazo'}
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  );
}
