import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Upload, Search, Filter, Calendar, CheckCircle2, FileText, Eye, Building, AlertCircle } from 'lucide-react';
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
  fechaEnvio: string;
  areaSolicitante: string;
  cuentaContable: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
}

export default function CargarPagos() {
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
  const [mostrarDialog, setMostrarDialog] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Facturas enviadas por Tesorería después de aprobación de Auditoría
  const facturasEnviadas: Factura[] = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-004',
      numeroRadicado: 'RAD-2026-00095',
      numeroProcesoPago: 'PP-2026-0078',
      proveedor: 'Mantenimiento y Obras EU',
      nit: '900456789-0',
      valorTotal: 12500000,
      fechaEnvio: '2026-04-02',
      areaSolicitante: 'Mantenimiento',
      cuentaContable: '5135-001',
      estado: 'Enviada a Dirección Financiera',
      diasTranscurridos: 0,
      descripcion: 'Servicios de mantenimiento preventivo y correctivo edificio principal'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-007',
      numeroRadicado: 'RAD-2026-00098',
      numeroProcesoPago: 'PP-2026-0081',
      proveedor: 'Transporte Estudiantil SA',
      nit: '900567890-1',
      valorTotal: 7200000,
      fechaEnvio: '2026-04-02',
      areaSolicitante: 'Bienestar',
      cuentaContable: '5140-002',
      estado: 'Enviada a Dirección Financiera',
      diasTranscurridos: 0,
      descripcion: 'Servicio de transporte estudiantil mensual'
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-010',
      numeroRadicado: 'RAD-2026-00101',
      numeroProcesoPago: 'PP-2026-0084',
      proveedor: 'Editorial Académica',
      nit: '900678901-2',
      valorTotal: 4500000,
      fechaEnvio: '2026-04-01',
      areaSolicitante: 'Publicaciones',
      cuentaContable: '5155-001',
      estado: 'Enviada a Dirección Financiera',
      diasTranscurridos: 1,
      descripcion: 'Impresión de revista científica institucional'
    },
    {
      id: '4',
      numeroFactura: 'FAC-2026-013',
      numeroRadicado: 'RAD-2026-00104',
      numeroProcesoPago: 'PP-2026-0087',
      proveedor: 'Seguridad Privada Ltda.',
      nit: '900789012-3',
      valorTotal: 9500000,
      fechaEnvio: '2026-03-31',
      areaSolicitante: 'Seguridad',
      cuentaContable: '5125-001',
      estado: 'Enviada a Dirección Financiera',
      diasTranscurridos: 2,
      descripcion: 'Servicios de vigilancia y seguridad privada mensual'
    }
  ];

  // Columnas para filtros independientes
  const columnasParaFiltrar = [
    { key: 'numeroFactura', label: 'Nº Factura' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'areaSolicitante', label: 'Área' }
  ];

  const facturasFiltradas = facturasEnviadas.filter(factura => {
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
    if (filtros.fechaInicio && factura.fechaEnvio < filtros.fechaInicio) {
      return false;
    }
    if (filtros.fechaFin && factura.fechaEnvio > filtros.fechaFin) {
      return false;
    }
    return true;
  });

  const abrirDialog = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setObservaciones('');
    setMostrarDialog(true);
  };

  const handleVerDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMostrarDialogDetalle(true);
  };

  const cargarPago = () => {
    if (!facturaSeleccionada) return;
    setIsProcessing(true);

    setTimeout(() => {
      toast.success('¡Pago cargado por Dir. Financiera!', {
        description: `${facturaSeleccionada.numeroFactura} - Estado: Cargada para autorización - Enviado a Rectoría`
      });

      setIsProcessing(false);
      setMostrarDialog(false);
      setFacturaSeleccionada(null);
      setObservaciones('');
    }, 1500);
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
              <Upload className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1">Cargar Pagos (RF08)</h1>
              <p className="text-red-100 text-sm">Cargue formal de pago previo a autorización de Rectoría - SLA: 2 días</p>
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
                estados={['Enviada a Dirección Financiera']}
                proveedores={Array.from(new Set(facturasEnviadas.map(f => f.proveedor)))}
                areas={Array.from(new Set(facturasEnviadas.map(f => f.areaSolicitante)))}
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
            <Card className="border-0 shadow-lg border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-700 text-sm font-semibold">Facturas Pendientes</p>
                    <p className="text-3xl font-bold text-purple-800 mt-1">{facturasFiltradas.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-lg border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-semibold">Monto Total</p>
                    <p className="text-2xl font-bold text-green-800 mt-1">
                      ${facturasFiltradas.reduce((sum, f) => sum + f.valorTotal, 0).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-0 shadow-lg border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-sm font-semibold">SLA Máximo</p>
                    <p className="text-3xl font-bold text-blue-800 mt-1">2d</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabla de Facturas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Facturas Remitidas por Tesorería</CardTitle>
                  <CardDescription>
                    {facturasFiltradas.length} factura(s) aprobada(s) por Auditoría lista(s) para cargar
                  </CardDescription>
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 border text-lg px-4 py-2">
                  {facturasFiltradas.length} Por Cargar
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
                      <TableHead className="font-semibold text-slate-700">F. Envío</TableHead>
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
                        <TableCell className="font-semibold text-green-700">
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
                            {factura.fechaEnvio}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              factura.diasTranscurridos >= 2
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : factura.diasTranscurridos >= 1
                                ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
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
                              onClick={() => abrirDialog(factura)}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              Cargar
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
                    <p className="font-medium">No se encontraron facturas con los filtros aplicados</p>
                    <p className="text-sm mt-1">Intente ajustar los criterios de búsqueda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dialog Cargar */}
      <Dialog open={mostrarDialog} onOpenChange={setMostrarDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Upload className="w-5 h-5 text-purple-600" />
              Cargar Pago - {facturaSeleccionada?.numeroFactura}
            </DialogTitle>
            <DialogDescription>Registrar cargue formal para autorización de Rectoría (RF08)</DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <Label className="text-slate-500 text-sm">Proveedor</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Valor Total</Label>
                  <p className="font-semibold text-green-700 text-base">
                    ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Nº Proceso Pago</Label>
                  <p className="font-semibold text-blue-700 font-mono">{facturaSeleccionada.numeroProcesoPago}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Área Solicitante</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.areaSolicitante}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Observaciones (Opcional)</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones sobre el cargue..."
                  className="min-h-[100px] resize-none border-slate-300 focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-purple-900 text-sm">Flujo después del cargue (RF08)</p>
                    <p className="text-xs text-purple-700 mt-1">
                      • Se registrará el cargue formal del pago<br />
                      • El estado cambiará a <strong>"Cargada para autorización"</strong><br />
                      • Se enviará a <strong>Rectoría</strong> para aprobación final (RF09)<br />
                      • Posteriormente se aplicará en portal bancario (RF10)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMostrarDialog(false);
                setFacturaSeleccionada(null);
                setObservaciones('');
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={cargarPago}
              disabled={isProcessing}
              className="bg-purple-600 hover:bg-purple-700 text-white"
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
                  Confirmar Cargue
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