import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Send, Search, Filter, Eye, Calendar, CheckCircle2, FileText, AlertCircle, Building } from 'lucide-react';
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
    montoMax: ''
  });

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [mostrarDialogEnviar, setMostrarDialogEnviar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Facturas aprobadas por auditoría que debo enviar a Dirección Financiera
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
      estado: 'Aprobada por Auditoría',
      diasTranscurridos: 1,
      descripcion: 'Servicios de mantenimiento preventivo y correctivo edificio principal',
      observacionesAuditoria: 'Documentación completa. Aprobado para continuar.'
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
      estado: 'Aprobada por Auditoría',
      diasTranscurridos: 1,
      descripcion: 'Servicio de transporte estudiantil mensual',
      observacionesAuditoria: 'Todo en orden. Proceder con el pago.'
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-010',
      numeroRadicado: 'RAD-2026-00101',
      numeroProcesoPago: 'PP-2026-0084',
      proveedor: 'Editorial Académica',
      nit: '900678901-2',
      valorTotal: 4500000,
      fechaAprobacionAuditoria: '2026-03-31',
      areaSolicitante: 'Publicaciones',
      cuentaContable: '5155-001',
      estado: 'Aprobada por Auditoría',
      diasTranscurridos: 2,
      descripcion: 'Impresión de revista científica institucional',
      observacionesAuditoria: 'Cumple con todos los requisitos. Aprobado.'
    },
    {
      id: '4',
      numeroFactura: 'FAC-2026-013',
      numeroRadicado: 'RAD-2026-00104',
      numeroProcesoPago: 'PP-2026-0087',
      proveedor: 'Seguridad Privada Ltda.',
      nit: '900789012-3',
      valorTotal: 9500000,
      fechaAprobacionAuditoria: '2026-03-30',
      areaSolicitante: 'Seguridad',
      cuentaContable: '5125-001',
      estado: 'Aprobada por Auditoría',
      diasTranscurridos: 3,
      descripcion: 'Servicios de vigilancia y seguridad privada mensual',
      observacionesAuditoria: 'Verificado contrato vigente. OK para pago.'
    }
  ];

  // Columnas para filtros independientes
  const columnasParaFiltrar = [
    { key: 'numeroFactura', label: 'Nº Factura' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'areaSolicitante', label: 'Área' }
  ];

  const facturasFiltradas = facturasAprobadas.filter(factura => {
    // Filtro por número de factura
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) {
      return false;
    }
    // Filtro por proveedor
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) {
      return false;
    }
    // Filtro por área
    if (filtros.areaSolicitante && !factura.areaSolicitante.toLowerCase().includes(filtros.areaSolicitante.toLowerCase())) {
      return false;
    }
    // Filtro por monto mínimo
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) {
      return false;
    }
    // Filtro por monto máximo
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) {
      return false;
    }
    // Filtro por rango de fechas
    if (filtros.fechaInicio && factura.fechaAprobacionAuditoria < filtros.fechaInicio) {
      return false;
    }
    if (filtros.fechaFin && factura.fechaAprobacionAuditoria > filtros.fechaFin) {
      return false;
    }
    return true;
  });

  const abrirDialogEnviar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setObservaciones('');
    setMostrarDialogEnviar(true);
  };

  const handleVerDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMostrarDialogDetalle(true);
  };

  const enviarDireccionFinanciera = () => {
    if (!facturaSeleccionada) return;
    setIsProcessing(true);

    setTimeout(() => {
      toast.success('¡Factura enviada a Dirección Financiera!', {
        description: `${facturaSeleccionada.numeroFactura} - Estado: Enviada a Dirección Financiera`
      });

      setIsProcessing(false);
      setMostrarDialogEnviar(false);
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
              <Send className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1">Enviar a Dirección Financiera (RF06)</h1>
              <p className="text-red-100 text-sm">
                Facturas aprobadas por Auditoría para remitir a Dirección Financiera
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
                estados={['Aprobada por Auditoría']}
                proveedores={Array.from(new Set(facturasAprobadas.map(f => f.proveedor)))}
                areas={Array.from(new Set(facturasAprobadas.map(f => f.areaSolicitante)))}
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
            <Card className="border-0 shadow-lg border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-sm font-semibold">Total Facturas</p>
                    <p className="text-3xl font-bold text-blue-800 mt-1">{facturasFiltradas.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-700" />
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
            <Card className="border-0 shadow-lg border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-700 text-sm font-semibold">Pendientes Envío</p>
                    <p className="text-3xl font-bold text-purple-800 mt-1">{facturasFiltradas.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                    <Send className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabla de Facturas Aprobadas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Facturas Aprobadas por Auditoría</CardTitle>
                  <CardDescription>
                    {facturasFiltradas.length} factura(s) aprobada(s) lista(s) para enviar a Dirección Financiera
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200 border text-lg px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {facturasFiltradas.length} Aprobadas
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
                      <TableHead className="font-semibold text-slate-700">F. Aprobación</TableHead>
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
                            {factura.fechaAprobacionAuditoria}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              factura.diasTranscurridos > 2
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
                              onClick={() => abrirDialogEnviar(factura)}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Enviar
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

      {/* Dialog Enviar */}
      <Dialog open={mostrarDialogEnviar} onOpenChange={setMostrarDialogEnviar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-600" />
              Enviar a Dirección Financiera
            </DialogTitle>
            <DialogDescription>
              Confirme el envío de la factura aprobada a Dirección Financiera para cargue formal
            </DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              {/* Información de la factura */}
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
                    <Label className="text-xs text-slate-500">Monto</Label>
                    <p className="font-bold text-green-700">
                      ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>

                {/* Observaciones de Auditoría */}
                {facturaSeleccionada.observacionesAuditoria && (
                  <div className="pt-3 border-t border-slate-200">
                    <Label className="text-xs text-slate-500">Observaciones de Auditoría</Label>
                    <p className="text-sm text-slate-700 mt-1 bg-green-50 p-2 rounded border border-green-200">
                      {facturaSeleccionada.observacionesAuditoria}
                    </p>
                  </div>
                )}
              </div>

              {/* Observaciones de Tesorería */}
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Ingrese observaciones adicionales para Dirección Financiera..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className="resize-none border-slate-300 focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              {/* Información del flujo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Próximo paso del flujo:</p>
                    <p>
                      Dirección Financiera realizará el <strong>cargue formal</strong> del pago y lo remitirá a
                      Rectoría para autorización final.
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
                setMostrarDialogEnviar(false);
                setFacturaSeleccionada(null);
                setObservaciones('');
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={enviarDireccionFinanciera}
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
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Confirmar Envío
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