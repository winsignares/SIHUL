import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Textarea } from '../../../share/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Badge } from '../../../share/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import { Send, Eye, Calendar, CheckCircle2, FileText, Building, AlertCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';

interface Factura {
  id: string;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  proveedor: string;
  nit: string;
  valorTotal: number;
  fechaAprobacionAuditoria: string;
  areaSolicitante: string;
  cuentaContable: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
  observacionesAuditoria?: string;
}

export default function EnviarDireccionFinanciera() {
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: '',
  });

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogEnviar, setMostrarDialogEnviar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const facturasAprobadas: Factura[] = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-004',
      numeroRadicado: 'RAD-2026-00095',
      numeroProcesoPago: 'PP-2026-0078',
      proveedor: 'Mantenimiento y Obras EU',
      nit: '900456789-0',
      valorTotal: 12500000,
      fechaAprobacionAuditoria: '2026-04-01',
      areaSolicitante: 'Mantenimiento',
      cuentaContable: '5135-001',
      estado: 'Aprobada por Auditoria',
      diasTranscurridos: 1,
      descripcion: 'Servicios de mantenimiento preventivo y correctivo edificio principal',
      observacionesAuditoria: 'Documentacion completa. Aprobado para continuar.',
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-007',
      numeroRadicado: 'RAD-2026-00098',
      numeroProcesoPago: 'PP-2026-0081',
      proveedor: 'Transporte Estudiantil SA',
      nit: '900567890-1',
      valorTotal: 7200000,
      fechaAprobacionAuditoria: '2026-04-01',
      areaSolicitante: 'Bienestar',
      cuentaContable: '5140-002',
      estado: 'Aprobada por Auditoria',
      diasTranscurridos: 1,
      descripcion: 'Servicio de transporte estudiantil mensual',
      observacionesAuditoria: 'Todo en orden. Proceder con el pago.',
    },
  ];

  const facturasFiltradas = facturasAprobadas.filter((factura) => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.areaSolicitante && !factura.areaSolicitante.toLowerCase().includes(filtros.areaSolicitante.toLowerCase())) return false;
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
    if (filtros.fechaInicio && factura.fechaAprobacionAuditoria < filtros.fechaInicio) return false;
    if (filtros.fechaFin && factura.fechaAprobacionAuditoria > filtros.fechaFin) return false;
    return true;
  });

  const abrirDialogEnviar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setObservaciones('');
    setMostrarDialogEnviar(true);
  };

  const handleVerDetalle = (factura: Factura) => {
    setFacturaDetalle({
      numeroFactura: factura.numeroFactura,
      numeroRadicado: factura.numeroRadicado,
      proveedor: factura.proveedor,
      nit: factura.nit,
      valorTotal: factura.valorTotal,
      areaSolicitante: factura.areaSolicitante,
      estado: factura.estado,
      diasTranscurridos: factura.diasTranscurridos,
      fechaRecepcion: factura.fechaAprobacionAuditoria,
      descripcion: factura.descripcion,
      observaciones: factura.observacionesAuditoria,
      cuentaContable: factura.cuentaContable,
      numeroProcesoPago: factura.numeroProcesoPago,
      nivelRiesgo: factura.diasTranscurridos > 2 ? 'amarillo' : 'verde',
    });
    setMostrarDialogDetalle(true);
  };

  const enviarDireccionFinanciera = () => {
    if (!facturaSeleccionada) return;
    setIsProcessing(true);

    setTimeout(() => {
      toast.success(`Factura enviada a Direccion Financiera: ${facturaSeleccionada.numeroFactura}`);
      setIsProcessing(false);
      setMostrarDialogEnviar(false);
      setFacturaSeleccionada(null);
      setObservaciones('');
    }, 1200);
  };

  return (
    <>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Send className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Enviar a Direccion Financiera (RF06)</h1>
              <p className="text-red-100 text-sm">Facturas aprobadas por Auditoria para remitir a Direccion Financiera</p>
            </div>
          </div>
        </motion.div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800"><Filter className="w-5 h-5 text-red-600" />Filtros de Busqueda Independientes</CardTitle>
            <CardDescription>Filtre por columna especifica usando los campos independientes</CardDescription>
          </CardHeader>
          <CardContent>
            <TableFilters
              filters={filtros}
              onFilterChange={setFiltros}
              estados={['Aprobada por Auditoria']}
              proveedores={Array.from(new Set(facturasAprobadas.map((f) => f.proveedor)))}
              areas={Array.from(new Set(facturasAprobadas.map((f) => f.areaSolicitante)))}
              showMontoFilter
              showFechaFilter
              showAreaFilter
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg border-blue-200 bg-blue-50"><CardContent className="p-6"><p className="text-blue-700 text-sm font-semibold">Total Facturas</p><p className="text-3xl font-bold text-blue-800 mt-1">{facturasFiltradas.length}</p></CardContent></Card>
          <Card className="border-0 shadow-lg border-green-200 bg-green-50"><CardContent className="p-6"><p className="text-green-700 text-sm font-semibold">Monto Total</p><p className="text-2xl font-bold text-green-800 mt-1">${facturasFiltradas.reduce((sum, f) => sum + f.valorTotal, 0).toLocaleString('es-CO')}</p></CardContent></Card>
          <Card className="border-0 shadow-lg border-purple-200 bg-purple-50"><CardContent className="p-6"><p className="text-purple-700 text-sm font-semibold">Pendientes Envio</p><p className="text-3xl font-bold text-purple-800 mt-1">{facturasFiltradas.length}</p></CardContent></Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800">Facturas Aprobadas por Auditoria</CardTitle>
                <CardDescription>{facturasFiltradas.length} factura(s) aprobada(s) lista(s) para enviar</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200 border text-lg px-4 py-2">
                <CheckCircle2 className="w-4 h-4 mr-2" />{facturasFiltradas.length} Aprobadas
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">N Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Area</TableHead>
                    <TableHead className="font-semibold text-slate-700">N Proceso</TableHead>
                    <TableHead className="font-semibold text-slate-700">F. Aprobacion</TableHead>
                    <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                    <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturasFiltradas.map((factura, index) => (
                    <motion.tr key={factura.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><Building className="w-4 h-4 text-slate-400" /><span className="text-slate-700">{factura.proveedor}</span></div></TableCell>
                      <TableCell className="font-semibold text-green-700">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{factura.areaSolicitante}</Badge></TableCell>
                      <TableCell><Badge className="bg-blue-100 text-blue-700 border-blue-200 border font-mono text-xs">{factura.numeroProcesoPago}</Badge></TableCell>
                      <TableCell className="text-slate-600"><div className="flex items-center gap-1 text-sm"><Calendar className="w-3 h-3" />{factura.fechaAprobacionAuditoria}</div></TableCell>
                      <TableCell><Badge className={`${factura.diasTranscurridos > 2 ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-green-100 text-green-700 border-green-300'} border text-xs`}>{factura.diasTranscurridos}d</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleVerDetalle(factura)} className="border-slate-300 text-slate-700 hover:bg-slate-100"><Eye className="w-4 h-4 mr-1" />Ver</Button>
                          <Button size="sm" onClick={() => abrirDialogEnviar(factura)} className="bg-purple-600 hover:bg-purple-700 text-white"><Send className="w-4 h-4 mr-1" />Enviar</Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>

              {facturasFiltradas.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">No se encontraron facturas con los filtros aplicados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={mostrarDialogEnviar} onOpenChange={setMostrarDialogEnviar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-purple-600" />Enviar a Direccion Financiera</DialogTitle>
            <DialogDescription>Confirme el envio de la factura aprobada para cargue formal</DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600">Factura: <span className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</span></p>
                <p className="text-sm text-slate-600">Proveedor: <span className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</span></p>
                <p className="text-sm text-slate-600">Monto: <span className="font-semibold text-green-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</span></p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Observaciones de envio</label>
                <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones opcionales para Direccion Financiera" className="mt-2" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogEnviar(false)}>Cancelar</Button>
            <Button onClick={enviarDireccionFinanciera} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700">
              {isProcessing ? 'Enviando...' : 'Confirmar Envio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FacturaDetailModal
        factura={facturaDetalle}
        isOpen={mostrarDialogDetalle}
        onClose={() => {
          setMostrarDialogDetalle(false);
          setFacturaDetalle(null);
        }}
      />
    </>
  );
}
