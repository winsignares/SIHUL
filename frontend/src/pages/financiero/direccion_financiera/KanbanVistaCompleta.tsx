import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import { FileText, Eye, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SharedFacturaDetail } from '../../../share/factura-detail-modal';
import type { KanbanEstadoDireccionFinanciera } from '../../../hooks/financiero/direccion_financiera/home/useDireccionFinancieraHome';

interface KanbanVistaCompletaProps {
  isOpen: boolean;
  kanbanEstados: KanbanEstadoDireccionFinanciera[];
  onClose: () => void;
  onSelectFactura: (factura: SharedFacturaDetail) => void;
}

const estadoColor: Record<string, string> = {
  'Recibida (Funcionario)': 'from-slate-500 to-slate-600',
  Registrada: 'from-blue-500 to-blue-600',
  Radicada: 'from-cyan-500 to-cyan-600',
  Causada: 'from-indigo-500 to-indigo-600',
  Alistada: 'from-amber-500 to-amber-600',
  'Aprobada Auditoría': 'from-teal-500 to-teal-600',
  'Rechazada Auditoría': 'from-rose-500 to-rose-600',
  'Revisada Dir. Financiera': 'from-orange-500 to-orange-600',
  'Cargada para autorización': 'from-purple-500 to-purple-600',
  'Enviada Rectoría': 'from-cyan-500 to-cyan-600',
  'Autorizada para pago': 'from-green-500 to-green-600',
  'Devuelta para ajustes': 'from-red-500 to-red-600',
  'Pago Aplicado': 'from-emerald-500 to-emerald-600',
  Pagada: 'from-emerald-700 to-emerald-800',
};

export default function KanbanVistaCompleta({ isOpen, kanbanEstados, onClose, onSelectFactura }: KanbanVistaCompletaProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] h-[90vh] max-w-[1700px] sm:max-w-[96vw] max-h-[90vh] rounded-2xl border p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white">
          <div>
            <DialogTitle className="text-2xl text-slate-800 flex items-center gap-2 pr-10">
              <FileText className="w-6 h-6 text-red-600" />
              Vista Completa del Tablero Kanban
            </DialogTitle>
            <DialogDescription>
              Flujo integral de cuentas por pagar, por estado y con acceso rapido a detalle.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="h-[calc(90vh-86px)] overflow-scroll [scrollbar-gutter:stable_both-edges] p-4 bg-slate-50">
          <div className="flex w-max min-w-max min-h-full items-start gap-4 pb-8">
            {kanbanEstados.map(({ estado, facturas }, colIndex) => {
              const totalMonto = facturas.reduce((sum, f) => sum + f.valorTotal, 0);

              return (
                <motion.div
                  key={estado}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIndex * 0.05 }}
                  className="w-[320px] rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className={`rounded-t-2xl p-4 text-white bg-gradient-to-r ${estadoColor[estado] || 'from-slate-500 to-slate-600'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-lg">{estado}</h3>
                      <Badge className="bg-white/20 border-white/30 text-white">{facturas.length}</Badge>
                    </div>
                    <p className="text-white/90 text-sm">Total: ${totalMonto.toLocaleString('es-CO')}</p>
                  </div>

                  <div className="p-3 space-y-3">
                    {facturas.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-300 p-4 bg-slate-50 text-center text-sm text-slate-500">
                        No hay facturas en esta etapa.
                      </div>
                    )}
                    {facturas.map((factura) => (
                      <div key={factura.numeroFactura} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-slate-800">{factura.numeroFactura}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-slate-700"
                            onClick={() => onSelectFactura(factura)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{factura.proveedor}</p>
                        <p className="text-xl font-bold text-green-700 mb-2">${factura.valorTotal.toLocaleString('es-CO')}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {factura.fechaFactura}
                          </span>
                          <Badge variant="outline" className="text-xs">{factura.diasTranscurridos || 0} dias</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{factura.areaSolicitante}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
