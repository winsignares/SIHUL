import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { DollarSign, Calendar, CheckCircle2, FileText, Upload, Eye, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import TableFilters from '../ui/table-filters';

interface Factura {
  id: string;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  proveedor: string;
  nit: string;
  valorTotal: number;
  comprobanteEgreso: string;
  fechaAprobacionDireccion: string;
  fechaAprobacionRectoria: string;
  areaSolicitante: string;
  cuentaContable: string;
  centroCosto?: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
}

export default function EjecutarPagos() {
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    estado: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: ''
  });

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [mostrarDialogPagar, setMostrarDialogPagar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [medioPago, setMedioPago] = useState('');
  const [numeroTransaccion, setNumeroTransaccion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [archivoSoporte, setArchivoSoporte] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const facturasAutorizadas: Factura[] = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-005',
      numeroRadicado: 'RAD-2026-00098',
      numeroProcesoPago: 'PP-2026-245',
      proveedor: 'Editorial Universitaria',
      nit: '900567890-1',
      valorTotal: 5670000,
      comprobanteEgreso: 'CE-2026-240',
      fechaAprobacionDireccion: '2026-04-01',
      fechaAprobacionRectoria: '2026-04-02',
      areaSolicitante: 'Biblioteca',
      cuentaContable: '5155-001',
      centroCosto: 'CC-006',
      estado: 'Autorizada para pago',
      diasTranscurridos: 22,
      descripcion: 'Adquisición de libros y material bibliográfico'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-008',
      numeroRadicado: 'RAD-2026-00102',
      numeroProcesoPago: 'PP-2026-247',
      proveedor: 'Tecnología Educativa SAS',
      nit: '900678901-2',
      valorTotal: 9200000,
      comprobanteEgreso: 'CE-2026-242',
      fechaAprobacionDireccion: '2026-03-31',
      fechaAprobacionRectoria: '2026-04-01',
      areaSolicitante: 'Sistemas',
      cuentaContable: '5165-001',
      centroCosto: 'CC-007',
      estado: 'Autorizada para pago',
      diasTranscurridos: 25,
      descripcion: 'Licencias de software educativo'
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-011',
      numeroRadicado: 'RAD-2026-00105',
      numeroProcesoPago: 'PP-2026-248',
      proveedor: 'Suministros Médicos Total',
      nit: '900789012-3',
      valorTotal: 3890000,
      comprobanteEgreso: 'CE-2026-244',
      fechaAprobacionDireccion: '2026-04-01',
      fechaAprobacionRectoria: '2026-04-02',
      areaSolicitante: 'Enfermería',
      cuentaContable: '5170-001',
      centroCosto: 'CC-010',
      estado: 'Autorizada para pago',
      diasTranscurridos: 20,
      descripcion: 'Insumos médicos y material de enfermería'
    }
  ];

  const facturasFiltradas = facturasAutorizadas.filter(factura => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) {
      return false;
    }
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) {
      return false;
    }
    if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) {
      return false;
    }
    if (filtros.fechaInicio && new Date(factura.fechaAprobacionRectoria) < new Date(filtros.fechaInicio)) {
      return false;
    }
    if (filtros.fechaFin && new Date(factura.fechaAprobacionRectoria) > new Date(filtros.fechaFin)) {
      return false;
    }
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) {
      return false;
    }
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) {
      return false;
    }
    return true;
  });

  const abrirDialogPagar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMedioPago('');
    setNumeroTransaccion('');
    setObservaciones('');
    setArchivoSoporte('');
    setMostrarDialogPagar(true);
  };

  const abrirDialogDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMostrarDialogDetalle(true);
  };

  const ejecutarPago = () => {
    if (!facturaSeleccionada) return;

    if (!medioPago || !numeroTransaccion.trim()) {
      toast.error('Campos requeridos', {
        description: 'Debe seleccionar el medio de pago e ingresar el número de transacción'
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      toast.success('¡Pago ejecutado exitosamente!', {
        description: `${facturaSeleccionada.numeroFactura} - Estado: Pagada - Trans: ${numeroTransaccion}`
      });

      setIsProcessing(false);
      setMostrarDialogPagar(false);
      setFacturaSeleccionada(null);
    }, 1500);
  };

  const simularCargaArchivo = () => {
    const nombreArchivo = `SOPORTE_${facturaSeleccionada?.numeroFactura.replace(/-/g, '_')}_${new Date().getTime()}.pdf`;
    setArchivoSoporte(nombreArchivo);
    toast.success('Archivo cargado', { description: nombreArchivo });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <DollarSign className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1">Ejecutar Pagos</h1>
            <p className="text-red-100 text-sm">Registrar el pago efectivo a proveedores autorizados por Rectoría</p>
          </div>
        </div>
      </motion.div>

      {/* Filtros Independientes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <TableFilters
              filters={filtros}
              onFilterChange={setFiltros}
              estados={['Autorizada para pago']}
              proveedores={Array.from(new Set(facturasAutorizadas.map(f => f.proveedor)))}
              areas={Array.from(new Set(facturasAutorizadas.map(f => f.areaSolicitante)))}
              showMontoFilter={true}
              showFechaFilter={true}
              showAreaFilter={true}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Facturas */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800">Facturas Autorizadas para Pago</CardTitle>
                <CardDescription>{facturasFiltradas.length} factura(s) autorizada(s) por Rectoría</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200 border text-lg px-4 py-2">
                {facturasFiltradas.length} Por Pagar
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                    <TableHead className="font-semibold text-slate-700">N° Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proceso Pago</TableHead>
                    <TableHead className="font-semibold text-slate-700">Comprobante</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                    <TableHead className="font-semibold text-slate-700">Centro Costo</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha Autorización</TableHead>
                    <TableHead className="font-semibold text-slate-700">Días</TableHead>
                    <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturasFiltradas.map((factura, index) => {
                    let riesgoSLA = 'verde';
                    if (factura.diasTranscurridos >= 24) riesgoSLA = 'vencido';
                    else if (factura.diasTranscurridos >= 18) riesgoSLA = 'naranja';
                    else if (factura.diasTranscurridos >= 12) riesgoSLA = 'amarillo';
                    
                    const colorRiesgo = riesgoSLA === 'vencido' ? 'bg-purple-700' 
                                      : riesgoSLA === 'naranja' ? 'bg-orange-500'
                                      : riesgoSLA === 'amarillo' ? 'bg-yellow-500'
                                      : 'bg-green-500';

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
                            {riesgoSLA === 'vencido' && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              >
                                <AlertCircle className="w-4 h-4 text-purple-700" />
                              </motion.div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                        <TableCell>
                          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 border font-mono text-xs">
                            {factura.numeroProcesoPago}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 border font-mono text-xs">
                            {factura.comprobanteEgreso}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-[180px] truncate" title={factura.proveedor}>
                          {factura.proveedor}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{factura.nit}</TableCell>
                        <TableCell className="font-semibold text-green-700 text-base">
                          ${factura.valorTotal.toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 border font-mono text-xs">
                            {factura.cuentaContable}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {factura.centroCosto ? (
                            <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 border font-mono text-xs">
                              {factura.centroCosto}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {factura.fechaAprobacionRectoria}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 font-bold text-sm ${
                            riesgoSLA === 'vencido' 
                              ? 'text-purple-700' 
                              : riesgoSLA === 'naranja'
                              ? 'text-orange-600'
                              : riesgoSLA === 'amarillo'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}>
                            {factura.diasTranscurridos}d
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirDialogDetalle(factura)}
                              className="border-slate-300 text-slate-700 hover:bg-slate-100"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Detalle
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => abrirDialogPagar(factura)} 
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Pagar
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
      </motion.div>

      {/* Dialog Detalle */}
      <Dialog open={mostrarDialogDetalle} onOpenChange={setMostrarDialogDetalle}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <FileText className="w-5 h-5 text-blue-600" />
              Detalle de Factura - {facturaSeleccionada?.numeroFactura}
            </DialogTitle>
          </DialogHeader>
          
          {facturaSeleccionada && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <Label className="text-slate-500 text-xs">Proveedor</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">NIT</Label>
                  <p className="font-mono text-slate-800">{facturaSeleccionada.nit}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">Valor Total</Label>
                  <p className="font-semibold text-green-700 text-lg">
                    ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">Proceso de Pago</Label>
                  <p className="font-mono text-slate-800">{facturaSeleccionada.numeroProcesoPago}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">Comprobante Egreso</Label>
                  <p className="font-mono text-slate-800">{facturaSeleccionada.comprobanteEgreso}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">Centro de Costos</Label>
                  <p className="font-mono text-slate-800">{facturaSeleccionada.centroCosto || '-'}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="text-blue-900 text-xs uppercase font-semibold">Descripción</Label>
                <p className="text-blue-800 mt-2">{facturaSeleccionada.descripcion}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-green-100 rounded-lg">
                  <p className="text-green-700">Aprobación Dirección</p>
                  <p className="font-semibold text-green-800 mt-1">{facturaSeleccionada.fechaAprobacionDireccion}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg border-2 border-green-500">
                  <p className="text-green-700 font-bold">Aprobación Rectoría</p>
                  <p className="font-semibold text-green-800 mt-1">{facturaSeleccionada.fechaAprobacionRectoria}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogDetalle(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Pagar */}
      <Dialog open={mostrarDialogPagar} onOpenChange={setMostrarDialogPagar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <DollarSign className="w-5 h-5 text-green-600" />
              Ejecutar Pago - {facturaSeleccionada?.numeroFactura}
            </DialogTitle>
            <DialogDescription>
              Registrar el pago efectivo al proveedor
            </DialogDescription>
          </DialogHeader>
          
          {facturaSeleccionada && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <Label className="text-slate-500 text-sm">Proveedor</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Valor a Pagar</Label>
                  <p className="font-semibold text-green-700 text-lg">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Comprobante Egreso</Label>
                  <p className="font-mono text-slate-800">{facturaSeleccionada.comprobanteEgreso}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Proceso de Pago</Label>
                  <p className="font-mono text-slate-800">{facturaSeleccionada.numeroProcesoPago}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">
                  Medio de Pago <span className="text-red-600">*</span>
                </Label>
                <Select value={medioPago} onValueChange={setMedioPago}>
                  <SelectTrigger className="border-slate-300 focus:border-green-600 focus:ring-green-600">
                    <SelectValue placeholder="Seleccione el medio de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="pse">Pago PSE</SelectItem>
                    <SelectItem value="ach">ACH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">
                  Número de Transacción / Referencia <span className="text-red-600">*</span>
                </Label>
                <Input
                  value={numeroTransaccion}
                  onChange={(e) => setNumeroTransaccion(e.target.value)}
                  placeholder="Ej: TRX-8901234567 o REF-BANCO-2026-123"
                  className="border-slate-300 focus:border-green-600 focus:ring-green-600 font-mono"
                />
                <p className="text-xs text-slate-500">
                  Número de referencia bancaria o número de transacción
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Soporte de Pago (Opcional)</Label>
                <div className="flex items-center gap-2">
                  {archivoSoporte ? (
                    <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-mono">{archivoSoporte}</p>
                    </div>
                  ) : (
                    <Button 
                      type="button"
                      onClick={simularCargaArchivo}
                      variant="outline" 
                      className="w-full border-dashed border-slate-300 hover:border-green-500 hover:bg-green-50"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Cargar soporte de pago (PDF, imagen)
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-500">Adjuntar comprobante de la transacción bancaria</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Observaciones (Opcional)</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones sobre el pago..."
                  className="min-h-[80px] border-slate-300 focus:border-green-600 focus:ring-green-600"
                />
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900 text-sm">Proceso de Pago</p>
                    <p className="text-xs text-green-700 mt-1">
                      • Se registrará el medio y número de transacción<br />
                      • El estado cambiará a "Pagada"<br />
                      • Se cerrará el proceso de la factura<br />
                      • Se notificará al proveedor y áreas involucradas<br />
                      • El trámite estará completado
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogPagar(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={ejecutarPago} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 text-white">
              {isProcessing ? 'Procesando...' : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Pago
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
