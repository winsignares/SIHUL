import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Textarea } from '../../../share/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Badge } from '../../../share/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import { Calendar, FileCheck, Eye, AlertCircle, XCircle, Download, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import { displayDate, displayRadicado, displayText } from '../../../share/field-placeholders';

interface Factura {
  id: string;
  numeroFactura: string;
  numeroRadicado: string;
  proveedor: string;
  nit: string;
  valorTotal: number;
  fechaCausacion: string;
  cuentaContable: string;
  centroCosto?: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
}

export default function AlistarPagos() {
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    estado: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: '',
  });

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogAlistar, setMostrarDialogAlistar] = useState(false);
  const [mostrarDialogDevolver, setMostrarDialogDevolver] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [numeroProcesoPago, setNumeroProcesoPago] = useState('');
  const [archivoPlano, setArchivoPlano] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [motivoDevolucion, setMotivoDevolucion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const facturasCausadas: Factura[] = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-002',
      numeroRadicado: 'RAD-2026-087',
      proveedor: 'Servicios TI Colombia SAS',
      nit: '900123456-7',
      valorTotal: 8950000,
      fechaCausacion: '2026-03-25',
      cuentaContable: '5165-001',
      centroCosto: 'CC-007',
      areaSolicitante: 'Sistemas',
      estado: 'Causada',
      diasTranscurridos: 8,
      descripcion: 'Servicios de mantenimiento de infraestructura tecnologica',
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-006',
      numeroRadicado: 'RAD-2026-089',
      proveedor: 'Servicios de Aseo Total',
      nit: '900234567-8',
      valorTotal: 4200000,
      fechaCausacion: '2026-03-24',
      cuentaContable: '5135-001',
      centroCosto: 'CC-008',
      areaSolicitante: 'Servicios Generales',
      estado: 'Causada',
      diasTranscurridos: 13,
      descripcion: 'Servicios de aseo y mantenimiento general',
    },
  ];

  const facturasFiltradas = facturasCausadas.filter((factura) => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
    if (filtros.fechaInicio && new Date(factura.fechaCausacion) < new Date(filtros.fechaInicio)) return false;
    if (filtros.fechaFin && new Date(factura.fechaCausacion) > new Date(filtros.fechaFin)) return false;
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
    return true;
  });

  const abrirDialogAlistar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setNumeroProcesoPago(`PP-2026-${String(Math.floor(Math.random() * 1000) + 200).padStart(3, '0')}`);
    setArchivoPlano('');
    setObservaciones('');
    setMostrarDialogAlistar(true);
  };

  const abrirDialogDevolver = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMotivoDevolucion('');
    setMostrarDialogDevolver(true);
  };

  const abrirDialogDetalle = (factura: Factura) => {
    setFacturaDetalle({
      numeroFactura: factura.numeroFactura,
      numeroRadicado: factura.numeroRadicado,
      proveedor: factura.proveedor,
      nit: factura.nit,
      valorTotal: factura.valorTotal,
      areaSolicitante: factura.areaSolicitante,
      estado: factura.estado,
      diasTranscurridos: factura.diasTranscurridos,
      fechaRecepcion: factura.fechaCausacion,
      descripcion: factura.descripcion,
      cuentaContable: factura.cuentaContable,
      centroCosto: factura.centroCosto,
      nivelRiesgo: factura.diasTranscurridos > 17 ? 'rojo' : factura.diasTranscurridos > 10 ? 'amarillo' : 'verde',
    });
    setMostrarDialogDetalle(true);
  };

  const alistarPago = () => {
    if (!facturaSeleccionada || !numeroProcesoPago.trim()) {
      toast.error('Debe completar los datos requeridos');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      toast.success(`Pago alistado: ${facturaSeleccionada.numeroFactura}`);
      setIsProcessing(false);
      setMostrarDialogAlistar(false);
      setFacturaSeleccionada(null);
    }, 1200);
  };

  const devolverFactura = () => {
    if (!facturaSeleccionada || !motivoDevolucion.trim()) {
      toast.error('Debe indicar un motivo de devolucion');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      toast.warning(`Factura devuelta a Contabilidad: ${facturaSeleccionada.numeroFactura}`);
      setIsProcessing(false);
      setMostrarDialogDevolver(false);
      setFacturaSeleccionada(null);
    }, 1100);
  };

  const generarArchivoPlano = () => {
    if (!facturaSeleccionada) return;
    const nombreArchivo = `PAGO_${facturaSeleccionada.numeroFactura.replace(/-/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    setArchivoPlano(nombreArchivo);
    toast.success(`Archivo plano generado: ${nombreArchivo}`);
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
              <FileCheck className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Alistar Pagos</h1>
              <p className="text-red-100 text-sm">Preparar proceso de pago y archivo plano para el aplicativo financiero</p>
            </div>
          </div>
        </motion.div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Filtros de Busqueda Independientes
            </CardTitle>
            <CardDescription>Filtre por columna especifica usando campos independientes</CardDescription>
          </CardHeader>
          <CardContent>
            <TableFilters
              filters={filtros}
              onFilterChange={setFiltros}
              estados={['Causada']}
              proveedores={Array.from(new Set(facturasCausadas.map((f) => f.proveedor)))}
              areas={Array.from(new Set(facturasCausadas.map((f) => f.areaSolicitante)))}
              showMontoFilter
              showFechaFilter
              showAreaFilter
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800">Facturas Causadas Pendientes</CardTitle>
                <CardDescription>{facturasFiltradas.length} factura(s) lista(s) para alistar</CardDescription>
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-lg px-4 py-2">{facturasFiltradas.length} Por Alistar</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                    <TableHead className="font-semibold text-slate-700">N Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">N Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                    <TableHead className="font-semibold text-slate-700">Centro Costo</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha Causacion</TableHead>
                    <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                    <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturasFiltradas.map((factura, index) => {
                    const colorRiesgo = factura.diasTranscurridos >= 18 ? 'bg-orange-500' : factura.diasTranscurridos >= 12 ? 'bg-yellow-500' : 'bg-green-500';

                    return (
                      <motion.tr
                        key={factura.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colorRiesgo}`} />
                            {factura.diasTranscurridos >= 18 && <AlertCircle className="w-4 h-4 text-orange-700" />}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                        <TableCell><Badge className="bg-blue-100 text-blue-700 border-blue-200 border font-mono text-xs">{displayRadicado(factura.numeroRadicado)}</Badge></TableCell>
                        <TableCell className="text-slate-600 max-w-[180px] truncate" title={displayText(factura.proveedor)}>{displayText(factura.proveedor)}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{displayText(factura.nit)}</TableCell>
                        <TableCell className="font-semibold text-slate-800">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                        <TableCell><Badge className="bg-purple-100 text-purple-700 border-purple-200 border font-mono text-xs">{factura.cuentaContable}</Badge></TableCell>
                        <TableCell>{factura.centroCosto ? <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 border font-mono text-xs">{factura.centroCosto}</Badge> : <span className="text-slate-400 text-xs">{displayText(factura.centroCosto)}</span>}</TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-slate-400" />{displayDate(factura.fechaCausacion)}</div>
                        </TableCell>
                        <TableCell><span className="inline-flex items-center gap-1 font-bold text-sm text-slate-700">{factura.diasTranscurridos}d</span></TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => abrirDialogDevolver(factura)} className="border-red-300 text-red-700 hover:bg-red-50">
                              <XCircle className="w-4 h-4 mr-1" />Devolver
                            </Button>
                            <Button size="sm" onClick={() => abrirDialogAlistar(factura)} className="bg-blue-600 hover:bg-blue-700 text-white">
                              <FileCheck className="w-4 h-4 mr-1" />Alistar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => abrirDialogDetalle(factura)} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                              <Eye className="w-4 h-4 mr-1" />Detalle
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={mostrarDialogAlistar} onOpenChange={setMostrarDialogAlistar}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Alistar Pago</DialogTitle>
            <DialogDescription>Complete el proceso previo al envio a Auditoria</DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <Label className="text-xs text-slate-500">Factura</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Proveedor</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                </div>
                <div>
                  <Label htmlFor="proceso" className="text-xs text-slate-500">Numero Proceso Pago</Label>
                  <Input id="proceso" value={numeroProcesoPago} onChange={(e) => setNumeroProcesoPago(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Archivo Plano</Label>
                  <div className="flex items-center gap-2">
                    <Input value={archivoPlano} readOnly placeholder="No generado" />
                    <Button type="button" variant="outline" onClick={generarArchivoPlano}>
                      <Download className="w-4 h-4 mr-1" />Generar
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="obs">Observaciones</Label>
                <Textarea id="obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones del alistamiento" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogAlistar(false)}>Cancelar</Button>
            <Button onClick={alistarPago} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
              {isProcessing ? 'Alistando...' : 'Confirmar Alistamiento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarDialogDevolver} onOpenChange={setMostrarDialogDevolver}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Devolver a Contabilidad</DialogTitle>
            <DialogDescription>Indique el motivo para devolver la factura</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="motivo">Motivo de devolucion</Label>
            <Textarea id="motivo" value={motivoDevolucion} onChange={(e) => setMotivoDevolucion(e.target.value)} placeholder="Detalle de la inconsistencia detectada" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogDevolver(false)}>Cancelar</Button>
            <Button onClick={devolverFactura} disabled={isProcessing} className="bg-red-600 hover:bg-red-700">
              {isProcessing ? 'Devolviendo...' : 'Confirmar Devolucion'}
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
