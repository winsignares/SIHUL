import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Textarea } from '../../../share/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Badge } from '../../../share/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { buildSharedFacturaDetail, type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import { SlaIndicator } from '../../../share/sla-indicator';
import { displayDate, displayRadicado, displayText } from '../../../share/field-placeholders';
import { downloadDocumentosConsolidados, openDocumentosConsolidados } from '../../../share/documentos-consolidados';
import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FolderOpen,
  Loader2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';

interface FacturaRegistroRow {
  id: string;
  facturaId: number;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  proveedor: string;
  nit: string;
  valorTotal: number;
  fechaAutorizacion: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  slaObjetivoDias?: number | null;
  numeroConfirmacion: string;
  raw: APIFactura;
}

const ITEMS_POR_PAGINA = 5;
const ORDER_OPTIONS = [
  { label: 'Mas antiguos primero', value: 'antiguos' },
  { label: 'Mas recientes primero', value: 'recientes' },
  { label: 'SLA critico primero', value: 'sla' },
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

const isConfirmadaParaRegistro = (factura: APIFactura) => {
  const estadoNormalizado = normalizeEstado(factura.estado);
  return estadoNormalizado === 'autorizada' && Boolean(factura.numero_confirmacion) && !factura.numero_transaccion;
};

const parseFecha = (value?: string) => (value ? new Date(value).getTime() : 0);

const mapFactura = (factura: APIFactura): FacturaRegistroRow => ({
  id: String(factura.id),
  facturaId: Number(factura.id),
  numeroFactura: factura.numero_factura || `FAC-${factura.id}`,
  numeroRadicado: factura.numero_radicado || '',
  numeroProcesoPago: factura.numero_proceso_pago || '',
  proveedor: factura.proveedor?.razon_social || 'Sin Asignar',
  nit: factura.proveedor?.nit || 'Sin NIT',
  valorTotal: Number(factura.valor_total || 0),
  fechaAutorizacion: factura.fecha_autorizacion || factura.fecha_modificacion || factura.fecha_recepcion || '',
  areaSolicitante: factura.departamento?.nombre || 'Sin Asignar',
  estado: factura.estado,
  diasTranscurridos: Math.max(0, Number(factura.dias_transcurridos || 0)),
  slaObjetivoDias: factura.sla_objetivo_dias ?? null,
  numeroConfirmacion: factura.numero_confirmacion || 'Sin confirmacion',
  raw: factura,
});

export default function RegistrarPagoAplicado() {
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    estado: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: '',
    orden: 'antiguos',
  });

  const [paginaActual, setPaginaActual] = useState(1);
  const [facturasRaw, setFacturasRaw] = useState<APIFactura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaRegistroRow | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogRegistrar, setMostrarDialogRegistrar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [numeroTransaccion, setNumeroTransaccion] = useState('');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null);
  const [observaciones, setObservaciones] = useState('');

  const loadFacturas = async () => {
    const response = await facturasService.getAll({ limit: 300, ordering: '-fecha_modificacion' });
    return toList<APIFactura>(response).filter(isConfirmadaParaRegistro);
  };

  const cargarFacturas = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await loadFacturas();
      setFacturasRaw(rows);
    } catch {
      setFacturasRaw([]);
      setLoadError('No fue posible cargar pagos listos para registrar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarFacturas();
  }, []);

  const facturasRegistro = useMemo(() => facturasRaw.map(mapFactura), [facturasRaw]);

  const facturasFiltradas = useMemo(() => {
    const filtradas = facturasRegistro.filter((factura) => {
      if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
      if (filtros.proveedor && factura.proveedor !== filtros.proveedor) return false;
      if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
      if (filtros.fechaInicio && factura.fechaAutorizacion < filtros.fechaInicio) return false;
      if (filtros.fechaFin && factura.fechaAutorizacion > filtros.fechaFin) return false;
      return true;
    });

    switch (filtros.orden) {
      case 'recientes':
        return filtradas.sort((a, b) => parseFecha(b.fechaAutorizacion) - parseFecha(a.fechaAutorizacion));
      case 'sla':
        return filtradas.sort((a, b) => (b.diasTranscurridos || 0) - (a.diasTranscurridos || 0));
      default:
        return filtradas.sort((a, b) => parseFecha(a.fechaAutorizacion) - parseFecha(b.fechaAutorizacion));
    }
  }, [facturasRegistro, filtros]);

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

  const proveedores = Array.from(new Set(facturasRegistro.map((factura) => factura.proveedor))).sort();
  const areas = Array.from(new Set(facturasRegistro.map((factura) => factura.areaSolicitante).filter(Boolean))).sort();

  const abrirDialogRegistrar = (factura: FacturaRegistroRow) => {
    setFacturaSeleccionada(factura);
    setNumeroTransaccion('');
    setFechaPago(new Date().toISOString().split('T')[0]);
    setArchivoComprobante(null);
    setObservaciones('');
    setMostrarDialogRegistrar(true);
  };

  const handleVerDetalle = (factura: FacturaRegistroRow) => {
    setFacturaDetalle(buildSharedFacturaDetail(factura.raw));
    setMostrarDialogDetalle(true);
  };

  const registrarPago = () => {
    if (!facturaSeleccionada) return;

    if (!numeroTransaccion.trim()) {
      toast.error('Debe ingresar el numero de transaccion bancaria.');
      return;
    }

    if (!archivoComprobante) {
      toast.error('Debe cargar el comprobante bancario.');
      return;
    }

    setIsProcessing(true);

    void (async () => {
      try {
        await facturasService.registrarPagoAplicado(facturaSeleccionada.facturaId, {
          numero_transaccion: numeroTransaccion.trim(),
          fecha_pago_aplicado: fechaPago,
          observaciones: observaciones.trim() || undefined,
          comprobante_bancario: archivoComprobante,
        });
        toast.success(`Pago aplicado registrado: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogRegistrar(false);
        setFacturaSeleccionada(null);
        setNumeroTransaccion('');
        setObservaciones('');
        setArchivoComprobante(null);
        await cargarFacturas();
      } catch (error: any) {
        toast.error(error?.message || 'No fue posible registrar el pago aplicado.');
      } finally {
        setIsProcessing(false);
      }
    })();
  };

  const onSelectComprobante = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setArchivoComprobante(null);
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    const allowedExtensions = ['pdf', 'xml', 'png', 'jpg', 'jpeg'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(extension)) {
      toast.error('Formato no permitido. Use PDF, XML, PNG o JPG.');
      event.target.value = '';
      setArchivoComprobante(null);
      return;
    }

    if (file.size > maxSizeBytes) {
      toast.error('El archivo supera el tamaño maximo permitido (10 MB).');
      event.target.value = '';
      setArchivoComprobante(null);
      return;
    }

    setArchivoComprobante(file);
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
              <CheckCircle className="h-8 w-8 text-amber-300" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Registrar Pago Aplicado</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-red-50/90">
                Registra en SIHUL los pagos ya ejecutados en el banco, una vez confirmados previamente por Direccion Financiera en control bancario.
              </p>
            </div>
          </div>
        </motion.div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-800">Filtros y orden de registro</CardTitle>
            <CardDescription>Consulta pagos confirmados por Direccion Financiera y prioriza los mas antiguos o los de mayor criticidad.</CardDescription>
          </CardHeader>
          <CardContent>
            <TableFilters
              filters={filtros}
              onFilterChange={setFiltros}
              proveedores={proveedores}
              areas={areas}
              showFechaFilter
              showAreaFilter
              showEstadoFilter={false}
              orderKey="orden"
              orderLabel="Ordenar lista"
              orderOptions={[...ORDER_OPTIONS]}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-slate-800">Pagos confirmados listos para registrar</CardTitle>
                <CardDescription>
                  Mostrando {facturasFiltradas.length === 0 ? 0 : (paginaActual - 1) * ITEMS_POR_PAGINA + 1} a {Math.min(paginaActual * ITEMS_POR_PAGINA, facturasFiltradas.length)} de {facturasFiltradas.length} pagos listos para registro bancario
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
                  Confirmados por Direccion Financiera
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
                <AlertCircle className="h-4 w-4" />
                {loadError}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                    <TableHead className="font-semibold text-slate-700">Factura / Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor / NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Area</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha autorizacion</TableHead>
                    <TableHead className="font-semibold text-slate-700">Confirmacion</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Cargando pagos confirmados...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : facturasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                        No hay pagos confirmados listos para registrar con los filtros actuales.
                      </TableCell>
                    </TableRow>
                  ) : (
                    facturasPaginadas.map((factura, index) => {
                      const dias = factura.diasTranscurridos || 0;
                      const colorRiesgo = dias >= 3 ? 'bg-amber-500' : 'bg-emerald-500';

                      return (
                        <motion.tr
                          key={factura.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="hover:bg-slate-50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`h-3 w-3 rounded-full ${colorRiesgo}`} />
                              <SlaIndicator dias={dias} objetivo={factura.slaObjetivoDias} compact />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800">{displayText(factura.numeroFactura)}</span>
                              <Badge className="mt-1 w-fit border border-blue-200 bg-blue-50 font-mono text-[10px] text-blue-700">
                                {displayRadicado(factura.numeroRadicado)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <Building className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <div>
                                <p className="max-w-[220px] truncate font-medium text-slate-800" title={displayText(factura.proveedor)}>
                                  {displayText(factura.proveedor)}
                                </p>
                                <p className="font-mono text-xs text-slate-500">{displayText(factura.nit)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{displayText(factura.areaSolicitante)}</TableCell>
                          <TableCell className="font-semibold text-slate-800">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                          <TableCell className="text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {displayDate(factura.fechaAutorizacion)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                              {displayText(factura.numeroConfirmacion)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-wrap items-center justify-center gap-2">
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
                                onClick={() => void openDocumentosConsolidados(factura.facturaId, 'tesoreria')}
                                className="h-9 w-9 rounded-full border-blue-200 p-0 text-blue-700 hover:bg-blue-50"
                                title="Ver documentacion consolidada"
                              >
                                <FolderOpen className="h-4 w-4" />
                                <span className="sr-only">Ver documentacion consolidada</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void downloadDocumentosConsolidados(factura.facturaId, factura.numeroFactura, 'tesoreria')}
                                className="h-9 w-9 rounded-full border-slate-300 p-0 text-slate-700 hover:bg-slate-50"
                                title="Descargar documentacion"
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Descargar documentacion</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => abrirDialogRegistrar(factura)}
                                className="h-9 w-9 rounded-full bg-emerald-600 p-0 text-white hover:bg-emerald-700"
                                title="Registrar pago aplicado"
                              >
                                <Upload className="h-4 w-4" />
                                <span className="sr-only">Registrar pago aplicado</span>
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

      <Dialog open={mostrarDialogRegistrar} onOpenChange={setMostrarDialogRegistrar}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Registrar pago ejecutado
            </DialogTitle>
            <DialogDescription>Registre en el sistema el pago ya aplicado en el portal bancario externo.</DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Factura</p>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Proveedor</p>
                  <p className="truncate font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Confirmacion bancaria</p>
                  <p className="font-semibold text-emerald-700">{facturaSeleccionada.numeroConfirmacion}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="trans" className="text-xs text-slate-500">Numero de transaccion</Label>
                  <Input id="trans" value={numeroTransaccion} onChange={(e) => setNumeroTransaccion(e.target.value)} placeholder="TRX-XXXX" />
                </div>
                <div>
                  <Label htmlFor="fecha-pago" className="text-xs text-slate-500">Fecha de pago aplicado</Label>
                  <Input id="fecha-pago" type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="comprobante-bancario" className="text-xs text-slate-500">Comprobante bancario (requerido)</Label>
                  <Input id="comprobante-bancario" type="file" accept=".pdf,.xml,.png,.jpg,.jpeg" onChange={onSelectComprobante} />
                  <Input value={archivoComprobante?.name || ''} readOnly placeholder="Sin archivo" />
                  <p className="text-xs text-slate-500">Formatos: PDF, XML, PNG o JPG. Maximo 10 MB.</p>
                </div>
              </div>

              <div>
                <Label htmlFor="obs" className="text-sm font-medium text-slate-700">Observaciones</Label>
                <Textarea id="obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas de registro interno" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogRegistrar(false)}>Cancelar</Button>
            <Button onClick={registrarPago} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700">
              {isProcessing ? 'Registrando...' : 'Confirmar registro'}
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
