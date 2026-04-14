import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { CheckCircle, Filter, Calendar, Eye, Building, AlertCircle, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import TableFilters from '../ui/table-filters';
import FacturaDetailModal from '../ui/factura-detail-modal';

interface Factura {
  id: string;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  proveedor: string;
  nit: string;
  valorTotal: number;
  fechaAutorizacion: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
}

export default function ConfirmacionPagos() {
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: ''
  });

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [mostrarDialogConfirmar, setMostrarDialogConfirmar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [numeroConfirmacion, setNumeroConfirmacion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const facturasAutorizadas: Factura[] = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-018',
      numeroRadicado: 'RAD-2026-00115',
      numeroProcesoPago: 'PP-2026-0092',
      proveedor: 'Construcciones Universitarias SAS',
      nit: '900123456-7',
      valorTotal: 45000000,
      fechaAutorizacion: '2026-04-01',
      areaSolicitante: 'Infraestructura',
      estado: 'Autorizada para pago',
      diasTranscurridos: 1,
      descripcion: 'Obra construcción bloque D - Pago parcial'
    }
  ];

  const columnasParaFiltrar = [
    { key: 'numeroFactura', label: 'Nº Factura' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'areaSolicitante', label: 'Área' }
  ];

  const facturasFiltradas = facturasAutorizadas.filter(factura => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.areaSolicitante && !factura.areaSolicitante.toLowerCase().includes(filtros.areaSolicitante.toLowerCase())) return false;
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
    return true;
  });

  const abrirDialogConfirmar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setNumeroConfirmacion('');
    setObservaciones('');
    setMostrarDialogConfirmar(true);
  };

  const confirmarPago = () => {
    if (!facturaSeleccionada) return;
    
    if (!numeroConfirmacion.trim()) {
      toast.error('Validación', {
        description: 'Debe ingresar el número de confirmación del proceso bancario'
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      toast.success('¡Pago confirmado!', {
        description: `${facturaSeleccionada.numeroFactura} - Control del proceso completado`
      });
      setIsProcessing(false);
      setMostrarDialogConfirmar(false);
      setFacturaSeleccionada(null);
      setNumeroConfirmacion('');
      setObservaciones('');
    }, 1500);
  };

  return (
    <>
      <div className="p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-white mb-1">Confirmación de Pagos</h1>
              <p className="text-red-100 text-sm">Control y confirmación del proceso de pago (NO ejecuta pagos)</p>
            </div>
            <div className="bg-blue-500/20 border border-blue-300/30 rounded-lg px-4 py-2">
              <p className="text-blue-100 text-xs font-medium">ℹ️ Información</p>
              <p className="text-white text-sm font-semibold">Control de proceso</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Filter className="w-5 h-5 text-red-600" />
                Filtros de Búsqueda Independientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TableFilters
                filters={filtros}
                onFilterChange={setFiltros}
                estados={['Autorizada para pago']}
                proveedores={Array.from(new Set(facturasAutorizadas.map(f => f.proveedor)))}
                areas={Array.from(new Set(facturasAutorizadas.map(f => f.areaSolicitante)))}
                showMontoFilter={true}
                showFechaFilter={false}
                showAreaFilter={true}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Pagos Autorizados - Control de Proceso</CardTitle>
              <CardDescription>{facturasFiltradas.length} pago(s) autorizado(s) pendiente(s) de confirmación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold">Control del proceso - NO ejecución bancaria</p>
                    <p className="mt-1">Este módulo permite confirmar el control y seguimiento del proceso de pago. La ejecución real del pago se realiza en el portal bancario externo.</p>
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Nº Factura</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>F. Autorización</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturasFiltradas.map((factura, index) => (
                    <motion.tr key={factura.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}>
                      <TableCell className="font-medium">{factura.numeroFactura}</TableCell>
                      <TableCell><Building className="w-4 h-4 inline mr-2" />{factura.proveedor}</TableCell>
                      <TableCell className="font-bold text-green-700">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                      <TableCell><Badge variant="outline">{factura.areaSolicitante}</Badge></TableCell>
                      <TableCell><Calendar className="w-3 h-3 inline mr-1" />{factura.fechaAutorizacion}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setFacturaSeleccionada(factura)}><Eye className="w-4 h-4" /></Button>
                          <Button size="sm" onClick={() => abrirDialogConfirmar(factura)} className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-1" />Confirmar</Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={mostrarDialogConfirmar} onOpenChange={setMostrarDialogConfirmar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Control de Proceso</DialogTitle>
            <DialogDescription>Registre la confirmación del control del proceso de pago</DialogDescription>
          </DialogHeader>
          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p><strong>Factura:</strong> {facturaSeleccionada.numeroFactura}</p>
                <p><strong>Proveedor:</strong> {facturaSeleccionada.proveedor}</p>
                <p><strong>Monto:</strong> ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</p>
              </div>
              <div className="space-y-2">
                <Label>Número de Confirmación *</Label>
                <Input value={numeroConfirmacion} onChange={(e) => setNumeroConfirmacion(e.target.value)} placeholder="Ej: CONF-2026-001" />
              </div>
              <div className="space-y-2">
                <Label>Observaciones (Opcional)</Label>
                <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogConfirmar(false)}>Cancelar</Button>
            <Button onClick={confirmarPago} className="bg-green-600">
              {isProcessing ? 'Confirmando...' : 'Confirmar Control'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FacturaDetailModal factura={facturaSeleccionada} isOpen={mostrarDialogDetalle} onClose={() => setMostrarDialogDetalle(false)} />
    </>
  );
}