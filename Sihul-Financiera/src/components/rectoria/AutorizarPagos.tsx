import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { CheckSquare, Search, Filter, Calendar, CheckCircle2, XCircle, FileText, Eye, Building, AlertCircle, DollarSign } from 'lucide-react';
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
  fechaCargue: string;
  areaSolicitante: string;
  cuentaContable: string;
  centroCosto: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
  observacionesDirFinanciera?: string;
}

export default function AutorizarPagos() {
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
  const [accion, setAccion] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [motivo, setMotivo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Facturas cargadas por Dirección Financiera pendientes de autorización
  const facturasCargadas: Factura[] = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-018',
      numeroRadicado: 'RAD-2026-00115',
      numeroProcesoPago: 'PP-2026-0092',
      proveedor: 'Construcciones Universitarias SAS',
      nit: '900123456-7',
      valorTotal: 45000000,
      fechaCargue: '2026-04-01',
      areaSolicitante: 'Infraestructura',
      cuentaContable: '5180-001',
      centroCosto: 'CC-010',
      estado: 'Cargada para autorización',
      diasTranscurridos: 1,
      descripcion: 'Obra construcción bloque D - Pago parcial',
      observacionesDirFinanciera: 'Cargue formal completado. Todo en orden.'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-020',
      numeroRadicado: 'RAD-2026-00118',
      numeroProcesoPago: 'PP-2026-0095',
      proveedor: 'Equipos Médicos Especializados',
      nit: '900234567-8',
      valorTotal: 28500000,
      fechaCargue: '2026-04-02',
      areaSolicitante: 'Ciencias de la Salud',
      cuentaContable: '5160-002',
      centroCosto: 'CC-012',
      estado: 'Cargada para autorización',
      diasTranscurridos: 0,
      descripcion: 'Equipamiento laboratorio de fisiología',
      observacionesDirFinanciera: 'Cargado sin observaciones.'
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-022',
      numeroRadicado: 'RAD-2026-00120',
      numeroProcesoPago: 'PP-2026-0097',
      proveedor: 'Tecnología Educativa Global',
      nit: '900345678-9',
      valorTotal: 15200000,
      fechaCargue: '2026-04-01',
      areaSolicitante: 'Sistemas',
      cuentaContable: '5165-001',
      centroCosto: 'CC-007',
      estado: 'Cargada para autorización',
      diasTranscurridos: 1,
      descripcion: 'Licencias software educativo anual',
      observacionesDirFinanciera: 'Proceso completado correctamente.'
    },
    {
      id: '4',
      numeroFactura: 'FAC-2026-024',
      numeroRadicado: 'RAD-2026-00122',
      numeroProcesoPago: 'PP-2026-0099',
      proveedor: 'Servicios de Consultoría Académica',
      nit: '900456789-0',
      valorTotal: 22400000,
      fechaCargue: '2026-03-31',
      areaSolicitante: 'Vicerrectoría Académica',
      cuentaContable: '5170-001',
      centroCosto: 'CC-015',
      estado: 'Cargada para autorización',
      diasTranscurridos: 2,
      descripcion: 'Consultoría proceso de acreditación',
      observacionesDirFinanciera: 'Cargue urgente. Requiere autorización pronta.'
    }
  ];

  // Columnas para filtros independientes
  const columnasParaFiltrar = [
    { key: 'numeroFactura', label: 'Nº Factura' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'areaSolicitante', label: 'Área' }
  ];

  const facturasFiltradas = facturasCargadas.filter(factura => {
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
    if (filtros.fechaInicio && factura.fechaCargue < filtros.fechaInicio) {
      return false;
    }
    if (filtros.fechaFin && factura.fechaCargue > filtros.fechaFin) {
      return false;
    }
    return true;
  });

  const abrirDialog = (factura: Factura, accionSeleccionada: 'aprobar' | 'rechazar') => {
    setFacturaSeleccionada(factura);
    setAccion(accionSeleccionada);
    setMotivo('');
    setMostrarDialog(true);
  };

  const handleVerDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMostrarDialogDetalle(true);
  };

  const procesarAutorizacion = () => {
    if (!facturaSeleccionada) return;

    if (accion === 'rechazar' && !motivo.trim()) {
      toast.error('Motivo requerido', {
        description: 'Debe registrar el motivo del rechazo para devolver a Dirección Financiera'
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      if (accion === 'aprobar') {
        toast.success('¡Pago autorizado por Rectoría!', {
          description: `${facturaSeleccionada.numeroFactura} - Estado: Autorizada para pago - Enviado a Dir. Financiera para aplicación`
        });
      } else {
        toast.warning('Pago rechazado por Rectoría', {
          description: `${facturaSeleccionada.numeroFactura} - Estado: Rechazada por rectoría - Devuelto a Dir. Financiera`
        });
      }

      setIsProcessing(false);
      setMostrarDialog(false);
      setFacturaSeleccionada(null);
      setMotivo('');
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
              <CheckSquare className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1">Autorizar Pagos (RF09)</h1>
              <p className="text-red-100 text-sm">
                Autorización final institucional de pagos cargados por Dirección Financiera - SLA: 3 días
              </p>
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
                estados={['Cargada para autorización']}
                proveedores={Array.from(new Set(facturasCargadas.map(f => f.proveedor)))}
                areas={Array.from(new Set(facturasCargadas.map(f => f.areaSolicitante)))}
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
            <Card className="border-0 shadow-lg border-indigo-200 bg-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-700 text-sm font-semibold">Pendientes Autorización</p>
                    <p className="text-3xl font-bold text-indigo-800 mt-1">{facturasFiltradas.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-indigo-700" />
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
                    <FileText className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-0 shadow-lg border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-700 text-sm font-semibold">SLA Máximo</p>
                    <p className="text-3xl font-bold text-orange-800 mt-1">3d</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabla de Pagos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Pagos Cargados para Autorización</CardTitle>
                  <CardDescription>
                    {facturasFiltradas.length} pago(s) cargado(s) por Dirección Financiera pendiente(s) de autorización
                  </CardDescription>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 border text-lg px-4 py-2">
                  {facturasFiltradas.length} Por Autorizar
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
                      <TableHead className="font-semibold text-slate-700">F. Cargue</TableHead>
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
                        <TableCell className="font-bold text-blue-700 text-base">
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
                            {factura.fechaCargue}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              factura.diasTranscurridos >= 3
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : factura.diasTranscurridos >= 2
                                ? 'bg-orange-100 text-orange-700 border-orange-300'
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
                              onClick={() => abrirDialog(factura, 'aprobar')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Autorizar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => abrirDialog(factura, 'rechazar')}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
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
                    <p className="font-medium">No se encontraron pagos con los filtros aplicados</p>
                    <p className="text-sm mt-1">Intente ajustar los criterios de búsqueda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dialog Autorizar/Rechazar */}
      <Dialog open={mostrarDialog} onOpenChange={setMostrarDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {accion === 'aprobar' ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span>Autorizar Pago - Rectoría (RF09)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span>Rechazar Pago - Rectoría (RF09)</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {accion === 'aprobar'
                ? 'Revise cuidadosamente antes de autorizar. Al aprobar, Dirección Financiera procederá con la aplicación del pago en el portal bancario.'
                : 'Indique el motivo del rechazo. El trámite será devuelto a Dirección Financiera para correcciones.'}
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
                    <Label className="text-xs text-slate-500 mb-1">N° Proceso de Pago</Label>
                    <p className="font-mono font-semibold text-purple-700">{facturaSeleccionada.numeroProcesoPago}</p>
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
                    <p className="font-mono text-slate-700">{facturaSeleccionada.cuentaContable}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Centro de Costo</Label>
                    <p className="font-mono text-slate-700">{facturaSeleccionada.centroCosto}</p>
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

              {/* ESTADO Y TIEMPO */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <Label className="text-xs text-blue-600 mb-2">Estado Actual</Label>
                  <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                    {facturaSeleccionada.estado}
                  </Badge>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <Label className="text-xs text-orange-600 mb-2">Días en Proceso</Label>
                  <p className="font-bold text-orange-700 text-2xl">
                    {facturaSeleccionada.diasTranscurridos} días
                  </p>
                </div>
              </div>

              {/* OBSERVACIONES DE DIRECCIÓN FINANCIERA */}
              {facturaSeleccionada.observacionesDirFinanciera && (
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <Label className="text-xs text-blue-700 font-semibold mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Observaciones de Dirección Financiera
                  </Label>
                  <p className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-300">
                    {facturaSeleccionada.observacionesDirFinanciera}
                  </p>
                </div>
              )}

              {/* CAMPO DE OBSERVACIONES/MOTIVO DE RECTORÍA */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <Label className="text-sm font-semibold text-slate-700">
                  {accion === 'aprobar' ? (
                    <>Observaciones de Rectoría <span className="text-slate-500">(Opcional)</span></>
                  ) : (
                    <>Motivo del Rechazo <span className="text-red-600">*</span></>
                  )}
                </Label>
                <Textarea
                  id="motivo"
                  placeholder={
                    accion === 'aprobar'
                      ? 'Agregue observaciones adicionales si lo considera necesario...'
                      : 'Explique detalladamente el motivo del rechazo para que Dirección Financiera pueda realizar las correcciones...'
                  }
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={4}
                  className={`resize-none ${
                    accion === 'aprobar'
                      ? 'border-slate-300'
                      : 'border-red-300 focus:border-red-600'
                  }`}
                />
              </div>

              {/* INFORMACIÓN DEL SIGUIENTE PASO */}
              <div className={`${accion === 'aprobar' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'} border-2 rounded-lg p-4`}>
                <div className="flex items-start gap-3">
                  {accion === 'aprobar' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className={accion === 'aprobar' ? 'text-green-800' : 'text-red-800'}>
                    <p className="font-semibold mb-1">
                      {accion === 'aprobar' ? '¿Qué sucede al autorizar?' : '¿Qué sucede al rechazar?'}
                    </p>
                    <p className="text-sm">
                      {accion === 'aprobar'
                        ? 'Dirección Financiera procederá a aplicar el pago en el portal bancario junto con Rectoría (RF10). Una vez aplicado, se enviará a Tesorería para generar el comprobante de egreso.'
                        : 'El trámite será devuelto a Dirección Financiera con su observación para que realicen las correcciones necesarias antes de volver a solicitar autorización.'}
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
                setMostrarDialog(false);
                setFacturaSeleccionada(null);
                setMotivo('');
              }}
              disabled={isProcessing}
              className="border-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={procesarAutorizacion}
              disabled={isProcessing || (accion === 'rechazar' && !motivo.trim())}
              className={accion === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
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
                  {accion === 'aprobar' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirmar Autorización
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Confirmar Rechazo
                    </>
                  )}
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