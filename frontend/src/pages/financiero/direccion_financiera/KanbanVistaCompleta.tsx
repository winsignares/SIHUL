import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import { FileText, Eye, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SharedFacturaDetail } from '../../../share/factura-detail-modal';

interface KanbanVistaCompletaProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFactura: (factura: SharedFacturaDetail) => void;
}

const facturasPorEstado: Record<string, SharedFacturaDetail[]> = {
  Recibida: [
    {
      numeroFactura: 'FAC-2026-001',
      proveedor: 'Papeleria Central Ltda.',
      valorTotal: 2450000,
      fechaFactura: '2026-03-20',
      fechaRecepcion: '2026-03-23',
      areaSolicitante: 'Administracion',
      estado: 'Recibida',
      diasTranscurridos: 0,
      descripcion: 'Suministros administrativos',
    },
  ],
  Radicada: [
    {
      numeroFactura: 'FAC-2026-002',
      numeroRadicado: 'RAD-2026-00145',
      proveedor: 'Servicios TI Colombia SAS',
      valorTotal: 8950000,
      fechaFactura: '2026-03-19',
      fechaRecepcion: '2026-03-23',
      areaSolicitante: 'Sistemas',
      estado: 'Radicada',
      diasTranscurridos: 1,
      descripcion: 'Soporte de infraestructura',
    },
  ],
  Causada: [
    {
      numeroFactura: 'FAC-2026-010',
      numeroRadicado: 'RAD-2026-00140',
      proveedor: 'Editorial Academica',
      valorTotal: 4500000,
      fechaFactura: '2026-03-17',
      fechaRecepcion: '2026-03-21',
      areaSolicitante: 'Publicaciones',
      estado: 'Causada',
      diasTranscurridos: 3,
      descripcion: 'Impresion institucional',
    },
  ],
  Alistada: [
    {
      numeroFactura: 'FAC-2026-004',
      numeroRadicado: 'RAD-2026-00138',
      numeroProcesoPago: 'PP-2026-0078',
      proveedor: 'Mantenimiento y Obras EU',
      valorTotal: 12500000,
      fechaFactura: '2026-03-17',
      fechaRecepcion: '2026-03-22',
      areaSolicitante: 'Mantenimiento',
      estado: 'Alistada',
      diasTranscurridos: 3,
      descripcion: 'Mantenimiento estructural',
    },
  ],
  'Aprobada Auditoria': [
    {
      numeroFactura: 'FAC-2026-005',
      numeroRadicado: 'RAD-2026-00132',
      numeroProcesoPago: 'PP-2026-0076',
      proveedor: 'Editorial Universitaria',
      valorTotal: 5670000,
      fechaFactura: '2026-03-15',
      fechaRecepcion: '2026-03-21',
      areaSolicitante: 'Biblioteca',
      estado: 'Aprobada Auditoria',
      diasTranscurridos: 5,
      descripcion: 'Adquisicion de libros',
    },
  ],
  Cargada: [
    {
      numeroFactura: 'FAC-2026-006',
      numeroRadicado: 'RAD-2026-00128',
      numeroProcesoPago: 'PP-2026-0074',
      proveedor: 'Servicios de Aseo Total',
      valorTotal: 4200000,
      fechaFactura: '2026-03-14',
      fechaRecepcion: '2026-03-20',
      areaSolicitante: 'Servicios Generales',
      estado: 'Cargada',
      diasTranscurridos: 6,
      descripcion: 'Servicios de aseo mensual',
    },
  ],
  Autorizada: [
    {
      numeroFactura: 'FAC-2026-007',
      numeroRadicado: 'RAD-2026-00124',
      numeroProcesoPago: 'PP-2026-0072',
      proveedor: 'Transporte Estudiantil SA',
      valorTotal: 7200000,
      fechaFactura: '2026-03-12',
      fechaRecepcion: '2026-03-18',
      areaSolicitante: 'Bienestar',
      estado: 'Autorizada',
      diasTranscurridos: 8,
      descripcion: 'Transporte estudiantil mensual',
    },
  ],
};

const estadoColor: Record<string, string> = {
  Recibida: 'from-slate-500 to-slate-600',
  Radicada: 'from-blue-500 to-blue-600',
  Causada: 'from-indigo-500 to-indigo-600',
  Alistada: 'from-yellow-500 to-yellow-600',
  'Aprobada Auditoria': 'from-orange-500 to-orange-600',
  Cargada: 'from-purple-500 to-purple-600',
  Autorizada: 'from-green-500 to-green-600',
};

export default function KanbanVistaCompleta({ isOpen, onClose, onSelectFactura }: KanbanVistaCompletaProps) {
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
            {Object.entries(facturasPorEstado).map(([estado, facturas], colIndex) => {
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
