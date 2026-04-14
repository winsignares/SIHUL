import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { 
  FileCheck, Calendar, CheckCircle2, FileText, Eye, AlertCircle, 
  XCircle, TrendingUp, Building2, Download, Building, DollarSign
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import TableFilters from '../ui/table-filters';
import FacturaDetailModal from '../ui/factura-detail-modal';

interface Factura {
  id: string;
  numeroFactura: string;
  numeroRadicado: string;
  proveedor: string;
  nit: string;
  valorTotal: number;
  fechaRecepcion: string;
  fechaRadicacion: string;
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
    montoMax: ''
  });

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
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
      fechaRecepcion: '2026-03-19',
      fechaRadicacion: '2026-03-23',
      fechaCausacion: '2026-03-25',
      cuentaContable: '5165-001',
      centroCosto: 'CC-007',
      areaSolicitante: 'Sistemas',
      estado: 'Causada',
      diasTranscurridos: 8,
      descripcion: 'Servicios de mantenimiento de infraestructura tecnológica'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-006',
      numeroRadicado: 'RAD-2026-089',
      proveedor: 'Servicios de Aseo Total',
      nit: '900234567-8',
      valorTotal: 4200000,
      fechaRecepcion: '2026-03-14',
      fechaRadicacion: '2026-03-23',
      fechaCausacion: '2026-03-24',
      cuentaContable: '5135-001',
      centroCosto: 'CC-008',
      areaSolicitante: 'Servicios Generales',
      estado: 'Causada',
      diasTranscurridos: 13,
      descripcion: 'Servicios de aseo y mantenimiento general'
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-012',
      numeroRadicado: 'RAD-2026-090',
      proveedor: 'Mantenimiento Integral EU',
      nit: '900345678-9',
      valorTotal: 6750000,
      fechaRecepcion: '2026-03-20',
      fechaRadicacion: '2026-03-22',
      fechaCausacion: '2026-03-26',
      cuentaContable: '5125-001',
      centroCosto: 'CC-008',
      areaSolicitante: 'Mantenimiento',
      estado: 'Causada',
      diasTranscurridos: 7,
      descripcion: 'Reparaciones de infraestructura física'
    }
  ];

  const facturasFiltradas = facturasCausadas.filter(factura => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) {
      return false;
    }
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) {
      return false;
    }
    if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) {
      return false;
    }
    if (filtros.fechaInicio && new Date(factura.fechaCausacion) < new Date(filtros.fechaInicio)) {
      return false;
    }
    if (filtros.fechaFin && new Date(factura.fechaCausacion) > new Date(filtros.fechaFin)) {
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

  const abrirDialogAlistar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    // Generar número de proceso de pago sugerido
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
    setFacturaSeleccionada(factura);
    setMostrarDialogDetalle(true);
  };

  const alistarPago = () => {
    if (!facturaSeleccionada) return;

    if (!numeroProcesoPago.trim()) {
      toast.error('Campos requeridos', {
        description: 'Debe completar el número de proceso de pago'
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      toast.success('¡Pago alistado exitosamente!', {
        description: `${facturaSeleccionada.numeroFactura} - Estado: Alistada - Proceso: ${numeroProcesoPago}`
      });

      setIsProcessing(false);
      setMostrarDialogAlistar(false);
      setFacturaSeleccionada(null);
    }, 1500);
  };

  const devolverFactura = () => {
    if (!facturaSeleccionada) return;
    if (!motivoDevolucion.trim()) {
      toast.error('Motivo obligatorio', {
        description: 'Debe indicar el motivo de la devolución'
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      toast.warning('Factura devuelta a Contabilidad', {
        description: `${facturaSeleccionada.numeroFactura} - Se ha notificado a Contabilidad para corrección`
      });

      setIsProcessing(false);
      setMostrarDialogDevolver(false);
      setFacturaSeleccionada(null);
      setMotivoDevolucion('');
    }, 1200);
  };

  const generarArchivoPlano = () => {
    if (!facturaSeleccionada) return;
    const nombreArchivo = `PAGO_${facturaSeleccionada.numeroFactura.replace(/-/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    setArchivoPlano(nombreArchivo);
    toast.success('Archivo plano generado', {
      description: nombreArchivo
    });
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
            <FileCheck className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1">Alistar Pagos</h1>
            <p className="text-red-100 text-sm">
              Preparar archivo plano y número de proceso de pago para el aplicativo financiero
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filtros Independientes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Filtros de Búsqueda Independientes
            </CardTitle>
            <CardDescription>Filtre por columna específica usando los campos independientes</CardDescription>
          </CardHeader>
          <CardContent>
            <TableFilters
              filters={filtros}
              onFilterChange={setFiltros}
              estados={['Causada']}
              proveedores={Array.from(new Set(facturasCausadas.map(f => f.proveedor)))}
              areas={Array.from(new Set(facturasCausadas.map(f => f.areaSolicitante)))}
              showMontoFilter={true}
              showFechaFilter={true}
              showAreaFilter={true}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Facturas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800">Facturas Causadas Pendientes</CardTitle>
                <CardDescription>{facturasFiltradas.length} factura(s) lista(s) para alistar</CardDescription>
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-lg px-4 py-2">
                {facturasFiltradas.length} Por Alistar
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
                    <TableHead className="font-semibold text-slate-700">N° Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                    <TableHead className="font-semibold text-slate-700">Centro Costo</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha Causación</TableHead>
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
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 border font-mono text-xs">
                            {factura.numeroRadicado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-[180px] truncate" title={factura.proveedor}>
                          {factura.proveedor}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{factura.nit}</TableCell>
                        <TableCell className="font-semibold text-slate-800">
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
                            {factura.fechaCausacion}
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
                              onClick={() => abrirDialogDevolver(factura)}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Devolver
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => abrirDialogAlistar(factura)} 
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <FileCheck className="w-4 h-4 mr-1" />
                              Alistar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirDialogDetalle(factura)}
                              className="border-slate-300 text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Detalle
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

      {/* Dialog Alistar */}
      <Dialog open={mostrarDialogAlistar} onOpenChange={setMostrarDialogAlistar}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileCheck className="w-6 h-6 text-blue-600" />
              <span>Alistar Pago - Tesorería (RF05)</span>
            </DialogTitle>
            <DialogDescription>
              Generar número de proceso de pago y archivo plano para el aplicativo financiero. Revise cuidadosamente antes de alistar.
            </DialogDescription>
          </DialogHeader>
          
          {facturaSeleccionada && (
            <div className="space-y-6">
              {/* INFORMACIÓN PRINCIPAL */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border-2 border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-300 pb-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Información de la Factura
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Número de Factura</Label>
                    <p className="font-bold text-slate-800 text-lg">{facturaSeleccionada.numeroFactura}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Número de Radicado</Label>
                    <p className="font-mono font-semibold text-blue-700">{facturaSeleccionada.numeroRadicado}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Estado Actual</Label>
                    <Badge className="bg-blue-600 text-white">
                      {facturaSeleccionada.estado}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Proveedor</Label>
                    <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                    <p className="text-sm text-slate-600">NIT: {facturaSeleccionada.nit}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Área Solicitante</Label>
                    <Badge variant="outline" className="text-sm font-medium">
                      {facturaSeleccionada.areaSolicitante}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Cuenta Contable</Label>
                    <p className="font-mono text-purple-700 font-semibold">{facturaSeleccionada.cuentaContable}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Centro de Costo</Label>
                    <p className="font-mono text-cyan-700 font-semibold">{facturaSeleccionada.centroCosto || 'N/A'}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <Label className="text-xs text-slate-500 mb-1">Descripción del Servicio/Producto</Label>
                  <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">
                    {facturaSeleccionada.descripcion}
                  </p>
                </div>
              </div>

              {/* INFORMACIÓN FINANCIERA */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                <h3 className="font-bold text-green-800 text-lg flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5" />
                  Información Financiera
                </h3>
                <div className="bg-white p-4 rounded-lg border-2 border-green-300">
                  <Label className="text-xs text-green-600 mb-1">Monto Total a Pagar</Label>
                  <p className="font-bold text-green-700 text-3xl">
                    ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              {/* TIMELINE DE FECHAS */}
              <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                <Label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timeline del Proceso
                </Label>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Recepción</p>
                    <p className="font-semibold text-slate-700">{facturaSeleccionada.fechaRecepcion}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Radicación</p>
                    <p className="font-semibold text-slate-700">{facturaSeleccionada.fechaRadicacion}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-300">
                    <p className="text-xs text-blue-700 font-semibold mb-1">Causación</p>
                    <p className="font-bold text-blue-800">{facturaSeleccionada.fechaCausacion}</p>
                  </div>
                </div>
              </div>

              {/* ALISTAMIENTO - ACCIÓN PRINCIPAL */}
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 space-y-4">
                <h3 className="font-bold text-blue-800 text-lg flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Alistamiento de Pago
                </h3>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Número de Proceso de Pago <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    value={numeroProcesoPago}
                    onChange={(e) => setNumeroProcesoPago(e.target.value)}
                    placeholder="Ej: PP-2026-245"
                    className="border-blue-300 focus:border-blue-600 focus:ring-blue-600 font-mono text-base"
                  />
                  <p className="text-xs text-slate-600">
                    Número único para el aplicativo financiero y portal bancario
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Archivo Plano para el Banco</Label>
                  <div className="flex gap-2">
                    <Input
                      value={archivoPlano}
                      readOnly
                      placeholder="Haga clic en Generar para crear el archivo..."
                      className="border-blue-300 bg-slate-50 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      onClick={generarArchivoPlano}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-100 whitespace-nowrap"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Generar
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600">
                    Archivo para cargue en portal bancario externo
                  </p>
                </div>
              </div>

              {/* CAMPO DE OBSERVACIONES */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <Label className="text-sm font-semibold text-slate-700">
                  Observaciones sobre el Alistamiento <span className="text-slate-500">(Opcional)</span>
                </Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Agregue observaciones adicionales sobre el proceso de alistamiento si lo considera necesario..."
                  className="min-h-[80px] resize-none border-slate-300"
                  rows={3}
                />
              </div>

              {/* INFORMACIÓN DEL SIGUIENTE PASO */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-blue-800">
                    <p className="font-semibold mb-1">¿Qué sucede después de alistar?</p>
                    <p className="text-sm">
                      • Se generará el número de proceso de pago<br />
                      • Se preparará el archivo plano para el banco<br />
                      • El estado cambiará a <strong>"Alistada"</strong><br />
                      • Se enviará a <strong>Auditoría</strong> para control previo<br />
                      • <span className="font-semibold text-orange-700">⚠️ NO se genera comprobante de egreso en esta etapa</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setMostrarDialogAlistar(false);
                setNumeroProcesoPago('');
                setArchivoPlano('');
                setObservaciones('');
              }} 
              disabled={isProcessing}
              className="border-slate-300"
            >
              Cancelar
            </Button>
            <Button 
              onClick={alistarPago} 
              disabled={isProcessing || !numeroProcesoPago.trim()} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Alistamiento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Devolver */}
      <Dialog open={mostrarDialogDevolver} onOpenChange={setMostrarDialogDevolver}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <XCircle className="w-6 h-6 text-red-600" />
              <span>Devolver Factura a Contabilidad</span>
            </DialogTitle>
            <DialogDescription>
              Indique el motivo de la devolución. La factura será devuelta a Contabilidad para corrección.
            </DialogDescription>
          </DialogHeader>
          
          {facturaSeleccionada && (
            <div className="space-y-6">
              {/* INFORMACIÓN PRINCIPAL */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border-2 border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-300 pb-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Información de la Factura
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Número de Factura</Label>
                    <p className="font-bold text-slate-800 text-lg">{facturaSeleccionada.numeroFactura}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Número de Radicado</Label>
                    <p className="font-mono font-semibold text-blue-700">{facturaSeleccionada.numeroRadicado}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Estado Actual</Label>
                    <Badge className="bg-blue-600 text-white">
                      {facturaSeleccionada.estado}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Proveedor</Label>
                    <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                    <p className="text-sm text-slate-600">NIT: {facturaSeleccionada.nit}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Área Solicitante</Label>
                    <Badge variant="outline" className="text-sm font-medium">
                      {facturaSeleccionada.areaSolicitante}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Cuenta Contable</Label>
                    <p className="font-mono text-purple-700 font-semibold">{facturaSeleccionada.cuentaContable}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Monto Total</Label>
                    <p className="font-bold text-green-700 text-xl">
                      ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <Label className="text-xs text-slate-500 mb-1">Descripción</Label>
                  <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">
                    {facturaSeleccionada.descripcion}
                  </p>
                </div>
              </div>

              {/* CAMPO DE MOTIVO DE DEVOLUCIÓN */}
              <div className="bg-red-50 p-6 rounded-xl border-2 border-red-200 space-y-3">
                <Label className="text-sm font-semibold text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Motivo de Devolución <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  value={motivoDevolucion}
                  onChange={(e) => setMotivoDevolucion(e.target.value)}
                  placeholder="Describa detalladamente el motivo de la devolución (OBLIGATORIO). Indique qué debe corregir Contabilidad..."
                  className="min-h-[120px] resize-none border-red-300 focus:border-red-600 bg-white"
                  required
                  rows={5}
                />
                <p className="text-xs text-red-700">
                  El motivo es obligatorio y debe ser específico sobre el error detectado
                </p>
              </div>

              {/* INFORMACIÓN DEL SIGUIENTE PASO */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-yellow-800">
                    <p className="font-semibold mb-1">¿Qué sucede al devolver?</p>
                    <p className="text-sm">
                      • La factura volverá al estado anterior<br />
                      • Se notificará a <strong>Contabilidad</strong> con el motivo<br />
                      • El trámite quedará <strong>detenido</strong> hasta corrección<br />
                      • Contabilidad deberá realizar los ajustes necesarios
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setMostrarDialogDevolver(false);
                setMotivoDevolucion('');
              }} 
              disabled={isProcessing}
              className="border-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={devolverFactura}
              disabled={isProcessing || !motivoDevolucion.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Procesando...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirmar Devolución
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle */}
      <FacturaDetailModal
        factura={facturaSeleccionada}
        isOpen={mostrarDialogDetalle}
        onClose={() => setMostrarDialogDetalle(false)}
      />
    </div>
  );
}