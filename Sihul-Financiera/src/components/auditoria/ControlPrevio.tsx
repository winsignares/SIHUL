import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  FileCheck, Eye, CheckCircle2, XCircle, AlertTriangle, Calendar,
  FileText, Building2, DollarSign, ShieldCheck, Send, AlertCircle, TrendingUp
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
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
  fechaRecepcion: string;
  fechaRadicacion: string;
  fechaCausacion: string;
  fechaAlistamiento: string;
  areaSolicitante: string;
  cuentaContable: string;
  centroCosto: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
}

export default function ControlPrevio() {
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

  const [facturasAlistadas] = useState<Factura[]>([
    {
      id: '1',
      numeroFactura: 'FAC-2026-145',
      numeroRadicado: 'RAD-2026-00145',
      numeroProcesoPago: 'PP-2026-00078',
      proveedor: 'Tecnología Global SAS',
      nit: '900123789-4',
      valorTotal: 8900000,
      fechaRecepcion: '2026-03-28',
      fechaRadicacion: '2026-03-29',
      fechaCausacion: '2026-03-30',
      fechaAlistamiento: '2026-03-31',
      areaSolicitante: 'Sistemas',
      cuentaContable: '5165-001',
      centroCosto: 'CC-007',
      estado: 'Alistada',
      diasTranscurridos: 5,
      descripcion: 'Equipos de cómputo para área administrativa'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-152',
      numeroRadicado: 'RAD-2026-00152',
      numeroProcesoPago: 'PP-2026-00079',
      proveedor: 'Servicios Médicos Especializados',
      nit: '900234890-5',
      valorTotal: 12500000,
      fechaRecepcion: '2026-03-30',
      fechaRadicacion: '2026-03-31',
      fechaCausacion: '2026-03-31',
      fechaAlistamiento: '2026-04-01',
      areaSolicitante: 'Enfermería',
      cuentaContable: '5170-001',
      centroCosto: 'CC-010',
      estado: 'Alistada',
      diasTranscurridos: 3,
      descripcion: 'Servicios médicos especializados mes de marzo'
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-158',
      numeroRadicado: 'RAD-2026-00158',
      numeroProcesoPago: 'PP-2026-00081',
      proveedor: 'Mantenimiento Pro EU',
      nit: '900345901-6',
      valorTotal: 6750000,
      fechaRecepcion: '2026-03-29',
      fechaRadicacion: '2026-03-30',
      fechaCausacion: '2026-04-01',
      fechaAlistamiento: '2026-04-01',
      areaSolicitante: 'Mantenimiento',
      cuentaContable: '5125-001',
      centroCosto: 'CC-008',
      estado: 'Alistada',
      diasTranscurridos: 4,
      descripcion: 'Reparaciones de infraestructura física'
    }
  ]);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [mostrarDialogAprobar, setMostrarDialogAprobar] = useState(false);
  const [mostrarDialogRechazar, setMostrarDialogRechazar] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);

  const facturasFiltradas = facturasAlistadas.filter(factura => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) {
      return false;
    }
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) {
      return false;
    }
    if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) {
      return false;
    }
    if (filtros.fechaInicio && new Date(factura.fechaAlistamiento) < new Date(filtros.fechaInicio)) {
      return false;
    }
    if (filtros.fechaFin && new Date(factura.fechaAlistamiento) > new Date(filtros.fechaFin)) {
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

  const verDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setObservaciones('');
    setMotivoRechazo('');
    setMostrarDialogDetalle(true);
  };

  const abrirDialogAprobar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setObservaciones('');
    setMostrarDialogAprobar(true);
  };

  const abrirDialogRechazar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMotivoRechazo('');
    setMostrarDialogRechazar(true);
  };

  const confirmarAprobacion = () => {
    if (!facturaSeleccionada) return;

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      toast.success('✅ Factura aprobada por Auditoría', {
        description: `${facturaSeleccionada.numeroFactura} - Estado: Aprobada Auditoría - Retorna a Tesorería para remisión a Dirección Financiera`
      });
      setMostrarDialogAprobar(false);
      setFacturaSeleccionada(null);
    }, 1500);
  };

  const confirmarRechazo = () => {
    if (!facturaSeleccionada) return;

    if (!motivoRechazo.trim()) {
      toast.error('Motivo obligatorio', {
        description: 'Debe especificar el motivo del rechazo'
      });
      return;
    }

    if (motivoRechazo.trim().length < 10) {
      toast.error('Motivo insuficiente', {
        description: 'El motivo debe tener al menos 10 caracteres'
      });
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      toast.warning('❌ Factura rechazada por Auditoría', {
        description: `${facturaSeleccionada.numeroFactura} - Vuelve a Tesorería para corrección. Estado: Rechazada Auditoría`
      });
      setMostrarDialogRechazar(false);
      setFacturaSeleccionada(null);
      setMotivoRechazo('');
    }, 1500);
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
            <ShieldCheck className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1">Control Previo de Auditoría</h1>
            <p className="text-red-100 text-sm">
              Revisar causación contable, documentación soporte y distribución en rubro correcto
            </p>
          </div>
        </div>
      </motion.div>

      {/* Información Importante */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-0 shadow-lg bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Alcance del Control Previo</h3>
                <p className="text-sm text-blue-700">
                  ⚠️ Auditoría <strong>NO revisa disponibilidad presupuestal</strong> (ya viene desde orden de compra/contrato).<br />
                  ✅ <strong>SÍ revisa:</strong> Causación contable, documentación soporte y que la distribución contable esté en el rubro correcto.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filtros Independientes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <TableFilters
              filters={filtros}
              onFilterChange={setFiltros}
              estados={['Alistada']}
              proveedores={Array.from(new Set(facturasAlistadas.map(f => f.proveedor)))}
              areas={Array.from(new Set(facturasAlistadas.map(f => f.areaSolicitante)))}
              showMontoFilter={true}
              showFechaFilter={true}
              showAreaFilter={true}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800">Facturas Pendientes de Control Previo</CardTitle>
                <CardDescription>
                  {facturasFiltradas.length} factura(s) en estado "Alistada"
                </CardDescription>
              </div>
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border text-lg px-4 py-2">
                {facturasFiltradas.length} Por Revisar
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
                    <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                    <TableHead className="font-semibold text-slate-700">Centro Costo</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha Alistamiento</TableHead>
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
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border font-mono text-xs">
                            {factura.numeroProcesoPago}
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
                          <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 border font-mono text-xs">
                            {factura.centroCosto}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {factura.fechaAlistamiento}
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
                              onClick={() => verDetalle(factura)}
                              className="border-slate-300 text-slate-700 hover:bg-slate-100"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Detalle
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => abrirDialogAprobar(factura)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirDialogRechazar(factura)}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <FileText className="w-5 h-5 text-blue-600" />
              Detalle - {facturaSeleccionada?.numeroFactura}
            </DialogTitle>
            <DialogDescription>
              Revisión completa de información contable y documental
            </DialogDescription>
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
                  <p className="font-semibold text-slate-800 text-lg">
                    ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">Proceso de Pago</Label>
                  <p className="font-mono text-yellow-700 font-semibold">{facturaSeleccionada.numeroProcesoPago}</p>
                </div>
              </div>

              {/* Información Contable */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Label className="text-purple-900 text-xs uppercase font-semibold mb-3 block">
                  🔍 Información Contable a Revisar
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-purple-600 mb-1">Cuenta Contable</p>
                    <p className="font-mono font-bold text-purple-800">{facturaSeleccionada.cuentaContable}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 mb-1">Centro de Costo</p>
                    <p className="font-mono font-bold text-purple-800">{facturaSeleccionada.centroCosto}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 mb-1">Área Solicitante</p>
                    <p className="font-semibold text-purple-800">{facturaSeleccionada.areaSolicitante}</p>
                  </div>
                </div>
              </div>

              {/* Checklist de Auditoría */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="text-blue-900 text-xs uppercase font-semibold mb-3 block">
                  ✅ Checklist de Control Previo
                </Label>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-blue-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Causación contable verificada</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Documentación soporte revisada</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Distribución contable en rubro correcto</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <XCircle className="w-4 h-4" />
                    <span className="line-through">Disponibilidad presupuestal (ya verificada desde orden/contrato)</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-slate-100 rounded">
                  <p className="text-slate-500">Recepción</p>
                  <p className="font-semibold text-slate-700 mt-1">{facturaSeleccionada.fechaRecepcion}</p>
                </div>
                <div className="p-2 bg-slate-100 rounded">
                  <p className="text-slate-500">Radicación</p>
                  <p className="font-semibold text-slate-700 mt-1">{facturaSeleccionada.fechaRadicacion}</p>
                </div>
                <div className="p-2 bg-slate-100 rounded">
                  <p className="text-slate-500">Causación</p>
                  <p className="font-semibold text-slate-700 mt-1">{facturaSeleccionada.fechaCausacion}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded border border-yellow-300">
                  <p className="text-yellow-700 font-semibold">Alistamiento</p>
                  <p className="font-bold text-yellow-800 mt-1">{facturaSeleccionada.fechaAlistamiento}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-100 rounded-lg">
                <Label className="text-slate-700 text-xs uppercase font-semibold">Descripción</Label>
                <p className="text-slate-800 mt-2">{facturaSeleccionada.descripcion}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogDetalle(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setMostrarDialogDetalle(false);
                if (facturaSeleccionada) abrirDialogAprobar(facturaSeleccionada);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Aprobar */}
      <Dialog open={mostrarDialogAprobar} onOpenChange={setMostrarDialogAprobar}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <span>Aprobar Control Previo - Auditoría</span>
            </DialogTitle>
            <DialogDescription>
              Revise cuidadosamente antes de aprobar. Al aprobar, la factura retornará a Tesorería para remisión a Dirección Financiera/Sindicatura.
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
                    <p className="font-mono text-purple-700 font-semibold">{facturaSeleccionada.cuentaContable}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Centro de Costo</Label>
                    <p className="font-mono text-cyan-700 font-semibold">{facturaSeleccionada.centroCosto}</p>
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
                  <Label className="text-xs text-green-600 mb-1">Monto Total</Label>
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
                <div className="grid grid-cols-4 gap-3 mt-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Recepción</p>
                    <p className="font-semibold text-slate-700">{facturaSeleccionada.fechaRecepcion}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Radicación</p>
                    <p className="font-semibold text-slate-700">{facturaSeleccionada.fechaRadicacion}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Causación</p>
                    <p className="font-semibold text-slate-700">{facturaSeleccionada.fechaCausacion}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-300">
                    <p className="text-xs text-yellow-700 font-semibold mb-1">Alistamiento</p>
                    <p className="font-bold text-yellow-800">{facturaSeleccionada.fechaAlistamiento}</p>
                  </div>
                </div>
              </div>

              {/* CHECKLIST DE AUDITORÍA */}
              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                <Label className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Verificaciones de Auditoría Realizadas
                </Label>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-blue-700 bg-white p-2 rounded">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">Causación contable verificada</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700 bg-white p-2 rounded">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">Documentación soporte revisada</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700 bg-white p-2 rounded">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">Distribución contable en rubro correcto</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 bg-slate-100 p-2 rounded">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm line-through">Disponibilidad presupuestal (ya verificada desde orden/contrato)</span>
                  </div>
                </div>
              </div>

              {/* CAMPO DE OBSERVACIONES */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <Label className="text-sm font-semibold text-slate-700">
                  Observaciones de Auditoría <span className="text-slate-500">(Opcional)</span>
                </Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Agregue observaciones adicionales sobre la aprobación si lo considera necesario..."
                  className="min-h-[100px] resize-none border-slate-300 focus:border-green-600"
                  rows={4}
                />
              </div>

              {/* INFORMACIÓN DEL SIGUIENTE PASO */}
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Send className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-green-800">
                    <p className="font-semibold mb-1">¿Qué sucede después de aprobar?</p>
                    <p className="text-sm">
                      • Estado: <strong>"Aprobada Auditoría"</strong><br />
                      • Retorna a: <strong>TESORERÍA</strong><br />
                      • Siguiente paso: Tesorería remite a <strong>Dirección Financiera / Sindicatura</strong><br />
                      • ⚠️ Auditoría NO envía directamente a Dirección Financiera ni a Rectoría
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
                setMostrarDialogAprobar(false);
                setObservaciones('');
              }} 
              disabled={procesando}
              className="border-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarAprobacion}
              disabled={procesando}
              className="bg-green-600 hover:bg-green-700"
            >
              {procesando ? (
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
                  <Send className="w-4 h-4 mr-2" />
                  Confirmar Aprobación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rechazar */}
      <Dialog open={mostrarDialogRechazar} onOpenChange={setMostrarDialogRechazar}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <XCircle className="w-6 h-6 text-red-600" />
              <span>Rechazar Factura - Auditoría</span>
            </DialogTitle>
            <DialogDescription>
              Indique el motivo del rechazo. La factura volverá a Tesorería con observación obligatoria.
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
                    <p className="font-mono text-purple-700 font-semibold">{facturaSeleccionada.cuentaContable}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Centro de Costo</Label>
                    <p className="font-mono text-cyan-700 font-semibold">{facturaSeleccionada.centroCosto}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Monto Total</Label>
                    <p className="font-bold text-green-700 text-2xl">
                      ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Estado Actual</Label>
                    <Badge className="bg-yellow-600 text-white text-sm">
                      {facturaSeleccionada.estado}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <Label className="text-xs text-slate-500 mb-1">Descripción</Label>
                  <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">
                    {facturaSeleccionada.descripcion}
                  </p>
                </div>
              </div>

              {/* TIMELINE DE FECHAS */}
              <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                <Label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timeline del Proceso
                </Label>
                <div className="grid grid-cols-4 gap-3 mt-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Recepción</p>
                    <p className="font-semibold text-slate-700">{facturaSeleccionada.fechaRecepcion}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Radicación</p>
                    <p className="font-semibold text-slate-700">{facturaSeleccionada.fechaRadicacion}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Causación</p>
                    <p className="font-semibold text-slate-700">{facturaSeleccionada.fechaCausacion}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-300">
                    <p className="text-xs text-yellow-700 font-semibold mb-1">Alistamiento</p>
                    <p className="font-bold text-yellow-800">{facturaSeleccionada.fechaAlistamiento}</p>
                  </div>
                </div>
              </div>

              {/* CAMPO DE MOTIVO DE RECHAZO */}
              <div className="bg-red-50 p-6 rounded-xl border-2 border-red-200 space-y-3">
                <Label className="text-sm font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Motivo del Rechazo <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Describa detalladamente el motivo del rechazo (OBLIGATORIO, mínimo 10 caracteres). Indique el error detectado en causación contable, documentación o distribución en rubro..."
                  className="min-h-[140px] resize-none border-red-300 focus:border-red-600 bg-white"
                  required
                  rows={6}
                />
                <p className="text-xs text-red-700">
                  El motivo es obligatorio, debe tener al menos 10 caracteres y ser específico sobre el error detectado
                </p>
              </div>

              {/* INFORMACIÓN DEL SIGUIENTE PASO */}
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-red-800">
                    <p className="font-semibold mb-1">¿Qué sucede después de rechazar?</p>
                    <p className="text-sm">
                      • Estado: <strong>"Rechazada Auditoría"</strong><br />
                      • Vuelve a: <strong>TESORERÍA</strong><br />
                      • Tesorería debe: Revisar observación, corregir o gestionar ajuste<br />
                      • Después de corrección: Volver a <strong>Control Previo de Auditoría</strong><br />
                      • ⚠️ NO se salta a otra área sin corrección
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
                setMostrarDialogRechazar(false);
                setMotivoRechazo('');
              }} 
              disabled={procesando}
              className="border-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarRechazo}
              disabled={procesando || !motivoRechazo.trim() || motivoRechazo.trim().length < 10}
              className="bg-red-600 hover:bg-red-700"
            >
              {procesando ? (
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
                  Confirmar Rechazo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}