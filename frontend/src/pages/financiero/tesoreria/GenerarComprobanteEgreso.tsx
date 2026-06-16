/*  */import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Button } from '../../../share/button';
import { Badge } from '../../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../../share/factura-details-helpers';
import { displayDate, displayRadicado, displayText } from '../../../share/field-placeholders';
import { openDocumentosConsolidados, downloadDocumentosConsolidadosPdf } from '../../../share/documentos-consolidados';
import {
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileOutput,
  Filter,
  FolderOpen,
  Loader2,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';

interface FacturaComprobanteRow {
  id: string;
  facturaId: number;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  numeroTransaccion: string;
  proveedor: string;
  nit: string;
  areaSolicitante: string;
  valorTotal: number;
  fechaPagoAplicado: string;
  fechaComprobante: string;
  soportePago: string;
  estado: string;
  raw: APIFactura;
}

const ITEMS_POR_PAGINA = 5;
const ORDER_OPTIONS = [
  { label: 'Mas antiguos primero', value: 'antiguos' },
  { label: 'Mas recientes primero', value: 'recientes' },
] as const;

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

const normalizeEstado = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const isComprobanteFlow = (estado?: string) => {
  const normalized = normalizeEstado(estado);
  return normalized === 'pagada' || normalized === 'pago aplicado' || normalized === 'autorizada';
};

const parseFecha = (value?: string) => (value ? new Date(value).getTime() : 0);

const mapFactura = (factura: APIFactura): FacturaComprobanteRow => ({
  id: String(factura.id),
  facturaId: Number(factura.id),
  numeroFactura: factura.numero_factura || `FAC-${factura.id}`,
  numeroRadicado: factura.numero_radicado || '',
  numeroProcesoPago: factura.numero_proceso_pago || '',
  numeroTransaccion: factura.numero_transaccion || 'Sin transaccion',
  proveedor: factura.proveedor?.razon_social || 'Sin Asignar',
  nit: factura.proveedor?.nit || 'Sin NIT',
  areaSolicitante: factura.departamento?.nombre || 'Sin area',
  valorTotal: Number(factura.valor_total || 0),
  fechaPagoAplicado: factura.fecha_pago_aplicado || factura.fecha_modificacion || '',
  fechaComprobante: factura.fecha_comprobante || '',
  soportePago: factura.numero_transaccion || factura.numero_confirmacion || 'Sin soporte',
  estado: factura.estado,
  raw: factura,
});

export default function GenerarComprobanteEgreso() {
  const [facturasRaw, setFacturasRaw] = useState<APIFactura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);

  const [detalleFactura, setDetalleFactura] = useState<SharedFacturaDetail | null>(null);

  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    numeroRadicado: '',
    numeroProcesoPago: '',
    fechaInicio: '',
    fechaFin: '',
    orden: 'antiguos',
  });

  const filtrosActivos = [filtros.numeroFactura, filtros.numeroRadicado, filtros.numeroProcesoPago, filtros.fechaInicio, filtros.fechaFin].filter(Boolean).length;
  const FILTROS_INICIALES = { numeroFactura: '', numeroRadicado: '', numeroProcesoPago: '', fechaInicio: '', fechaFin: '', orden: 'antiguos' };

  const loadFacturas = useCallback(async () => {
    const response = await facturasService.getAll({ limit: 300, ordering: '-fecha_modificacion' });
    return toList<APIFactura>(response).filter((factura) => isComprobanteFlow(factura.estado));
  }, []);

  const cargarFacturas = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await loadFacturas();
      setFacturasRaw(rows);
    } catch {
      setFacturasRaw([]);
      setLoadError('No fue posible cargar facturas pagadas.');
    } finally {
      setLoading(false);
    }
  }, [loadFacturas]);

  useEffect(() => {
    void cargarFacturas();
  }, [cargarFacturas]);

  const facturasComprobante = useMemo(() => facturasRaw.map(mapFactura), [facturasRaw]);

  const facturasFiltradas = useMemo(() => {
    const filtradas = facturasComprobante.filter((factura) => {
      if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
      if (filtros.numeroRadicado && !factura.numeroRadicado.toLowerCase().includes(filtros.numeroRadicado.toLowerCase())) return false;
      if (filtros.numeroProcesoPago && !factura.numeroProcesoPago.toLowerCase().includes(filtros.numeroProcesoPago.toLowerCase())) return false;
      if (filtros.fechaInicio && factura.fechaPagoAplicado < filtros.fechaInicio) return false;
      if (filtros.fechaFin && factura.fechaPagoAplicado > filtros.fechaFin) return false;
      return true;
    });

    switch (filtros.orden) {
      case 'recientes':
        return filtradas.sort((a, b) => parseFecha(b.fechaPagoAplicado) - parseFecha(a.fechaPagoAplicado));
      default:
        return filtradas.sort((a, b) => parseFecha(a.fechaPagoAplicado) - parseFecha(b.fechaPagoAplicado));
    }
  }, [facturasComprobante, filtros]);

  const totalPaginas = Math.max(1, Math.ceil(facturasFiltradas.length / ITEMS_POR_PAGINA));

  const facturasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return facturasFiltradas.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [facturasFiltradas, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros]);

  useEffect(() => {
    setPaginaActual((prev) => Math.min(prev, totalPaginas));
  }, [totalPaginas]);

  const handleVerDetalle = (factura: FacturaComprobanteRow) => {
    const base = buildSharedFacturaDetail(factura.raw);
    setDetalleFactura(base);
    // Cargar detalle completo con documentos en segundo plano
    void facturasService.getById(factura.facturaId).then((detalle) => {
      setDetalleFactura(buildSharedFacturaDetail(detalle));
    }).catch(() => {});
  };


  return (
    <>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_36%),linear-gradient(135deg,_#991b1b_0%,_#dc2626_42%,_#7f1d1d_100%)] p-7 text-white shadow-[0_24px_60px_-24px_rgba(127,29,29,0.7)]"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/12">
              <FileOutput className="h-8 w-8 text-amber-300" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Factura Autorizada / Pagada</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-red-50/90">
                Facturas autorizadas por Rectoria y pagadas. Descarga el expediente completo con todos los documentos del proceso.
              </p>
            </div>
          </div>
        </motion.div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-800">Filtros de Busqueda</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {filtrosActivos > 0 ? `${filtrosActivos} filtro(s) activo(s)` : 'Sin filtros aplicados'}
                  </p>
                </div>
              </div>
              {filtrosActivos > 0 && (
                <Button type="button" variant="outline" onClick={() => setFiltros(FILTROS_INICIALES)} className="border-red-300 text-red-700 hover:bg-red-50">
                  <X className="w-4 h-4 mr-2" />Limpiar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-3">
              {/* N° Factura */}
              <div className="space-y-2 min-w-0 flex-1 basis-40">
                <Label htmlFor="f-factura" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                  <Search className="w-3 h-3 text-red-600" />N° Factura
                </Label>
                <div className="relative">
                  <Input id="f-factura" placeholder="FAC-2026-001" value={filtros.numeroFactura}
                    onChange={(e) => setFiltros((p) => ({ ...p, numeroFactura: e.target.value }))}
                    className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
                  {filtros.numeroFactura && <button onClick={() => setFiltros((p) => ({ ...p, numeroFactura: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
                </div>
              </div>
              {/* N° Radicado */}
              <div className="space-y-2 min-w-0 flex-1 basis-40">
                <Label htmlFor="f-radicado" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                  <Search className="w-3 h-3 text-red-600" />N° Radicado
                </Label>
                <div className="relative">
                  <Input id="f-radicado" placeholder="RAD-2026-001" value={filtros.numeroRadicado}
                    onChange={(e) => setFiltros((p) => ({ ...p, numeroRadicado: e.target.value }))}
                    className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
                  {filtros.numeroRadicado && <button onClick={() => setFiltros((p) => ({ ...p, numeroRadicado: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
                </div>
              </div>
              {/* N° Proceso Pago */}
              <div className="space-y-2 min-w-0 flex-1 basis-40">
                <Label htmlFor="f-proceso" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                  <Search className="w-3 h-3 text-red-600" />N° Proceso Pago
                </Label>
                <div className="relative">
                  <Input id="f-proceso" placeholder="PP-2026-001" value={filtros.numeroProcesoPago}
                    onChange={(e) => setFiltros((p) => ({ ...p, numeroProcesoPago: e.target.value }))}
                    className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
                  {filtros.numeroProcesoPago && <button onClick={() => setFiltros((p) => ({ ...p, numeroProcesoPago: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
                </div>
              </div>
              {/* Desde */}
              <div className="space-y-2 min-w-0 flex-1 basis-36">
                <Label htmlFor="f-desde" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-600" />Desde
                </Label>
                <Input id="f-desde" type="date" value={filtros.fechaInicio}
                  onChange={(e) => setFiltros((p) => ({ ...p, fechaInicio: e.target.value }))}
                  className="border-slate-300 focus:border-blue-600 focus:ring-blue-600" />
              </div>
              {/* Hasta */}
              <div className="space-y-2 min-w-0 flex-1 basis-36">
                <Label htmlFor="f-hasta" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-600" />Hasta
                </Label>
                <Input id="f-hasta" type="date" value={filtros.fechaFin}
                  onChange={(e) => setFiltros((p) => ({ ...p, fechaFin: e.target.value }))}
                  className="border-slate-300 focus:border-blue-600 focus:ring-blue-600" />
              </div>
              {/* Ordenar */}
              <div className="space-y-2 min-w-0 flex-1 basis-36">
                <Label htmlFor="f-orden" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                  <Search className="w-3 h-3 text-red-600" />Ordenar lista
                </Label>
                <select id="f-orden" value={filtros.orden}
                  onChange={(e) => setFiltros((p) => ({ ...p, orden: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-slate-700 text-sm focus:border-red-600 focus:outline-none">
                  {ORDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-slate-800">Facturas pagadas</CardTitle>
                <CardDescription>
                  Mostrando {facturasFiltradas.length === 0 ? 0 : (paginaActual - 1) * ITEMS_POR_PAGINA + 1} a {Math.min(paginaActual * ITEMS_POR_PAGINA, facturasFiltradas.length)} de {facturasFiltradas.length} facturas con cierre documental
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
                  Expediente disponible para descarga
                </Badge>
                <Button onClick={() => void cargarFacturas()} variant="outline" disabled={loading} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <ShieldCheck className="h-4 w-4" />
                {loadError}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <Table className="table-fixed w-full">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[13%]" />
                  <col className="w-[14%]" />
                  <col className="w-[24%]" />
                  <col className="w-[10%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">N° Proceso Pago</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor / NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha de Pago</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Cargando facturas pagadas...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : facturasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                        No hay facturas pagadas para los filtros actuales.
                      </TableCell>
                    </TableRow>
                  ) : (
                    facturasPaginadas.map((factura, index) => {
                      return (
                        <motion.tr
                          key={factura.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="hover:bg-slate-50"
                        >
                          {/* Factura */}
                          <TableCell>
                            <span className="font-semibold text-slate-800">{displayText(factura.numeroFactura)}</span>
                          </TableCell>
                          {/* Radicado */}
                          <TableCell>
                            <Badge className="border border-blue-200 bg-blue-50 font-mono text-[10px] text-blue-700">
                              {displayRadicado(factura.numeroRadicado)}
                            </Badge>
                          </TableCell>
                          {/* N° Proceso Pago */}
                          <TableCell>
                            <span className="font-mono text-sm text-slate-700">{displayText(factura.numeroProcesoPago)}</span>
                          </TableCell>
                          {/* Proveedor / NIT */}
                          <TableCell>
                            <div className="flex items-start gap-2 min-w-0">
                              <Building className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-800" title={displayText(factura.proveedor)}>
                                  {displayText(factura.proveedor)}
                                </p>
                                <p className="font-mono text-xs text-slate-500">{displayText(factura.nit)}</p>
                              </div>
                            </div>
                          </TableCell>
                          {/* Monto */}
                          <TableCell className="font-semibold text-slate-800 whitespace-nowrap">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                          {/* Fecha de Pago */}
                          <TableCell className="text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {displayDate(factura.fechaPagoAplicado)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-nowrap items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerDetalle(factura)}
                                className="h-9 w-9 rounded-full border-amber-300 p-0 text-amber-700 hover:bg-amber-50"
                                title="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Ver detalle</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDocumentosConsolidados(factura.facturaId, 'tesoreria')}
                                className="h-9 w-9 rounded-full border-blue-200 p-0 text-blue-700 hover:bg-blue-50"
                                title="Ver documentos en nueva pestaña"
                              >
                                <FolderOpen className="h-4 w-4" />
                                <span className="sr-only">Ver documentos</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadDocumentosConsolidadosPdf(factura.facturaId, factura.numeroFactura, 'tesoreria')}
                                className="h-9 w-9 rounded-full border-slate-300 p-0 text-slate-700 hover:bg-slate-50"
                                title="Descargar documentos consolidados PDF"
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Descargar expediente</span>
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPaginas > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-600">
                  Mostrando {facturasFiltradas.length === 0 ? 0 : (paginaActual - 1) * ITEMS_POR_PAGINA + 1} a {Math.min(paginaActual * ITEMS_POR_PAGINA, facturasFiltradas.length)} de {facturasFiltradas.length} resultados
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                    disabled={paginaActual === 1}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Siguiente
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FacturaDetailModal
        factura={detalleFactura}
        isOpen={!!detalleFactura}
        onClose={() => setDetalleFactura(null)}
      />
    </>
  );
}
