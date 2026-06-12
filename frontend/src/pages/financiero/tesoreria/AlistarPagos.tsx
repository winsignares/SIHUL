import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Textarea } from '../../../share/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Badge } from '../../../share/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import { FileCheck, Eye, XCircle, FileText, FolderOpen, ChevronLeft, ChevronRight, Upload, Search, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import { SlaIndicator } from '../../../share/sla-indicator';
import { displayRadicado, displayText } from '../../../share/field-placeholders';
import { openDocumentosConsolidados, downloadDocumentosConsolidadosPdf } from '../../../share/documentos-consolidados';
import { facturasService, documentosService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';
import { buildSharedFacturaDetail } from '../../../share/factura-details-helpers';

const FILTROS_INICIALES = {
  numeroFactura: '',
  numeroRadicado: '',
  orden: 'recientes',
};

const ITEMS_POR_PAGINA = 5;
const ORDER_OPTIONS = [
  { label: 'Mas recientes primero', value: 'recientes' },
  { label: 'Mas antiguos primero', value: 'antiguos' },
];

interface Factura {
  id: string;
  facturaId: number;
  numeroFactura: string;
  numeroRadicado?: string;
  proveedor: string;
  nit?: string;
  valorTotal: number;
  fechaCausacion?: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  slaObjetivoDias?: number | null;
  descripcion: string;
  numeroProcesoPago?: string;
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
  numeroRadicado: f.numero_radicado,
  proveedor: f.proveedor?.razon_social || 'Sin asignar',
  nit: f.proveedor?.nit,
  valorTotal: Number(f.valor_total || 0),
  fechaCausacion: f.fecha_causacion,
  areaSolicitante: f.departamento?.nombre || 'Sin asignar',
  estado: f.estado,
  diasTranscurridos: Math.max(0, Number(f.dias_transcurridos || 0)),
  slaObjetivoDias: f.sla_objetivo_dias ?? null,
  descripcion: f.descripcion || 'Sin asignar',
  numeroProcesoPago: f.numero_proceso_pago,
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export default function AlistarPagos() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogAlistar, setMostrarDialogAlistar] = useState(false);
  const [mostrarDialogRechazar, setMostrarDialogRechazar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [numeroProcesoPago, setNumeroProcesoPago] = useState('');
  const [archivoSeven, setArchivoSeven] = useState<File | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [facturasTesoreria, setFacturasTesoreria] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);

  const loadFacturas = async () => {
    const response = await facturasService.getAll({ limit: 200 });
    return toList<APIFactura>(response)
      .filter((f) => f.estado === 'Radicada' || f.estado === 'Causada' || f.estado === 'Detenida')
      .map(mapFactura);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        setFacturasTesoreria(await loadFacturas());
      } catch {
        setFacturasTesoreria([]);
        setLoadError('No fue posible cargar facturas para alistamiento.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const facturasFiltradas = useMemo(() => facturasTesoreria.filter((factura) => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.numeroRadicado && !(factura.numeroRadicado?.toLowerCase().includes(filtros.numeroRadicado.toLowerCase()) ?? false)) return false;
    return true;
  }), [facturasTesoreria, filtros]);

  const facturasOrdenadas = useMemo(() => {
    const listado = [...facturasFiltradas];
    const parseFechaSort = (v?: string) => (v ? new Date(v).getTime() : 0);
    if (filtros.orden === 'antiguos') {
      return listado.sort((a, b) => parseFechaSort(a.fechaCausacion) - parseFechaSort(b.fechaCausacion));
    }
    return listado.sort((a, b) => parseFechaSort(b.fechaCausacion) - parseFechaSort(a.fechaCausacion));
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

  const abrirDialogAlistar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setNumeroProcesoPago(factura.numeroProcesoPago || '');
    setArchivoSeven(null);
    setObservaciones('');
    setMostrarDialogAlistar(true);
  };

  const abrirDialogRechazar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMotivoRechazo('');
    setMostrarDialogRechazar(true);
  };

  const abrirDialogDetalle = (factura: Factura) => {
    setFacturaDetalle({
      numeroFactura: factura.numeroFactura,
      numeroRadicado: factura.numeroRadicado,
      proveedor: factura.proveedor,
      nit: factura.nit,
      valorTotal: factura.valorTotal,
      areaSolicitante: factura.areaSolicitante,
      estado: factura.estado,
      diasTranscurridos: factura.diasTranscurridos,
      fechaRecepcion: factura.fechaCausacion,
      descripcion: factura.descripcion,
      nivelRiesgo: factura.diasTranscurridos > 17 ? 'rojo' : factura.diasTranscurridos > 10 ? 'amarillo' : 'verde',
    });
    setMostrarDialogDetalle(true);
    void facturasService.getById(factura.facturaId).then((detalle) => {
      setFacturaDetalle(buildSharedFacturaDetail(detalle));
    }).catch(() => {});
  };

  const alistarPago = () => {
    if (!facturaSeleccionada) return;
    if (!numeroProcesoPago.trim()) {
      toast.error('Debe registrar el numero de proceso de pago generado en SEVEN');
      return;
    }
    if (!archivoSeven) {
      toast.error('Debe cargar el archivo generado en SEVEN');
      return;
    }
    if (archivoSeven.size === 0) {
      toast.error('El archivo seleccionado está vacío. Verifique que el archivo TXT tenga contenido antes de cargarlo.');
      return;
    }
    if (observaciones.trim().length < 5) {
      toast.error('Debe registrar una observacion del proceso');
      return;
    }

    setIsProcessing(true);
    void (async () => {
      try {
        await documentosService.upload(facturaSeleccionada.facturaId, archivoSeven, 'Soporte Causacion Seven');
        await facturasService.alistar(facturaSeleccionada.facturaId, {
          numero_proceso_pago: numeroProcesoPago.trim(),
          archivo_plano_generado: archivoSeven.name,
          observaciones: observaciones.trim(),
        });

        setFacturasTesoreria(await loadFacturas());
        toast.success(`Pago alistado: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogAlistar(false);
        setFacturaSeleccionada(null);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No fue posible completar el alistamiento.'));
      } finally {
        setIsProcessing(false);
      }
    })();
  };

  const rechazarAlistamiento = () => {
    if (!facturaSeleccionada || motivoRechazo.trim().length < 10) {
      toast.error('Debe indicar una observacion minima de 10 caracteres');
      return;
    }

    setIsProcessing(true);
    void (async () => {
      try {
        await facturasService.detenerEnTesoreria(facturaSeleccionada.facturaId, motivoRechazo.trim());
        setFacturasTesoreria(await loadFacturas());
        toast.warning(`Factura rechazada en tesoreria: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogRechazar(false);
        setFacturaSeleccionada(null);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No fue posible rechazar el alistamiento.'));
      } finally {
        setIsProcessing(false);
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
              <FileCheck className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Alistar Pagos</h1>
              <p className="text-red-100 text-sm">Preparar el proceso de pago con el soporte generado en SEVEN</p>
            </div>
          </div>
        </motion.div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-800">Filtros de Busqueda</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {[filtros.numeroFactura, filtros.numeroRadicado].filter(Boolean).length > 0
                      ? `${[filtros.numeroFactura, filtros.numeroRadicado].filter(Boolean).length} filtro(s) activo(s)`
                      : 'Sin filtros aplicados'}
                  </p>
                </div>
              </div>
              {(filtros.numeroFactura || filtros.numeroRadicado) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFiltros(FILTROS_INICIALES)}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2 min-w-0 flex-1 basis-48">
                <Label htmlFor="filter-factura" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                  <Search className="w-3 h-3 text-red-600" />
                  N° Factura
                </Label>
                <div className="relative">
                  <Input
                    id="filter-factura"
                    placeholder="Ej: FAC-2026-001"
                    value={filtros.numeroFactura}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, numeroFactura: e.target.value }))}
                    className="border-slate-300 focus:border-red-600 focus:ring-red-600"
                  />
                  {filtros.numeroFactura && (
                    <button onClick={() => setFiltros((prev) => ({ ...prev, numeroFactura: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2 min-w-0 flex-1 basis-48">
                <Label htmlFor="filter-radicado" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                  <Search className="w-3 h-3 text-red-600" />
                  N° Radicado
                </Label>
                <div className="relative">
                  <Input
                    id="filter-radicado"
                    placeholder="Ej: RAD-2026-001"
                    value={filtros.numeroRadicado}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, numeroRadicado: e.target.value }))}
                    className="border-slate-300 focus:border-red-600 focus:ring-red-600"
                  />
                  {filtros.numeroRadicado && (
                    <button onClick={() => setFiltros((prev) => ({ ...prev, numeroRadicado: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2 min-w-0 flex-1 basis-48">
                <Label htmlFor="filter-orden" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                  <Search className="w-3 h-3 text-red-600" />
                  Ordenar lista
                </Label>
                <select
                  id="filter-orden"
                  value={filtros.orden}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, orden: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-slate-700 text-sm focus:border-red-600 focus:outline-none"
                >
                  {ORDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-slate-800">Facturas Pendientes de Alistamiento</CardTitle>
                <CardDescription>
                  Mostrando {facturasOrdenadas.length === 0 ? 0 : (paginaActual - 1) * ITEMS_POR_PAGINA + 1} a {Math.min(paginaActual * ITEMS_POR_PAGINA, facturasOrdenadas.length)} de {facturasOrdenadas.length} facturas
                </CardDescription>
              </div>
              <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2">
                <span className="text-sm font-semibold text-blue-700">{facturasOrdenadas.length} por alistar</span>
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
                    <TableHead className="font-semibold text-slate-700">Proveedor / NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Area</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Días transcurridos</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-slate-500">Cargando facturas de tesoreria...</TableCell>
                    </TableRow>
                  ) : facturasOrdenadas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-slate-500">No hay facturas pendientes de alistamiento con los filtros actuales.</TableCell>
                    </TableRow>
                  ) : facturasPaginadas.map((factura) => {
                    return (
                      <TableRow key={factura.id} className="hover:bg-slate-50">
                        <TableCell>
                          <span className="font-medium text-slate-800">{factura.numeroFactura}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className="w-fit bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-mono">
                            {displayRadicado(factura.numeroRadicado)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-[220px] truncate font-medium text-slate-800" title={displayText(factura.proveedor)}>
                            {displayText(factura.proveedor)}
                          </p>
                          <p className="text-xs font-mono text-slate-500">{displayText(factura.nit)}</p>
                        </TableCell>
                        <TableCell className="text-slate-600">{displayText(factura.areaSolicitante)}</TableCell>
                        <TableCell className="font-semibold text-slate-800">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                        <TableCell>
                          <SlaIndicator dias={factura.diasTranscurridos} objetivo={factura.slaObjetivoDias} />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirDialogDetalle(factura)}
                              className="h-9 w-9 rounded-full border-slate-300 p-0 text-slate-700 hover:bg-slate-50"
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver detalle</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void openDocumentosConsolidados(factura.facturaId, 'tesoreria')}
                              className="h-9 w-9 rounded-full border-blue-200 p-0 text-blue-700 hover:bg-blue-50"
                              title="Ver documentación"
                            >
                              <FolderOpen className="h-4 w-4" />
                              <span className="sr-only">Ver documentación</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadDocumentosConsolidadosPdf(factura.facturaId, factura.numeroFactura, 'tesoreria')}
                              className="h-9 w-9 rounded-full border-slate-300 p-0 text-slate-700 hover:bg-slate-50"
                              title="Descargar soportes"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Descargar documentos</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirDialogRechazar(factura)}
                              className="h-9 w-9 rounded-full border-red-300 p-0 text-red-700 hover:bg-red-50"
                              title="Rechazar alistamiento"
                            >
                              <XCircle className="h-4 w-4" />
                              <span className="sr-only">Rechazar alistamiento</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => abrirDialogAlistar(factura)}
                              className="h-9 w-9 rounded-full bg-blue-600 p-0 text-white hover:bg-blue-700"
                              title="Alistar pago"
                            >
                              <FileCheck className="h-4 w-4" />
                              <span className="sr-only">Alistar pago</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPaginas > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-600">
                  Mostrando {facturasOrdenadas.length === 0 ? 0 : (paginaActual - 1) * ITEMS_POR_PAGINA + 1} a {Math.min(paginaActual * ITEMS_POR_PAGINA, facturasOrdenadas.length)} de {facturasOrdenadas.length} resultados
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))} disabled={paginaActual === 1} className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    <ChevronLeft className="mr-1 h-4 w-4" />Anterior
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
                    Siguiente<ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={mostrarDialogAlistar} onOpenChange={setMostrarDialogAlistar}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Alistar Pago</DialogTitle>
            <DialogDescription>
              Cargue el archivo generado en SEVEN, registre el numero del proceso y deje la observacion del alistamiento.
            </DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-slate-500">Factura</p>
                  <p className="font-bold text-slate-800">{facturaSeleccionada.numeroFactura}</p>
                </div>
                <div>
                  <p className="text-slate-500">Proveedor</p>
                  <p className="font-bold text-slate-800">{facturaSeleccionada.proveedor}</p>
                </div>
                <div>
                  <p className="text-slate-500">Area solicitante</p>
                  <p className="font-bold text-slate-800">{facturaSeleccionada.areaSolicitante}</p>
                </div>
                <div>
                  <p className="text-slate-500">Valor</p>
                  <p className="font-bold text-green-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proceso" className="text-sm font-semibold text-slate-700">Numero Proceso Pago</Label>
                <Input
                  id="proceso"
                  value={numeroProcesoPago}
                  onChange={(e) => setNumeroProcesoPago(e.target.value)}
                  placeholder="Ej: PP-2026-001245"
                />
                <p className="text-xs text-slate-500">
                  Debe coincidir con el consecutivo generado en SEVEN.
                </p>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="archivo-seven" className="text-sm font-semibold text-slate-700">Archivo plano generado en SEVEN</Label>
                  <label htmlFor="archivo-seven" className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm hover:border-blue-300">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">
                        {archivoSeven ? archivoSeven.name : 'Seleccionar archivo'}
                      </p>
                      <p className="text-xs text-slate-500">Formato permitido: TXT</p>
                    </div>
                    <div className="ml-4 flex shrink-0 items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-blue-700">
                      <Upload className="h-4 w-4" />
                      <span className="text-xs font-semibold">Buscar</span>
                    </div>
                  </label>
                  <input
                    id="archivo-seven"
                    type="file"
                    accept=".txt"
                    onChange={(e) => setArchivoSeven(e.target.files?.[0] || null)}
                    className="hidden"
                  />
              </div>

              <div className="space-y-2">
                <Label htmlFor="obs" className="text-sm font-semibold text-slate-700">Observaciones del alistamiento</Label>
                <Textarea
                  id="obs"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Explique brevemente el proceso realizado en SEVEN y cualquier novedad relevante"
                  className="min-h-32"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogAlistar(false)}>Cancelar</Button>
            <Button onClick={alistarPago} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
              {isProcessing ? 'Alistando...' : 'Confirmar alistamiento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarDialogRechazar} onOpenChange={setMostrarDialogRechazar}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Rechazar Alistamiento de Pago</DialogTitle>
            <DialogDescription>Registre la inconsistencia para devolver el tramite con la observacion correspondiente.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="motivo">Observacion de rechazo</Label>
            <Textarea id="motivo" value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Detalle de la inconsistencia detectada (minimo 10 caracteres)" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogRechazar(false)}>Cancelar</Button>
            <Button onClick={rechazarAlistamiento} disabled={isProcessing} className="bg-red-600 hover:bg-red-700">
              {isProcessing ? 'Rechazando...' : 'Confirmar rechazo'}
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
