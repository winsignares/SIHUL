import { motion } from 'motion/react';
import { Button } from '../../../../components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import type { useDashboardHome } from '../../hooks/useDashboardHome';


type Home = ReturnType<typeof useDashboardHome>;
type Props = Pick<Home['state'], 'showReportModal' | 'isGeneratingReport' | 'reportGenerated'> & Pick<Home['setters'], 'setShowReportModal'> & Pick<Home['handlers'], 'handleGenerateReport'>;

/** Confirmación y resultado de la generación del reporte. */
export function ModalGenerarReporte({
  showReportModal,
  setShowReportModal,
  isGeneratingReport,
  reportGenerated,
  handleGenerateReport
}: Props) {
  return (
    <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900">
            {reportGenerated ? '¡Listo!' : '¿Desea generar el reporte del Dashboard?'}
          </DialogTitle>
          <DialogDescription>
            {reportGenerated
              ? 'El reporte ha sido procesado correctamente'
              : 'Se generará un reporte completo con todas las estadísticas actuales'
            }
          </DialogDescription>
        </DialogHeader>

        {isGeneratingReport && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
            <p className="text-slate-600">Generando reporte...</p>
          </div>
        )}

        {reportGenerated && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
            >
              <Check className="w-10 h-10 text-emerald-600" />
            </motion.div>
            <p className="text-slate-900 text-center">El reporte fue generado exitosamente</p>
          </motion.div>
        )}

        {!isGeneratingReport && !reportGenerated && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowReportModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateReport}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Aceptar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
