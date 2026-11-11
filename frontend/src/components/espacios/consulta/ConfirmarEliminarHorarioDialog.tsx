import { Button } from '../../../share/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../share/dialog';
import { 
  Trash2
} from 'lucide-react';

import {
  formatHoraDecimal,
} from '../../../hooks/espacios/consultaEspaciosComun';



import type { useConsultaEspacios } from '../../../hooks/espacios/useConsultaEspacios';

interface Props {
  confirmDeleteDialogOpen: boolean;
  eliminarHorario: () => Promise<void>;
  horarioToDelete: ReturnType<typeof useConsultaEspacios>['horarios'][number] | null;
  isDeleting: boolean;
  setConfirmDeleteDialogOpen: (valor: boolean) => void;
  setHorarioToDelete: (valor: ReturnType<typeof useConsultaEspacios>['horarios'][number] | null) => void;
}

/** Confirmación de eliminar un horario. */
export function ConfirmarEliminarHorarioDialog({ confirmDeleteDialogOpen, eliminarHorario, horarioToDelete, isDeleting, setConfirmDeleteDialogOpen, setHorarioToDelete }: Props) {
  return (
  <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="text-red-600">Confirmar Eliminación</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {horarioToDelete && (
          <div className="space-y-3">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Horario a eliminar:</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {horarioToDelete.materia} - {horarioToDelete.dia} {formatHoraDecimal(horarioToDelete.horaInicio)}-{formatHoraDecimal(horarioToDelete.horaFin)}
              </p>
              {horarioToDelete.docente && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Docente: {horarioToDelete.docente}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-2">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          ¿Estás seguro de que deseas eliminar este horario? Esta acción no se puede deshacer.
        </p>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => {
          setConfirmDeleteDialogOpen(false);
          setHorarioToDelete(null);
        }}>
          Cancelar
        </Button>
        <Button 
          onClick={eliminarHorario}
          disabled={isDeleting}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar Horario'}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  );
}
