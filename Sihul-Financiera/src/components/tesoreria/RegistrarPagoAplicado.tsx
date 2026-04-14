import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { CheckCircle, Search, Filter, Calendar, FileText, Eye, Building, AlertCircle, CreditCard, ExternalLink } from 'lucide-react';
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
  cuentaContable: string;
  centroCosto: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
}

export default function RegistrarPagoAplicado() {
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
  const [mostrarDialogRegistrar, setMostrarDialogRegistrar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [numeroTransaccion, setNumeroTransaccion] = useState('');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [archivoComprobante, setArchivoComprobante] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Facturas con estado "Autorizada para pago" (ya autorizadas por Rectoría y aplicadas en banco)
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
      cuentaContable: '5180-001',
      centroCosto: 'CC-010',
      estado: 'Autorizada para pago',
      diasTranscurridos: 1,
      descripcion: 'Obra construcción bloque D - Pago parcial'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-020',
      numeroRadicado: 'RAD-2026-00118',
      numeroProcesoPago: 'PP-2026-0095',
      proveedor: 'Equipos Médicos Especializados',
      nit: '900234567-8',
      valorTotal: 28500000,
      fechaAutorizacion: '2026-04-02',
      areaSolicitante: 'Ciencias de la Salud',
      cuentaContable: '5160-002',
      centroCosto: 'CC-012',
      estado: 'Autorizada para pago',
      diasTranscurridos: 0,
      descripcion: 'Equipamiento laboratorio de fisiología'
    }
  ];

  // Columnas para filtros independientes
  const columnasParaFiltrar = [
    { key: 'numeroFactura', label: 'Nº Factura' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'areaSolicitante', label: 'Área' }
  ];

  const facturasFiltradas = facturasAutorizadas.filter(factura => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) {
      return false;
    }
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) {
      return false;
    }
    if (filtros.areaSolicitante && !factura.areaSolicitante.toLowerCase().includes(filtros.areaSolicitante.toLowerCase())) {
      return false;
    }
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) {
      return false;
    }
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) {
      return false;
    }
    if (filtros.fechaInicio && factura.fechaAutorizacion < filtros.fechaInicio) {
      return false;
    }
    if (filtros.fechaFin && factura.fechaAutorizacion > filtros.fechaFin) {
      return false;
    }
    return true;
  });

  const abrirDialogRegistrar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setNumeroTransaccion('');
    setFechaPago(new Date().toISOString().split('T')[0]);
    setArchivoComprobante('');
    setObservaciones('');
    setMostrarDialogRegistrar(true);
  };

  const handleVerDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMostrarDialogDetalle(true);
  };

  const registrarPago = () => {
    if (!facturaSeleccionada) return;
    
    if (!numeroTransaccion.trim()) {
      toast.error('Error de validación', {
        description: 'Debe ingresar el número de transacción bancaria del pago ejecutado'
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      toast.success('¡Pago aplicado registrado exitosamente!', {
        description: `${facturaSeleccionada.numeroFactura} - Estado: Pago aplicado - Listo para generar comprobante de egreso`
      });

      setIsProcessing(false);
      setMostrarDialogRegistrar(false);
      setFacturaSeleccionada(null);
      setNumeroTransaccion('');
      setObservaciones('');
      setArchivoComprobante('');
    }, 2000);
  };

  return (
    <>
      <div className="p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-white mb-1">Registrar Pago Aplicado</h1>
              <p className="text-red-100 text-sm">
                Registre en el sistema los pagos que ya fueron aplicados en el portal bancario externo
              </p>
            </div>
            <div className="bg-blue-500/20 border border-blue-300/30 rounded-lg px-4 py-2">
              <p className="text-blue-100 text-xs font-medium">ℹ️ Información</p>
              <p className="text-white text-sm font-semibold">El pago se ejecuta en el banco</p>
            </div>
          </div>
        </motion.div>

        {/* Filtros Independientes por Columna */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Filter className="w-5 h-5 text-red-600" />
                Filtros de Búsqueda Independientes
              </CardTitle>
              <CardDescription>Filtre por columna específica usando los campos independientes</CardDescription>
            </CardHeader>
            <CardContent>
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

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-0 shadow-lg border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-semibold">Pagos Autorizados</p>
                    <p className="text-3xl font-bold text-green-800 mt-1">{facturasFiltradas.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-lg border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-sm font-semibold">Monto Total</p>
                    <p className="text-2xl font-bold text-blue-800 mt-1">
                      ${facturasFiltradas.reduce((sum, f) => sum + f.valorTotal, 0).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-0 shadow-lg border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-700 text-sm font-semibold">Por Registrar</p>
                    <p className="text-3xl font-bold text-purple-800 mt-1">{facturasFiltradas.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabla de Pagos Autorizados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Pagos Autorizados (Ejecutados en Portal Bancario)</CardTitle>
                  <CardDescription>
                    {facturasFiltradas.length} pago(s) ejecutado(s) en el banco pendiente(s) de registro en el sistema
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200 border text-lg px-4 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {facturasFiltradas.length} Autorizados
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">Nº Factura</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">Área</TableHead>
                      <TableHead className="font-semibold text-slate-700">N° Proceso</TableHead>
                      <TableHead className="font-semibold text-slate-700">F. Autorización</TableHead>
                      <TableHead className="font-semibold text-slate-700">Días</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasFiltradas.map((factura, index) => (
                      <motion.tr
                        key={factura.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <TableCell className="font-medium text-slate-800">
                          {factura.numeroFactura}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">{factura.proveedor}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-green-700 text-base">
                          ${factura.valorTotal.toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {factura.areaSolicitante}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 border font-mono text-xs">
                            {factura.numeroProcesoPago}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3" />
                            {factura.fechaAutorizacion}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              factura.diasTranscurridos >= 2
                                ? 'bg-orange-100 text-orange-700 border-orange-300'
                                : 'bg-green-100 text-green-700 border-green-300'
                            } border text-xs`}
                          >
                            {factura.diasTranscurridos}d
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerDetalle(factura)}
                              className="border-slate-300 text-slate-700 hover:bg-slate-100"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => abrirDialogRegistrar(factura)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Registrar
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>

                {facturasFiltradas.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No se encontraron pagos autorizados con los filtros aplicados</p>
                    <p className="text-sm mt-1">Intente ajustar los criterios de búsqueda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dialog Registrar Pago Aplicado */}
      <Dialog open={mostrarDialogRegistrar} onOpenChange={setMostrarDialogRegistrar}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Registrar Pago Ejecutado en Portal Bancario
            </DialogTitle>
            <DialogDescription>
              Registre en el sistema el pago que ya fue aplicado en el portal bancario externo
            </DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              {/* Información de la factura */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-2 mb-3">
                  <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 text-sm">Importante: El pago se ejecuta fuera del sistema</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Este módulo NO ejecuta pagos. Solo registra en el sistema los pagos que YA fueron aplicados
                      manualmente en el <strong>portal bancario externo</strong> por el personal autorizado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500">Número de Factura</Label>
                    <p className="font-mono font-bold text-slate-800">{facturaSeleccionada.numeroFactura}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">N° Proceso de Pago</Label>
                    <p className="font-mono font-semibold text-blue-700">{facturaSeleccionada.numeroProcesoPago}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Proveedor</Label>
                    <p className="text-sm text-slate-700">{facturaSeleccionada.proveedor}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">NIT</Label>
                    <p className="text-sm font-mono text-slate-700">{facturaSeleccionada.nit}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-500">Monto Pagado</Label>
                    <p className="font-bold text-green-700 text-2xl">
                      ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Datos del pago ejecutado */}
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-green-600" />
                  Datos del Pago Ejecutado en el Banco
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numeroTransaccion">
                      Número de Transacción Bancaria <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="numeroTransaccion"
                      placeholder="Ej: TRX-20260402-001234"
                      value={numeroTransaccion}
                      onChange={(e) => setNumeroTransaccion(e.target.value)}
                      className="border-slate-300 focus:border-green-600 focus:ring-green-600"
                    />
                    <p className="text-xs text-slate-500">Número de confirmación del portal bancario</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaPago">Fecha de Pago</Label>
                    <Input
                      id="fechaPago"
                      type="date"
                      value={fechaPago}
                      onChange={(e) => setFechaPago(e.target.value)}
                      className="border-slate-300 focus:border-green-600 focus:ring-green-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="archivoComprobante">Comprobante Bancario (Opcional)</Label>
                  <Input
                    id="archivoComprobante"
                    placeholder="Nombre del archivo de comprobante bancario..."
                    value={archivoComprobante}
                    onChange={(e) => setArchivoComprobante(e.target.value)}
                    className="border-slate-300 focus:border-green-600 focus:ring-green-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
                  <Textarea
                    id="observaciones"
                    placeholder="Observaciones sobre el pago ejecutado..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    className="resize-none border-slate-300 focus:border-green-600 focus:ring-green-600"
                  />
                </div>
              </div>

              {/* Información del flujo */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold mb-1">Próximo paso del flujo:</p>
                    <p>
                      Después de registrar el pago aplicado, podrá generar el <strong>Comprobante de Egreso</strong>
                      desde el módulo correspondiente para completar el proceso.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMostrarDialogRegistrar(false);
                setFacturaSeleccionada(null);
                setNumeroTransaccion('');
                setObservaciones('');
                setArchivoComprobante('');
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={registrarPago}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Registro de Pago
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle */}
      <FacturaDetailModal
        factura={facturaSeleccionada}
        isOpen={mostrarDialogDetalle}
        onClose={() => {
          setMostrarDialogDetalle(false);
          setFacturaSeleccionada(null);
        }}
      />
    </>
  );
}