import { useEffect, useMemo, useState } from 'react';
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
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import { toast } from 'sonner';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail, buildSharedFacturaDetail } from '../../../share/factura-detail-modal';
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';

interface Factura {
  id: string;
  facturaId: number;
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

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

const mapFactura = (f: APIFactura): Factura => ({
  id: String(f.id),
  facturaId: Number(f.id),
  numeroFactura: f.numero_factura || `FAC-${f.id}`,
  numeroRadicado: f.numero_radicado || 'Sin radicado',
  numeroProcesoPago: f.numero_proceso_pago || 'Sin proceso',
  proveedor: f.proveedor?.razon_social || 'Sin Asignar',
  nit: f.proveedor?.nit || 'Sin NIT',
  valorTotal: Number(f.valor_total || 0),
  fechaAlistamiento: f.fecha_alistamiento || 'Sin fecha',
  areaSolicitante: f.departamento?.nombre || 'Sin Asignar',
  cuentaContable: f.cuenta_contable ? `${f.cuenta_contable.codigo} - ${f.cuenta_contable.nombre}` : 'Sin cuenta',
  centroCosto: f.centro_costo ? `${f.centro_costo.codigo} - ${f.centro_costo.nombre}` : 'Sin centro',
  estado: f.estado,
  diasTranscurridos: Math.max(0, Number(f.dias_transcurridos || 0)),
  descripcion: f.descripcion || 'Sin Asignar',
});

export default function ControlPrevio() {
  const auditoriaChecklist = [
    { id: 'causacion', label: 'Causacion contable validada' },
    { id: 'soportes', label: 'Soportes completos y legibles' },
    { id: 'rubro', label: 'Distribucion correcta en rubro' },
    { id: 'proceso', label: 'Proceso de pago verificado' },
  ];

  const documentosEsperados = [
    'Factura / Cuenta de cobro',
    'Orden de compra / Contrato',
    'Certificacion bancaria',
    'Soporte de cumplimiento / Acta',
  ];

  const opcionesRechazo = [
    { id: 'docs', label: 'Soportes incompletos' },
    { id: 'causacion', label: 'Inconsistencia en causacion contable' },
    { id: 'rubro', label: 'Distribucion incorrecta en rubro' },
    { id: 'banco', label: 'Certificacion bancaria faltante' },
    { id: 'otros', label: 'Otro hallazgo' },
  ];

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

  const [facturasAlistadas, setFacturasAlistadas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [mostrarDialogAprobar, setMostrarDialogAprobar] = useState(false);
  const [mostrarDialogRechazar, setMostrarDialogRechazar] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(() => (
    auditoriaChecklist.reduce((acc, item) => ({ ...acc, [item.id]: false }), {})
  ));
  const [rechazoSeleccion, setRechazoSeleccion] = useState<string[]>([]);

  const loadFacturas = async () => {
    const response = await facturasService.getAll({ estado: 'Alistada', limit: 200 });
    return toList<APIFactura>(response).map(mapFactura);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const rows = await loadFacturas();
        setFacturasAlistadas(rows);
      } catch {
        setFacturasAlistadas([]);
        setLoadError('No fue posible cargar las facturas alistadas.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const facturasFiltradas = useMemo(() => facturasAlistadas.filter((factura) => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
    if (filtros.fechaInicio && new Date(factura.fechaAlistamiento) < new Date(filtros.fechaInicio)) return false;
    if (filtros.fechaFin && new Date(factura.fechaAlistamiento) > new Date(filtros.fechaFin)) return false;
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
    return true;
  }), [facturasAlistadas, filtros]);

  const verDetalle = async (factura: Factura) => {
    setMostrarDialogDetalle(true);
    setCargandoDetalle(true);
    try {
      const detail = await facturasService.getById(factura.facturaId);
      const baseDetail = buildSharedFacturaDetail(detail);
      setFacturaDetalle({
        ...baseDetail,
        auditoriaView: true,
        auditoriaNotas: 'Validar causacion contable, soportes completos y distribucion correcta antes de emitir concepto.',
      });
    } catch {
      setFacturaDetalle({
        facturaId: factura.facturaId,
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
        auditoriaView: true,
        auditoriaNotas: 'Validar causacion contable, soportes completos y distribucion correcta antes de emitir concepto.',
        nivelRiesgo: factura.diasTranscurridos >= 18 ? 'rojo' : factura.diasTranscurridos >= 12 ? 'amarillo' : 'verde',
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const abrirDialogAprobar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setObservaciones('');
    setChecklistState(auditoriaChecklist.reduce((acc, item) => ({ ...acc, [item.id]: false }), {}));
    setMostrarDialogAprobar(true);
  };

  const abrirDialogRechazar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMotivoRechazo('');
    setRechazoSeleccion([]);
    setMostrarDialogRechazar(true);
  };

  const checklistCompleto = auditoriaChecklist.every((item) => checklistState[item.id]);

  const toggleChecklist = (id: string) => {
    setChecklistState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const buildRechazoMotivo = (seleccion: string[]) => {
    if (seleccion.length === 0) return '';
    const labels = opcionesRechazo.filter((opt) => seleccion.includes(opt.id)).map((opt) => opt.label);
    return `Hallazgos: ${labels.join('; ')}.`;
  };

  const confirmarAprobacion = () => {
    if (!facturaSeleccionada) return;

    setProcesando(true);
    void (async () => {
      try {
        await facturasService.aprobarAuditoria(facturaSeleccionada.facturaId, observaciones.trim() || undefined);
        const latest = await loadFacturas();
        setFacturasAlistadas(latest);
        toast.success(`Factura aprobada por Auditoria: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogAprobar(false);
        setFacturaSeleccionada(null);
      } catch (error: any) {
        toast.error(error?.message || 'No fue posible aprobar la factura.');
      } finally {
        setProcesando(false);
      }
    })();
  };

  const confirmarRechazo = () => {
    if (!facturaSeleccionada) return;

    if (!motivoRechazo.trim() || motivoRechazo.trim().length < 10) {
      toast.error('El motivo de rechazo es obligatorio (minimo 10 caracteres)');
      return;
    }

    setProcesando(true);
    void (async () => {
      try {
        await facturasService.rechazarAuditoria(facturaSeleccionada.facturaId, motivoRechazo.trim());
        const latest = await loadFacturas();
        setFacturasAlistadas(latest);
        toast.warning(`Factura rechazada por Auditoria: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogRechazar(false);
        setFacturaSeleccionada(null);
        setMotivoRechazo('');
      } catch (error: any) {
        toast.error(error?.message || 'No fue posible rechazar la factura.');
      } finally {
        setProcesando(false);
      }
    })();
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
              {loadError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</div>
              )}
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
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-slate-500 py-6">Cargando facturas alistadas...</TableCell>
                      </TableRow>
                    ) : facturasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-slate-500 py-6">No hay facturas alistadas para auditoría.</TableCell>
                      </TableRow>
                    ) : facturasFiltradas.map((factura, index) => {
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
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600">Factura: <span className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</span></p>
                <p className="text-sm text-slate-600">Proveedor: <span className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</span></p>
                <p className="text-sm text-slate-600">Monto: <span className="font-semibold text-green-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</span></p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-800 mb-3">Checklist de validacion</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {auditoriaChecklist.map((item) => {
                    const activo = checklistState[item.id];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleChecklist(item.id)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all ${
                          activo ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{item.label}</span>
                        {activo ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4 text-slate-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-800 mb-2">Documentos esperados</p>
                <div className="flex flex-wrap gap-2">
                  {documentosEsperados.map((doc) => (
                    <Badge key={doc} className="bg-slate-100 text-slate-700 border-slate-200 border">{doc}</Badge>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">Confirme que los soportes esten completos y legibles.</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700">Observaciones</Label>
                <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones de auditoria (opcional)" className="mt-2" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogAprobar(false)}>Cancelar</Button>
            <Button onClick={confirmarAprobacion} disabled={procesando || !checklistCompleto} className="bg-green-600 hover:bg-green-700 text-white">
              {procesando ? 'Aprobando...' : checklistCompleto ? 'Confirmar aprobacion' : 'Complete el checklist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarDialogRechazar} onOpenChange={setMostrarDialogRechazar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rechazar Factura</DialogTitle>
            <DialogDescription>Registre el motivo para devolver a Tesoreria</DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600">Factura: <span className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</span></p>
                <p className="text-sm text-slate-600">Proveedor: <span className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</span></p>
                <p className="text-sm text-slate-600">Monto: <span className="font-semibold text-red-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</span></p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-800 mb-3">Checklist de hallazgos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {opcionesRechazo.map((item) => {
                    const activo = rechazoSeleccion.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const next = rechazoSeleccion.includes(item.id)
                            ? rechazoSeleccion.filter((r) => r !== item.id)
                            : [...rechazoSeleccion, item.id];
                          setRechazoSeleccion(next);
                          const auto = buildRechazoMotivo(next);
                          if (!motivoRechazo.trim() || motivoRechazo.startsWith('Hallazgos:')) {
                            setMotivoRechazo(auto);
                          }
                        }}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all ${
                          activo ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{item.label}</span>
                        {activo ? <XCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4 text-slate-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700">Motivo de rechazo</Label>
                <Textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Detalle de la inconsistencia (minimo 10 caracteres)" className="mt-2" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogRechazar(false)}>Cancelar</Button>
            <Button onClick={confirmarRechazo} disabled={procesando} className="bg-red-600 hover:bg-red-700 text-white">
              {procesando ? 'Rechazando...' : 'Confirmar rechazo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FacturaDetailModal
        factura={facturaDetalle}
        isOpen={mostrarDialogDetalle}
        onClose={() => {
          if (cargandoDetalle) return;
          setMostrarDialogDetalle(false);
          setFacturaDetalle(null);
        }}
      />
    </>
  );
}
