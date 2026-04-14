import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { FileText, DollarSign, Building, Calendar, Eye, X } from 'lucide-react';
import { Button } from '../ui/button';
import FacturaDetailModal from '../ui/factura-detail-modal';

interface Factura {
  id: string;
  numeroFactura: string;
  proveedor: string;
  valorTotal: number;
  fechaFactura: string;
  fechaRecepcion?: string;
  areaSolicitante?: string;
  estado: string;
  diasTranscurridos?: number;
  numeroRadicado?: string;
  numeroProcesoPago?: string;
}

interface KanbanVistaCompletaProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KanbanVistaCompleta({ isOpen, onClose }: KanbanVistaCompletaProps) {
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Datos de ejemplo con facturas por estado
  const facturasPorEstado = {
    'Recibida': [
      { id: '1', numeroFactura: 'FAC-2026-001', proveedor: 'Papelería Central Ltda.', valorTotal: 2450000, fechaFactura: '2026-03-20', fechaRecepcion: '2026-03-23', areaSolicitante: 'Administración', estado: 'Recibida', diasTranscurridos: 0 },
      { id: '2', numeroFactura: 'FAC-2026-008', proveedor: 'Librería Universitaria', valorTotal: 1850000, fechaFactura: '2026-03-22', fechaRecepcion: '2026-03-23', areaSolicitante: 'Biblioteca', estado: 'Recibida', diasTranscurridos: 0 },
      { id: '3', numeroFactura: 'FAC-2026-015', proveedor: 'Equipos de Laboratorio SAS', valorTotal: 5600000, fechaFactura: '2026-03-21', fechaRecepcion: '2026-03-23', areaSolicitante: 'Laboratorios', estado: 'Recibida', diasTranscurridos: 1 }
    ],
    'Radicada': [
      { id: '4', numeroFactura: 'FAC-2026-002', proveedor: 'Servicios TI Colombia SAS', valorTotal: 8950000, fechaFactura: '2026-03-19', fechaRecepcion: '2026-03-23', areaSolicitante: 'Sistemas', estado: 'Radicada', diasTranscurridos: 1, numeroRadicado: 'RAD-2026-00145' },
      { id: '5', numeroFactura: 'FAC-2026-009', proveedor: 'Mantenimiento Integral', valorTotal: 3200000, fechaFactura: '2026-03-20', fechaRecepcion: '2026-03-22', areaSolicitante: 'Mantenimiento', estado: 'Radicada', diasTranscurridos: 2, numeroRadicado: 'RAD-2026-00146' }
    ],
    'Causada': [
      { id: '6', numeroFactura: 'FAC-2026-003', proveedor: 'Suministros Industriales SA', valorTotal: 3200000, fechaFactura: '2026-03-18', fechaRecepcion: '2026-03-22', areaSolicitante: 'Mantenimiento', estado: 'Causada', diasTranscurridos: 2, numeroRadicado: 'RAD-2026-00142' },
      { id: '7', numeroFactura: 'FAC-2026-010', proveedor: 'Editorial Académica', valorTotal: 4500000, fechaFactura: '2026-03-17', fechaRecepcion: '2026-03-21', areaSolicitante: 'Publicaciones', estado: 'Causada', diasTranscurridos: 3, numeroRadicado: 'RAD-2026-00140' }
    ],
    'Alistada': [
      { id: '8', numeroFactura: 'FAC-2026-004', proveedor: 'Mantenimiento y Obras EU', valorTotal: 12500000, fechaFactura: '2026-03-17', fechaRecepcion: '2026-03-22', areaSolicitante: 'Mantenimiento', estado: 'Alistada', diasTranscurridos: 3, numeroRadicado: 'RAD-2026-00138', numeroProcesoPago: 'PP-2026-0078' },
      { id: '9', numeroFactura: 'FAC-2026-011', proveedor: 'Cafetería Universitaria', valorTotal: 2800000, fechaFactura: '2026-03-16', fechaRecepcion: '2026-03-21', areaSolicitante: 'Bienestar', estado: 'Alistada', diasTranscurridos: 4, numeroRadicado: 'RAD-2026-00135', numeroProcesoPago: 'PP-2026-0079' }
    ],
    'Aprobada Auditoría': [
      { id: '10', numeroFactura: 'FAC-2026-005', proveedor: 'Editorial Universitaria', valorTotal: 5670000, fechaFactura: '2026-03-15', fechaRecepcion: '2026-03-21', areaSolicitante: 'Biblioteca', estado: 'Aprobada Auditoría', diasTranscurridos: 5, numeroRadicado: 'RAD-2026-00132', numeroProcesoPago: 'PP-2026-0076' },
      { id: '11', numeroFactura: 'FAC-2026-012', proveedor: 'Insumos Médicos SAS', valorTotal: 6800000, fechaFactura: '2026-03-14', fechaRecepcion: '2026-03-20', areaSolicitante: 'Enfermería', estado: 'Aprobada Auditoría', diasTranscurridos: 6, numeroRadicado: 'RAD-2026-00130', numeroProcesoPago: 'PP-2026-0077' }
    ],
    'Cargada': [
      { id: '12', numeroFactura: 'FAC-2026-006', proveedor: 'Servicios de Aseo Total', valorTotal: 4200000, fechaFactura: '2026-03-14', fechaRecepcion: '2026-03-20', areaSolicitante: 'Servicios Generales', estado: 'Cargada', diasTranscurridos: 6, numeroRadicado: 'RAD-2026-00128', numeroProcesoPago: 'PP-2026-0074' },
      { id: '13', numeroFactura: 'FAC-2026-013', proveedor: 'Seguridad Privada Ltda.', valorTotal: 9500000, fechaFactura: '2026-03-13', fechaRecepcion: '2026-03-19', areaSolicitante: 'Seguridad', estado: 'Cargada', diasTranscurridos: 7, numeroRadicado: 'RAD-2026-00126', numeroProcesoPago: 'PP-2026-0075' }
    ],
    'Autorizada': [
      { id: '14', numeroFactura: 'FAC-2026-007', proveedor: 'Transporte Estudiantil SA', valorTotal: 7200000, fechaFactura: '2026-03-12', fechaRecepcion: '2026-03-18', areaSolicitante: 'Bienestar', estado: 'Autorizada', diasTranscurridos: 8, numeroRadicado: 'RAD-2026-00124', numeroProcesoPago: 'PP-2026-0072' },
      { id: '15', numeroFactura: 'FAC-2026-014', proveedor: 'Equipos Audiovisuales', valorTotal: 11200000, fechaFactura: '2026-03-11', fechaRecepcion: '2026-03-17', areaSolicitante: 'Audiovisuales', estado: 'Autorizada', diasTranscurridos: 9, numeroRadicado: 'RAD-2026-00122', numeroProcesoPago: 'PP-2026-0073' }
    ]
  };

