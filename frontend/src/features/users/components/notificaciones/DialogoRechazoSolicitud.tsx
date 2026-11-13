import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import { Label } from '../../../../components/ui/label';
import { MessageSquare, XCircle } from 'lucide-react';
import type { useNotificacionesPagina } from '../../hooks/useNotificacionesPagina';

type Gestion = ReturnType<typeof useNotificacionesPagina>;

/** Diálogo para indicar el motivo al rechazar una solicitud de espacio. */
export function DialogoRechazoSolicitud({
  showModalRechazo, setShowModalRechazo, motivoRechazo, setMotivoRechazo, setNotificacionSeleccionada,
  handleConfirmarRechazo, procesando,
}: Pick<Gestion, 'showModalRechazo' | 'setShowModalRechazo' | 'motivoRechazo' | 'setMotivoRechazo' | 'setNotificacionSeleccionada' | 'handleConfirmarRechazo' | 'procesando'>) {
  return (
    <Dialog open={showModalRechazo} onOpenChange={setShowModalRechazo}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Rechazar Solicitud
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              ⚠️ Por favor, proporciona un motivo para rechazar esta solicitud de espacio.
            </p>
          </div>

          <div>
            <Label htmlFor="motivo-rechazo" className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4" />
              <span>Motivo del Rechazo</span>
              <span className="text-red-600 font-bold">*</span>
            </Label>
            <textarea
              id="motivo-rechazo"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Explica por qué se rechaza esta solicitud..."
              className="w-full px-4 py-3 border-2 border-red-300 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/30 transition-all"
              rows={4}
            />
            <p className="text-xs text-slate-500 mt-2">
              💡 El motivo será visible para el planificador en su notificación
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowModalRechazo(false);
              setMotivoRechazo('');
              setNotificacionSeleccionada(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirmarRechazo}
            disabled={procesando || !motivoRechazo.trim()}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
