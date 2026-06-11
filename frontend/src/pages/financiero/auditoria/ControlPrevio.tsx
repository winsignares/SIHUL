import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Badge } from '../../../share/badge';
import { Textarea } from '../../../share/textarea';
import { Label } from '../../../share/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Eye, CheckCircle2, XCircle, Calendar, ShieldCheck, AlertCircle, FolderOpen, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import { toast } from 'sonner';
import TableFilters, { type TableFilterValues } from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../../share/factura-details-helpers';
import { displayDate, displayRadicado, displayText } from '../../../share/field-placeholders';
import { openDocumentosConsolidados, downloadDocumentosConsolidados } from '../../../share/documentos-consolidados';
import { SlaIndicator } from '../../../share/sla-indicator';
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';

const FILTROS_INICIALES = {
  numeroFactura: '',
  proveedor: '',
  estado: '',
  areaSolicitante: '',
  fechaInicio: '',
  fechaFin: '',
  montoMin: '',
  montoMax: '',
  orden: 'recientes',
};

const ORDER_OPTIONS = [
  { label: 'Mas recientes primero', value: 'recientes' },
  { label: 'Mas antiguos primero', value: 'antiguos' },
];

const ITEMS_POR_PAGINA = 5;

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
  estado: string;
  diasTranscurridos: number;
  slaObjetivoDias?: number | null;
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
  proveedor: f.proveedor?.razon_social || 'Sin asignar',
  nit: f.proveedor?.nit || 'Sin NIT',
  valorTotal: Number(f.valor_total || 0),
  fechaAlistamiento: f.fecha_alistamiento || '',
  areaSolicitante: f.departamento?.nombre || 'Sin asignar',
  estado: f.estado,
  diasTranscurridos: Math.max(0, Number(f.dias_transcurridos || 0)),
  slaObjetivoDias: f.sla_objetivo_dias ?? null,
  descripcion: f.descripcion || 'Sin asignar',
});

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function ControlPrevio() {
  const auditoriaChecklist = [
    { id: 'causacion', label: 'Causacion contable validada' },
    { id: 'soportes', label: 'Soportes completos y legibles' },
    { id: 'rubro', label: 'Distribucion correcta en rubro' },
    { id: 'proceso', label: 'Proceso de pago verificado' },
  ];

  const opcionesRechazo = [
    { id: 'docs', label: 'Soportes incompletos' },
    { id: 'causacion', label: 'Inconsistencia en causacion contable' },
    { id: 'rubro', label: 'Distribucion incorrecta en rubro' },
    { id: 'banco', label: 'Soporte de pago incompleto' },
    { id: 'otros', label: 'Otro hallazgo' },
  ];

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [facturasAlistadas, setFacturasAlistadas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [mostrarDialogAprobar, setMostrarDialogAprobar] = useState(false);
  const [mostrarDialogRechazar, setMostrarDialogRechazar] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(() => (
    auditoriaChecklist.reduce((acc, item) => ({ ...acc, [item.id]: false }), {})
  ));
  const [rechazoSeleccion, setRechazoSeleccion] = useState<string[]>([]);

  const handleFilterChange = useCallback((values: TableFilterValues) => {
    setFiltros((prev) => ({ ...prev, ...values }));
  }, []);

  const loadFacturas = async () => {
    const response = await facturasService.getAll({ estado: 'Alistada', ordering: '-fecha_alistamiento', limit: 200 });
    return toList<APIFactura>(response).map(mapFactura);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        setFacturasAlistadas(await loadFacturas());
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
    if (filtros.numeroFactura) {
      const term = filtros.numeroFactura.toLowerCase();
      const matchFactura = factura.numeroFactura.toLowerCase().includes(term);
      const matchRadicado = factura.numeroRadicado?.toLowerCase().includes(term) ?? false;
      const matchProceso = factura.numeroProcesoPago?.toLowerCase().includes(term) ?? false;
      if (!matchFactura && !matchRadicado && !matchProceso) return false;
    }
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.fechaInicio && new Date(factura.fechaAlistamiento) < new Date(filtros.fechaInicio)) return false;
    if (filtros.fechaFin && new Date(factura.fechaAlistamiento) > new Date(filtros.fechaFin)) return false;
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
    return true;
  }), [facturasAlistadas, filtros]);

  const facturasOrdenadas = useMemo(() => {
    const listado = [...facturasFiltradas];
    if (filtros.orden === 'antiguos') {
      return listado.sort((a, b) => a.facturaId - b.facturaId);
    }
    return listado.sort((a, b) => b.facturaId - a.facturaId);
  }, [facturasFiltradas, filtros.orden]);

  const totalPaginas = Math.max(1, Math.ceil(facturasOrdenadas.length / ITEMS_POR_PAGINA));
  const facturasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return facturasOrdenadas.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [facturasOrdenadas, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros]);

  useEffect(() => {
    setPaginaActual((prev) => Math.min(prev, totalPaginas));
  }, [totalPaginas]);

  const verDetalle = async (factura: Factura) => {
    setMostrarDialogDetalle(true);
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
        auditoriaView: true,
        auditoriaNotas: 'Validar causacion contable, soportes completos y distribucion correcta antes de emitir concepto.',
        nivelRiesgo: factura.diasTranscurridos >= 18 ? 'rojo' : factura.diasTranscurridos >= 12 ? 'amarillo' : 'verde',
      });
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
        setFacturasAlistadas(await loadFacturas());
        toast.success(`Factura aprobada por auditoria: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogAprobar(false);
        setFacturaSeleccionada(null);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No fue posible aprobar la factura.'));
      } finally {
        setProcesando(false);
      }
    })();
  };

  const confirmarRechazo = () => {
    if (!facturaSeleccionada) return;
    if (!motivoRechazo.trim() || motivoRechazo.trim().length < 10) {
      toast.error('El motivo de rechazo es obligatorio y debe tener minimo 10 caracteres');
      return;
    }

    setProcesando(true);
    void (async () => {
      try {
        await facturasService.rechazarAuditoria(facturaSeleccionada.facturaId, motivoRechazo.trim());
        setFacturasAlistadas(await loadFacturas());
        toast.warning(`Factura rechazada por auditoria: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogRechazar(false);
        setFacturaSeleccionada(null);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No fue posible rechazar la factura.'));
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
              <p className="text-red-100 text-sm">Revision documental y contable antes de enviar a direccion financiera</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-lg bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-700">
                Alcance de auditoria: revisar causacion contable, soportes y distribucion del rubro. No revisa disponibilidad presupuestal.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <TableFilters
              filters={filtros}
              onFilterChange={handleFilterChange}
              proveedores={Array.from(new Set(facturasAlistadas.map((f) => f.proveedor)))}
              showFechaFilter
              showAreaFilter={false}
              showEstadoFilter={false}
              orderKey="orden"
              orderLabel="Ordenar lista"
              orderOptions={ORDER_OPTIONS}
              searchLabel="Factura / Radicado / Proceso Pago"
              searchPlaceholder="Buscar por factura, radicado o proceso..."
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-slate-800">Facturas Pendientes de Control Previo</CardTitle>
                <CardDescription>
                  Mostrando {facturasOrdenadas.length === 0 ? 0 : (paginaActual - 1) * ITEMS_POR_PAGINA + 1} a {Math.min(paginaActual * ITEMS_POR_PAGINA, facturasOrdenadas.length)} de {facturasOrdenadas.length} facturas
                </CardDescription>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-100 bg-yellow-50 px-5 py-1.5 text-yellow-800 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-yellow-700">Por revisar</span>
                <span className="text-xl font-bold">{facturasOrdenadas.length}</span>
              </div>
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
                    <TableHead className="font-semibold text-slate-700">Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proceso Pago</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor / NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Area</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha Alistamiento</TableHead>
                    <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-500 py-6">Cargando facturas alistadas...</TableCell>
                    </TableRow>
                  ) : facturasOrdenadas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-500 py-6">No hay facturas alistadas para auditoria.</TableCell>
                    </TableRow>
                  ) : facturasPaginadas.map((factura, index) => {
                    return (
                      <motion.tr key={factura.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-slate-50 transition-colors">
                        <TableCell>
                          <span className="font-semibold text-slate-800">{factura.numeroFactura}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 border font-mono text-[10px]">
                            {displayRadicado(factura.numeroRadicado)}
                          </Badge>
                        </TableCell>
                        <TableCell><Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border font-mono text-xs">{factura.numeroProcesoPago}</Badge></TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-800 break-words max-w-[200px] leading-tight">{displayText(factura.proveedor)}</p>
                          <p className="text-xs text-slate-500 font-mono">{displayText(factura.nit)}</p>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">{displayText(factura.areaSolicitante)}</TableCell>
                        <TableCell className="font-semibold text-slate-800">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-slate-400" />{displayDate(factura.fechaAlistamiento)}</div>
                        </TableCell>
                        <TableCell>
                          <SlaIndicator dias={factura.diasTranscurridos} objetivo={factura.slaObjetivoDias} className="inline-flex items-center gap-1 font-bold text-sm text-slate-700" compact />
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => void verDetalle(factura)} className="h-9 w-9 rounded-full border-slate-300 p-0 text-slate-700 hover:bg-slate-50" title="Ver detalle">
                              <Eye className="w-4 h-4" />
                              <span className="sr-only">Ver detalle</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void openDocumentosConsolidados(factura.facturaId, 'auditoria')}
                              className="h-9 w-9 rounded-full border-blue-200 p-0 text-blue-700 hover:bg-blue-50"
                              title="Ver documentacion"
                            >
                              <FolderOpen className="w-4 h-4" />
                              <span className="sr-only">Ver documentacion</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void downloadDocumentosConsolidados(factura.facturaId, factura.numeroFactura, 'auditoria')}
                              className="h-9 w-9 rounded-full border-slate-200 p-0 text-slate-700 hover:bg-slate-50"
                              title="Descargar soportes"
                            >
                              <Download className="w-4 h-4" />
                              <span className="sr-only">Descargar soportes</span>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => abrirDialogRechazar(factura)} className="h-9 w-9 rounded-full border-red-300 p-0 text-red-700 hover:bg-red-50" title="Rechazar factura">
                              <XCircle className="w-4 h-4" />
                              <span className="sr-only">Rechazar factura</span>
                            </Button>
                            <Button size="sm" onClick={() => abrirDialogAprobar(factura)} className="h-9 w-9 rounded-full bg-green-600 p-0 text-white hover:bg-green-700" title="Aprobar factura">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="sr-only">Aprobar factura</span>
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Mostrando {facturasOrdenadas.length === 0 ? 0 : (paginaActual - 1) * ITEMS_POR_PAGINA + 1} a {Math.min(paginaActual * ITEMS_POR_PAGINA, facturasOrdenadas.length)} de {facturasOrdenadas.length} resultados
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))} disabled={paginaActual === 1} className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    <ChevronLeft className="w-4 h-4 mr-1" />Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      let pageNum;
                      if (totalPaginas <= 5) pageNum = i + 1;
                      else if (paginaActual <= 3) pageNum = i + 1;
                      else if (paginaActual >= totalPaginas - 2) pageNum = totalPaginas - 4 + i;
                      else pageNum = paginaActual - 2 + i;

                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={paginaActual === pageNum ? 'default' : 'outline'}
                          onClick={() => setPaginaActual(pageNum)}
                          className={paginaActual === pageNum ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))} disabled={paginaActual === totalPaginas} className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Siguiente<ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={mostrarDialogAprobar} onOpenChange={setMostrarDialogAprobar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aprobar Factura</DialogTitle>
            <DialogDescription>Confirme la aprobacion para continuar el flujo financiero</DialogDescription>
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
                        onClick={() => setChecklistState((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
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
            <DialogDescription>Registre el motivo para devolver a tesoreria</DialogDescription>
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
          setMostrarDialogDetalle(false);
          setFacturaDetalle(null);
        }}
      />
    </>
  );
}