  const getEstadoColor = (estado: string) => {
    const colores: { [key: string]: { bg: string; border: string; text: string; gradient: string } } = {
      'Recibida': { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', gradient: 'from-gray-500 to-gray-600' },
      'Radicada': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', gradient: 'from-blue-500 to-blue-600' },
      'Causada': { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', gradient: 'from-indigo-500 to-indigo-600' },
      'Alistada': { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', gradient: 'from-yellow-500 to-yellow-600' },
      'Aprobada Auditoría': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', gradient: 'from-orange-500 to-orange-600' },
      'Cargada': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', gradient: 'from-purple-500 to-purple-600' },
      'Autorizada': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', gradient: 'from-green-500 to-green-600' }
    };
    return colores[estado] || colores['Recibida'];
  };

  const handleVerDetalle = (factura: Factura) => {
    setSelectedFactura(factura);
    setShowDetailModal(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[99vw] w-[99vw] max-h-[97vh] overflow-hidden p-0">
          <DialogHeader className="p-4 pb-3 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl text-slate-800 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-red-600" />
                  Vista Completa del Tablero Kanban
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Todas las facturas organizadas por su estado en el flujo de cuentas por pagar
                </DialogDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="overflow-x-auto overflow-y-auto h-[calc(97vh-100px)] p-4">
            <div className="flex gap-4 min-w-max pb-4">
              {Object.entries(facturasPorEstado).map(([estado, facturas], colIndex) => {
                const colorConfig = getEstadoColor(estado);
                const totalMonto = facturas.reduce((sum, f) => sum + f.valorTotal, 0);

                return (
                  <motion.div
                    key={estado}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: colIndex * 0.1 }}
                    className="flex-shrink-0 w-[320px]"
                  >
                    {/* Header de la columna */}
                    <div className={`bg-gradient-to-br ${colorConfig.gradient} rounded-t-xl p-3 text-white shadow-lg`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-base">{estado}</h3>
                        <Badge className="bg-white/20 text-white border-white/30 border">
                          {facturas.length}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/90">
                        Total: ${totalMonto.toLocaleString('es-CO')}
                      </p>
                    </div>

                    {/* Tarjetas de facturas */}
                    <div className={`${colorConfig.bg} ${colorConfig.border} border-x border-b rounded-b-xl p-2.5 space-y-2.5 min-h-[350px] max-h-[calc(97vh-240px)] overflow-y-auto`}>
                      <AnimatePresence>
                        {facturas.map((factura, index) => (
                          <motion.div
                            key={factura.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            className="cursor-pointer"
                          >
                            <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
                              <CardContent className="p-4 space-y-3">
                                {/* Número de Factura */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-500" />
                                    <span className="font-mono font-bold text-slate-800 text-sm">
                                      {factura.numeroFactura}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVerDetalle(factura)}
                                    className="h-7 px-2 text-xs hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Ver
                                  </Button>
                                </div>

                                {/* Proveedor */}
                                <div className="flex items-start gap-2">
                                  <Building className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-slate-700 line-clamp-2">{factura.proveedor}</p>
                                </div>

                                {/* Monto */}
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <p className="font-bold text-green-600">
                                    ${factura.valorTotal.toLocaleString('es-CO')}
                                  </p>
                                </div>

                                {/* Fecha y Días */}
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(factura.fechaFactura).toLocaleDateString('es-CO')}</span>
                                  </div>
                                  {factura.diasTranscurridos !== undefined && (
                                    <Badge variant="outline" className="text-xs">
                                      {factura.diasTranscurridos} días
                                    </Badge>
                                  )}
                                </div>

                                {/* Área */}
                                {factura.areaSolicitante && (
                                  <div className="pt-2 border-t border-slate-100">
                                    <p className="text-xs text-slate-500">{factura.areaSolicitante}</p>
                                  </div>
                                )}

                                {/* Números de radicado o proceso */}
                                {(factura.numeroRadicado || factura.numeroProcesoPago) && (
                                  <div className="space-y-1 text-xs">
                                    {factura.numeroRadicado && (
                                      <p className="text-slate-600">
                                        <span className="font-semibold">Rad:</span> {factura.numeroRadicado}
                                      </p>
                                    )}
                                    {factura.numeroProcesoPago && (
                                      <p className="text-slate-600">
                                        <span className="font-semibold">PP:</span> {factura.numeroProcesoPago}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {facturas.length === 0 && (
                        <div className="flex items-center justify-center h-40 text-slate-400">
                          <p className="text-sm">No hay facturas en este estado</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalle de factura */}
      <FacturaDetailModal
        factura={selectedFactura}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedFactura(null);
        }}
      />
    </>
  );
}