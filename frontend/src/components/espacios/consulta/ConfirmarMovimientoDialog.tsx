import { Button } from '../../../share/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../share/dialog';
import { 
  ArrowLeft, 
} from 'lucide-react';

import {
  formatHoraDecimal,
} from '../../../hooks/espacios/consultaEspaciosComun';



import type { useConsultaEspacios } from '../../../hooks/espacios/useConsultaEspacios';

interface Props {
  confirmMoveDialogOpen: boolean;
  ejecutarMovimiento: () => Promise<void>;
  isProcessingMove: boolean;
  pendingMove: { horario: ReturnType<typeof useConsultaEspacios>['horarios'][number] | null, targetDia: string, targetHoraInicio: number } | null;
  setConfirmMoveDialogOpen: (valor: boolean) => void;
  setDraggedHorario: (valor: ReturnType<typeof useConsultaEspacios>['horarios'][number] | null) => void;
  setPendingMove: (valor: { horario: ReturnType<typeof useConsultaEspacios>['horarios'][number] | null, targetDia: string, targetHoraInicio: number } | null) => void;
}

/** Confirmación de mover un horario arrastrándolo. */
export function ConfirmarMovimientoDialog({ confirmMoveDialogOpen, ejecutarMovimiento, isProcessingMove, pendingMove, setConfirmMoveDialogOpen, setDraggedHorario, setPendingMove }: Props) {
  return (
  <Dialog open={confirmMoveDialogOpen} onOpenChange={setConfirmMoveDialogOpen}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Confirmar Movimiento</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {pendingMove?.horario && (
          <div className="space-y-3">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horario Actual:</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {pendingMove.horario.materia} - {pendingMove.horario.dia} {formatHoraDecimal(pendingMove.horario.horaInicio)}-{formatHoraDecimal(pendingMove.horario.horaFin)}
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2">
                <ArrowLeft className="w-5 h-5 text-purple-600 rotate-90" />
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Nuevo Horario:</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                {pendingMove.targetDia} {formatHoraDecimal(pendingMove.targetHoraInicio)}-{formatHoraDecimal(pendingMove.targetHoraInicio + (pendingMove.horario.horaFin - pendingMove.horario.horaInicio))}
              </p>
            </div>
          </div>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          ¿Estás seguro de que deseas mover esta clase?
        </p>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => {
          setConfirmMoveDialogOpen(false);
          setPendingMove(null);
          setDraggedHorario(null);
        }}>
          Cancelar
        </Button>
        <Button 
          onClick={ejecutarMovimiento}
          disabled={isProcessingMove}
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
        >
          {isProcessingMove ? 'Procesando...' : 'Confirmar Movimiento'}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  );
}
