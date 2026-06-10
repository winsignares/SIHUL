import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Textarea } from '../../../share/textarea';
import { Label } from '../../../share/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Badge } from '../../../share/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import { Send, Eye, Calendar, AlertCircle, TrendingUp, FolderOpen, FileText, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail, buildSharedFacturaDetail } from '../../../share/factura-detail-modal';
import { openDocumentosConsolidados, downloadDocumentosConsolidados } from '../../../share/documentos-consolidados';
import { displayDate, displayRadicado, displayText } from '../../../share/field-placeholders';
import { SlaIndicator } from '../../../share/sla-indicator';
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
  fechaAprobacionAuditoria: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  slaObjetivoDias?: number | null;
  descripcion: string;
  observacionesAuditoria?: string;
}

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
  { label: 'SLA critico primero', value: 'sla' },
];

const ITEMS_POR_PAGINA = 5;

const ESTADOS_APROBADOS_AUDITORIA = new Set([
  'Aprobada Auditoría',
  'Aprobada AuditorÃ­a',
]);

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
  fechaAprobacionAuditoria: f.fecha_aprobacion_auditoria || '',
  areaSolicitante: f.departamento?.nombre || 'Sin asignar',
  estado: f.estado,
  diasTranscurridos: Math.max(0, Number(f.dias_transcurridos || 0)),
  slaObjetivoDias: f.sla_objetivo_dias ?? null,
  descripcion: f.descripcion || 'Sin asignar',
  observacionesAuditoria: f.observaciones,
});

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function EnviarDireccionFinanciera() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogEnviar, setMostrarDialogEnviar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [mostrarDialogRechazar, setMostrarDialogRechazar] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [facturasAprobadas, setFacturasAprobadas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);

  const loadFacturas = async () => {
    const response = await facturasService.getAll({ limit: 200 });
    return toList<APIFactura>(response)
      .filter((factura) => ESTADOS_APROBADOS_AUDITORIA.has(factura.estado))
      .map(mapFactura);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        setFacturasAprobadas(await loadFacturas());
      } catch {
        setFacturasAprobadas([]);
        setLoadError('No fue posible cargar facturas aprobadas para envio.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const facturasFiltradas = useMemo(() => {
    const fechaInicio = filtros.fechaInicio ? new Date(filtros.fechaInicio) : null;
    const fechaFin = filtros.fechaFin ? new Date(filtros.fechaFin) : null;

    return facturasAprobadas.filter((factura) => {
      if (filtros.numeroFactura && !(factura.numeroFactura ?? '').toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
      if (filtros.proveedor && !(factura.proveedor ?? '').toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
      if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
      if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
      if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;

      const fechaFactura = factura.fechaAprobacionAuditoria ? new Date(factura.fechaAprobacionAuditoria) : null;
      if (fechaInicio && fechaFactura && fechaFactura < fechaInicio) return false;
      if (fechaFin && fechaFactura && fechaFactura > fechaFin) return false;
      return true;
    });
  }, [facturasAprobadas, filtros]);

  const facturasOrdenadas = useMemo(() => {
    const listado = [...facturasFiltradas];
    switch (filtros.orden) {
      case 'antiguos':
        return listado.sort((a, b) => new Date(a.fechaAprobacionAuditoria || 0).getTime() - new Date(b.fechaAprobacionAuditoria || 0).getTime());
      case 'sla':
        return listado.sort((a, b) => b.diasTranscurridos - a.diasTranscurridos);
      default:
        return listado.sort((a, b) => new Date(b.fechaAprobacionAuditoria || 0).getTime() - new Date(a.fechaAprobacionAuditoria || 0).getTime());
    }
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

  const abrirDialogEnviar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setObservaciones('');
    setMostrarDialogEnviar(true);
  };

  const abrirDialogRechazar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMotivoRechazo('');
    setMostrarDialogRechazar(true);
  };

  const handleVerDetalle = async (factura: Factura) => {
    setMostrarDialogDetalle(true);
    try {
      const detail = await facturasService.getById(factura.facturaId);
      setFacturaDetalle(buildSharedFacturaDetail(detail));
    } catch {
      setFacturaDetalle({
        facturaId: factura.facturaId,
        numeroFactura: factura.numeroFactura,
        numeroRadicado: factura.numeroRadicado,
        proveedor: factura.proveedor,
        nit: factura.nit,
        valorTotal: factura.valorTotal,
        areaSolicitante: factura.areaSolicitante,
        estado: factura.estado,
        diasTranscurridos: factura.diasTranscurridos,
        fechaRecepcion: factura.fechaAprobacionAuditoria,
        descripcion: factura.descripcion,
        observaciones: factura.observacionesAuditoria,
        numeroProcesoPago: factura.numeroProcesoPago,
        nivelRiesgo: factura.diasTranscurridos > 17 ? 'rojo' : factura.diasTranscurridos > 10 ? 'amarillo' : 'verde',
      });
    }
  };

  const enviarDireccionFinanciera = () => {
    if (!facturaSeleccionada) return;

    setIsProcessing(true);
    void (async () => {
      try {
        await facturasService.enviarDireccionFinanciera(facturaSeleccionada.facturaId, observaciones.trim() || undefined);
        setFacturasAprobadas(await loadFacturas());
        toast.success(`Factura enviada a Direccion Financiera: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogEnviar(false);
        setFacturaSeleccionada(null);
        setObservaciones('');
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No fue posible enviar la factura a Direccion Financiera.'));
      } finally {
        setIsProcessing(false);
      }
    })();
  };

  const rechazarEnvio = () => {
    if (!facturaSeleccionada) return;
    if (motivoRechazo.trim().length < 10) {
      toast.error('Debes detallar el motivo (minimo 10 caracteres).');
      return;
    }

    setIsProcessing(true);
    void (async () => {
      try {
        await facturasService.detenerEnTesoreria(facturaSeleccionada.facturaId, motivoRechazo.trim());
        setFacturasAprobadas(await loadFacturas());
        toast.warning(`Factura detenida antes de enviar: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogRechazar(false);
        setFacturaSeleccionada(null);
        setMotivoRechazo('');
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No fue posible detener el envio.'));
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
              <Send className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Enviar a Direccion Financiera</h1>
              <p className="text-red-100 text-sm">Facturas aprobadas por auditoria listas para remision formal</p>
            </div>
          </div>
        </motion.div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Filtros de Busqueda Independientes
            </CardTitle>
            <CardDescription>Filtre por columna especifica usando los campos independientes</CardDescription>
          </CardHeader>
          <CardContent>
            <TableFilters
              filters={filtros}
              onFilterChange={setFiltros}
              proveedores={Array.from(new Set(facturasAprobadas.map((f) => f.proveedor)))}
              areas={Array.from(new Set(facturasAprobadas.map((f) => f.areaSolicitante)))}
              showFechaFilter
              showAreaFilter
              showEstadoFilter={false}
              orderKey="orden"
              orderLabel="Ordenar lista"
              orderOptions={ORDER_OPTIONS}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-slate-800">Facturas Aprobadas por Auditoria</CardTitle>
                <CardDescription>
                  Mostrando {facturasOrdenadas.length === 0 ? 0 : (paginaActual - 1) * ITEMS_POR_PAGINA + 1} a {Math.min(paginaActual * ITEMS_POR_PAGINA, facturasOrdenadas.length)} de {facturasOrdenadas.length} facturas
                </CardDescription>
              </div>
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
                <span className="text-sm font-semibold text-emerald-700">{facturasOrdenadas.length} por enviar</span>
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
                    <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                    <TableHead className="font-semibold text-slate-700">Factura / Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proceso Pago</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor / NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Area</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha Aprobacion</TableHead>
                    <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-6 text-center text-slate-500">Cargando facturas aprobadas...</TableCell>
                    </TableRow>
                  ) : facturasOrdenadas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-6 text-center text-slate-500">No hay facturas aprobadas para enviar.</TableCell>
                    </TableRow>
                  ) : facturasPaginadas.map((factura) => {
                    const colorRiesgo = factura.diasTranscurridos >= 18 ? 'bg-orange-500' : factura.diasTranscurridos >= 12 ? 'bg-yellow-500' : 'bg-green-500';

                    return (
                      <TableRow key={factura.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${colorRiesgo}`} />
                            {factura.diasTranscurridos >= 18 && <AlertCircle className="h-4 w-4 text-orange-700" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">{factura.numeroFactura}</span>
                            <Badge className="mt-1 w-fit border border-blue-200 bg-blue-100 text-[10px] font-mono text-blue-700">
                              {displayRadicado(factura.numeroRadicado)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="w-fit border border-amber-200 bg-amber-50 font-mono text-xs text-amber-700">
                            {factura.numeroProcesoPago}
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
                        <TableCell className="text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {displayDate(factura.fechaAprobacionAuditoria)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <SlaIndicator dias={factura.diasTranscurridos} objetivo={factura.slaObjetivoDias} className="font-bold text-slate-700" compact />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleVerDetalle(factura)} className="h-9 w-9 rounded-full border-slate-300 p-0 text-slate-700 hover:bg-slate-50" title="Detalle">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Detalle</span>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => void openDocumentosConsolidados(factura.facturaId, 'tesoreria')} className="h-9 w-9 rounded-full border-blue-200 p-0 text-blue-700 hover:bg-blue-50" title="Ver documentos">
                              <FolderOpen className="h-4 w-4" />
                              <span className="sr-only">Ver documentos</span>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => void downloadDocumentosConsolidados(factura.facturaId, factura.numeroFactura, 'tesoreria')} className="h-9 w-9 rounded-full border-slate-300 p-0 text-slate-700 hover:bg-slate-50" title="Descargar documentos">
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Descargar documentos</span>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => abrirDialogRechazar(factura)} className="h-9 w-9 rounded-full border-red-300 p-0 text-red-700 hover:bg-red-50" title="Rechazar">
                              <XCircle className="h-4 w-4" />
                              <span className="sr-only">Rechazar</span>
                            </Button>
                            <Button size="sm" onClick={() => abrirDialogEnviar(factura)} className="h-9 w-9 rounded-full bg-purple-600 p-0 text-white hover:bg-purple-700" title="Enviar">
                              <Send className="h-4 w-4" />
                              <span className="sr-only">Enviar</span>
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

      <Dialog open={mostrarDialogEnviar} onOpenChange={setMostrarDialogEnviar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Send className="h-5 w-5 text-purple-600" />
              Enviar a Direccion Financiera
            </DialogTitle>
            <DialogDescription>Confirme el envio formal de la factura aprobada por auditoria.</DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="text-slate-600">Factura: <span className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</span></p>
                <p className="text-slate-600">Proveedor: <span className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</span></p>
                <p className="text-slate-600">Monto: <span className="font-semibold text-green-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</span></p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="obs-envio" className="text-sm font-semibold text-slate-700">Observaciones de envio</Label>
                <Textarea
                  id="obs-envio"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones opcionales para Direccion Financiera"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogEnviar(false)}>Cancelar</Button>
            <Button onClick={enviarDireccionFinanciera} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700">
              {isProcessing ? 'Enviando...' : 'Confirmar envio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarDialogRechazar} onOpenChange={setMostrarDialogRechazar}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <XCircle className="h-5 w-5 text-red-600" />
              Rechazar envio
            </DialogTitle>
            <DialogDescription>Describe por que la factura no se enviara a Direccion Financiera.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="motivo-rechazo" className="text-sm font-semibold text-slate-700">Motivo del rechazo</Label>
            <Textarea
              id="motivo-rechazo"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Explica brevemente la inconsistencia encontrada"
              className="min-h-[140px]"
            />
            <p className="text-xs text-slate-500">El comentario se registrara en tesoreria para seguimiento.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogRechazar(false)}>Cancelar</Button>
            <Button onClick={rechazarEnvio} disabled={isProcessing} className="bg-red-600 text-white hover:bg-red-700">
              {isProcessing ? 'Registrando...' : 'Confirmar rechazo'}
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
