import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Badge } from '../../../share/badge';
import { Textarea } from '../../../share/textarea';
import { Label } from '../../../share/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import {
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
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
    montoMax: '',
  });

  const [facturasAlistadas] = useState<Factura[]>([
    {
      id: '1',
      numeroFactura: 'FAC-2026-145',
      numeroRadicado: 'RAD-2026-00145',
      numeroProcesoPago: 'PP-2026-00078',
      proveedor: 'Tecnologia Global SAS',
      nit: '900123789-4',
      valorTotal: 8900000,
      fechaAlistamiento: '2026-03-31',
      areaSolicitante: 'Sistemas',
      cuentaContable: '5165-001',
      centroCosto: 'CC-007',
      estado: 'Alistada',
      diasTranscurridos: 5,
      descripcion: 'Equipos de computo para area administrativa',
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-152',
      numeroRadicado: 'RAD-2026-00152',
      numeroProcesoPago: 'PP-2026-00079',
      proveedor: 'Servicios Medicos Especializados',
      nit: '900234890-5',
      valorTotal: 12500000,
      fechaAlistamiento: '2026-04-01',
      areaSolicitante: 'Enfermeria',
      cuentaContable: '5170-001',
      centroCosto: 'CC-010',
      estado: 'Alistada',
      diasTranscurridos: 3,
      descripcion: 'Servicios medicos especializados mes de marzo',
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-158',
      numeroRadicado: 'RAD-2026-00158',
      numeroProcesoPago: 'PP-2026-00081',
      proveedor: 'Mantenimiento Pro EU',
      nit: '900345901-6',
      valorTotal: 6750000,
      fechaAlistamiento: '2026-04-01',
      areaSolicitante: 'Mantenimiento',
      cuentaContable: '5125-001',
      centroCosto: 'CC-008',
      estado: 'Alistada',
      diasTranscurridos: 4,
      descripcion: 'Reparaciones de infraestructura fisica',
    },
  ]);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [mostrarDialogAprobar, setMostrarDialogAprobar] = useState(false);
  const [mostrarDialogRechazar, setMostrarDialogRechazar] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);

  const facturasFiltradas = facturasAlistadas.filter((factura) => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
    if (filtros.fechaInicio && new Date(factura.fechaAlistamiento) < new Date(filtros.fechaInicio)) return false;
    if (filtros.fechaFin && new Date(factura.fechaAlistamiento) > new Date(filtros.fechaFin)) return false;
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
    return true;
  });

  const verDetalle = (factura: Factura) => {
    setFacturaDetalle({
      numeroFactura: factura.numeroFactura,
      numeroRadicado: factura.numeroRadicado,
      numeroProcesoPago: factura.numeroProcesoPago,
      proveedor: factura.proveedor,
      nit: factura.nit,
      valorTotal: factura.valorTotal,
      areaSolicitante: factura.areaSolicitante,
      estado: factura.estado,
      diasTranscurridos: factura.diasTranscurridos,
      fechaRecepcion: factura.fechaAlistamiento,
      descripcion: factura.descripcion,
      cuentaContable: factura.cuentaContable,
      centroCosto: factura.centroCosto,
      observaciones: 'Checklist: causacion contable, soportes y distribucion en rubro correcto',
      nivelRiesgo: factura.diasTranscurridos >= 18 ? 'rojo' : factura.diasTranscurridos >= 12 ? 'amarillo' : 'verde',
    });
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
      toast.success(`Factura aprobada por Auditoria: ${facturaSeleccionada.numeroFactura}`);
      setMostrarDialogAprobar(false);
      setFacturaSeleccionada(null);
    }, 1200);
  };

  const confirmarRechazo = () => {
    if (!facturaSeleccionada) return;

    if (!motivoRechazo.trim() || motivoRechazo.trim().length < 10) {
      toast.error('El motivo de rechazo es obligatorio (minimo 10 caracteres)');
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      toast.warning(`Factura rechazada por Auditoria: ${facturaSeleccionada.numeroFactura}`);
      setMostrarDialogRechazar(false);
      setFacturaSeleccionada(null);
      setMotivoRechazo('');
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
              <ShieldCheck className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Control Previo de Auditoria</h1>
              <p className="text-red-100 text-sm">Validacion documental y contable antes del envio a Direccion Financiera</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-lg bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-700">
                Alcance de auditoria: revisar causacion contable, soportes y distribucion de rubro. No revisa disponibilidad presupuestal.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <TableFilters
                filters={filtros}
                onFilterChange={setFiltros}
                estados={['Alistada']}
                proveedores={Array.from(new Set(facturasAlistadas.map((f) => f.proveedor)))}
                areas={Array.from(new Set(facturasAlistadas.map((f) => f.areaSolicitante)))}
                showMontoFilter
                showFechaFilter
                showAreaFilter
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Facturas Pendientes de Control Previo</CardTitle>
                  <CardDescription>{facturasFiltradas.length} factura(s) en estado alistada</CardDescription>
                </div>
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border text-lg px-4 py-2">{facturasFiltradas.length} Por Revisar</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                      <TableHead className="font-semibold text-slate-700">N Factura</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proceso Pago</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">NIT</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                      <TableHead className="font-semibold text-slate-700">Centro Costo</TableHead>
                      <TableHead className="font-semibold text-slate-700">Fecha Alistamiento</TableHead>
                      <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasFiltradas.map((factura, index) => {
                      const colorRiesgo = factura.diasTranscurridos >= 24 ? 'bg-purple-700' : factura.diasTranscurridos >= 18 ? 'bg-orange-500' : factura.diasTranscurridos >= 12 ? 'bg-yellow-500' : 'bg-green-500';

                      return (
                        <motion.tr key={factura.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-slate-50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${colorRiesgo}`} />
                              {factura.diasTranscurridos >= 24 && <AlertCircle className="w-4 h-4 text-purple-700" />}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                          <TableCell><Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border font-mono text-xs">{factura.numeroProcesoPago}</Badge></TableCell>
                          <TableCell className="text-slate-600 max-w-[180px] truncate" title={factura.proveedor}>{factura.proveedor}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">{factura.nit}</TableCell>
                          <TableCell className="font-semibold text-slate-800">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                          <TableCell><Badge className="bg-purple-100 text-purple-700 border-purple-200 border font-mono text-xs">{factura.cuentaContable}</Badge></TableCell>
                          <TableCell><Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 border font-mono text-xs">{factura.centroCosto}</Badge></TableCell>
                          <TableCell className="text-slate-600 text-sm"><div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-slate-400" />{factura.fechaAlistamiento}</div></TableCell>
                          <TableCell><span className="inline-flex items-center gap-1 font-bold text-sm text-slate-700">{factura.diasTranscurridos}d</span></TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => verDetalle(factura)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
                                <Eye className="w-4 h-4 mr-1" />Detalle
                              </Button>
                              <Button size="sm" onClick={() => abrirDialogAprobar(factura)} className="bg-green-600 hover:bg-green-700 text-white">
                                <CheckCircle2 className="w-4 h-4 mr-1" />Aprobar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => abrirDialogRechazar(factura)} className="border-red-300 text-red-700 hover:bg-red-50">
                                <XCircle className="w-4 h-4 mr-1" />Rechazar
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
      </div>

      <Dialog open={mostrarDialogAprobar} onOpenChange={setMostrarDialogAprobar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aprobar Factura</DialogTitle>
            <DialogDescription>Confirme aprobacion para continuar el flujo financiero</DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-600">Factura: <span className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</span></p>
                <p className="text-sm text-slate-600">Proveedor: <span className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</span></p>
                <p className="text-sm text-slate-600">Monto: <span className="font-semibold text-green-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</span></p>
              </div>
              <div>
                <Label htmlFor="observaciones">Observaciones de auditoria</Label>
                <Textarea id="observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones de aprobacion" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogAprobar(false)}>Cancelar</Button>
            <Button onClick={confirmarAprobacion} disabled={procesando} className="bg-green-600 hover:bg-green-700">
              {procesando ? 'Aprobando...' : 'Confirmar Aprobacion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarDialogRechazar} onOpenChange={setMostrarDialogRechazar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rechazar Factura</DialogTitle>
            <DialogDescription>Indique el motivo para devolver a Tesoreria</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="motivo">Motivo de rechazo</Label>
            <Textarea id="motivo" value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Detalle de hallazgos o inconsistencias" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogRechazar(false)}>Cancelar</Button>
            <Button onClick={confirmarRechazo} disabled={procesando} className="bg-red-600 hover:bg-red-700">
              {procesando ? 'Rechazando...' : 'Confirmar Rechazo'}
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
