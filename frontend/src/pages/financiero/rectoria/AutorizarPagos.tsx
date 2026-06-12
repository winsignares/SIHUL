import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Button } from '../../../share/button';
import { Badge } from '../../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Textarea } from '../../../share/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import FacturaDetailModal from '../../../share/factura-detail-modal';
import { SlaIndicator } from '../../../share/sla-indicator';
import { useAutorizarPagos } from '../../../hooks/financiero/rectoria';
import { displayDate, displayRadicado, displayText } from '../../../share/field-placeholders';
import { downloadDocumentosConsolidadosPdf, openDocumentosConsolidados } from '../../../share/documentos-consolidados';
import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileCheck,
  Filter,
  FolderOpen,
  Loader2,
  Search,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';

const ITEMS_POR_PAGINA = 5;
const ORDER_OPTIONS = [
  { label: 'Mas antiguos primero', value: 'antiguos' },
  { label: 'Mas recientes primero', value: 'recientes' },
  { label: 'SLA critico primero', value: 'sla' },
];

export default function AutorizarPagos() {
  const {
    filtros,
    facturasAutorizacion,
    facturasFiltradas,
    resumen,
    facturaSeleccionada,
    facturaDetalle,
    mostrarDialogAccion,
    mostrarDialogDetalle,
    accion,
    motivo,
    isProcessing,
    cargando,
    error,
    toast,
    setFiltros,
    setMostrarDialogAccion,
    setMostrarDialogDetalle,
    setMotivo,
    abrirDialog,
    handleVerDetalle,
    procesarAutorizacion,
    cargarFacturas,
  } = useAutorizarPagos();

  const [paginaActual, setPaginaActual] = useState(1);

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


  return (
    <>
      <div className="space-y-6">
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl px-5 py-4 text-sm font-semibold text-white shadow-xl ${toast.tipo === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {toast.tipo === 'ok' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {toast.msg}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_36%),linear-gradient(135deg,_#991b1b_0%,_#dc2626_42%,_#7f1d1d_100%)] p-7 text-white shadow-[0_24px_60px_-24px_rgba(127,29,29,0.7)]"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-red-50">
                <FileCheck className="h-4 w-4 text-amber-300" />
                Rectoria / Autorizacion institucional
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/12">
                  <FileCheck className="h-8 w-8 text-amber-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight">Autorizar Pagos (RF09)</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-red-50/90">
                    Valida pagos remitidos por Direccion Financiera, revisa la documentacion completa y toma la decision final con trazabilidad.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-red-100/80">Pendientes</p>
                <p className="mt-2 text-3xl font-black">{cargando ? '--' : facturasFiltradas.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-red-100/80">SLA critico</p>
                <p className="mt-2 text-3xl font-black">{cargando ? '--' : resumen.criticos}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-red-100/80">Promedio dias</p>
                <p className="mt-2 text-3xl font-black">{cargando ? '--' : resumen.promedioDias}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-slate-800">Filtros y orden de autorizacion</CardTitle>
                <CardDescription>Consulta solamente pagos enviados a Rectoria y prioriza los mas antiguos o los de mayor riesgo SLA.</CardDescription>
              </div>
              {(filtros.numeroFactura || filtros.numeroRadicado || filtros.numeroProcesoPago) && (
                <Button size="sm" variant="outline" onClick={() => setFiltros({ numeroFactura: '', numeroRadicado: '', numeroProcesoPago: '', orden: filtros.orden })} className="border-red-200 text-red-600 hover:bg-red-50 gap-1">
                  <X className="h-3 w-3" /> Limpiar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="flex items-center gap-1 text-xs font-medium text-slate-600"><Search className="h-3 w-3" /> N° Factura</Label>
                <Input placeholder="Ej: FAC-2026-001" value={filtros.numeroFactura} onChange={(e) => setFiltros((p) => ({ ...p, numeroFactura: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1 text-xs font-medium text-slate-600"><Search className="h-3 w-3" /> N° Radicado</Label>
                <Input placeholder="Ej: RAD-2026-001" value={filtros.numeroRadicado} onChange={(e) => setFiltros((p) => ({ ...p, numeroRadicado: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1 text-xs font-medium text-slate-600"><Search className="h-3 w-3" /> N° Proceso Pago</Label>
                <Input placeholder="Ej: PRC-2026-001" value={filtros.numeroProcesoPago} onChange={(e) => setFiltros((p) => ({ ...p, numeroProcesoPago: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1 text-xs font-medium text-slate-600"><Filter className="h-3 w-3" /> Ordenar lista</Label>
                <select value={filtros.orden} onChange={(e) => setFiltros((p) => ({ ...p, orden: e.target.value }))} className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700">
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
                <CardTitle className="text-slate-800">Pagos pendientes de decision rectoral</CardTitle>
                <CardDescription>
                  Mostrando {facturasFiltradas.length === 0 ? 0 : (paginaActual - 1) * ITEMS_POR_PAGINA + 1} a {Math.min(paginaActual * ITEMS_POR_PAGINA, facturasFiltradas.length)} de {facturasFiltradas.length} pagos
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700">
                  Valor filtrado: ${resumen.total.toLocaleString('es-CO')}
                </Badge>
                <Button onClick={cargarFacturas} variant="outline" disabled={cargando} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <Loader2 className={`mr-2 h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proceso Pago</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor / NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha envio</TableHead>
                    <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                    <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargando ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Cargando pagos...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : facturasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-slate-500">
                        No hay pagos pendientes con los filtros actuales.
                      </TableCell>
                    </TableRow>
                  ) : (
                    facturasPaginadas.map((factura, index) => {
                      const dias = factura.diasTranscurridos || 0;

                      return (
                        <motion.tr
                          key={factura.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="hover:bg-slate-50"
                        >
                          <TableCell>
                            <span className="font-medium text-slate-800">{displayText(factura.numeroFactura)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className="w-fit border border-blue-200 bg-blue-50 font-mono text-[10px] text-blue-700">
                              {displayRadicado(factura.numeroRadicado)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-slate-700">{displayText(factura.numeroProcesoPago)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <Building className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <div>
                                <p className="max-w-[200px] truncate font-medium text-slate-800" title={displayText(factura.proveedor)}>
                                  {displayText(factura.proveedor)}
                                </p>
                                <p className="font-mono text-xs text-slate-500">{displayText(factura.nit)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-800">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                          <TableCell className="text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {displayDate(factura.fechaEnvioRectoria)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <SlaIndicator dias={dias} objetivo={factura.slaObjetivoDias} compact />
                          </TableCell>
                          <TableCell>
                            <Badge className="border border-amber-200 bg-amber-50 text-amber-700">{factura.estado}</Badge>
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
                                onClick={() => {
                                  if (!factura.facturaId) return;
                                  void openDocumentosConsolidados(factura.facturaId, 'rectoria');
                                }}
                                disabled={!factura.facturaId}
                                className="h-9 w-9 rounded-full border-blue-200 p-0 text-blue-700 hover:bg-blue-50"
                                title="Ver documentacion consolidada"
                              >
                                <FolderOpen className="h-4 w-4" />
                                <span className="sr-only">Ver documentacion consolidada</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (!factura.facturaId) return;
                                  downloadDocumentosConsolidadosPdf(factura.facturaId, factura.numeroFactura, 'rectoria');
                                }}
                                disabled={!factura.facturaId}
                                className="h-9 w-9 rounded-full border-slate-300 p-0 text-slate-700 hover:bg-slate-50"
                                title="Descargar documentacion"
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Descargar documentacion</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => abrirDialog(factura, 'rechazar')}
                                className="h-9 w-9 rounded-full border-red-300 p-0 text-red-700 hover:bg-red-50"
                                title="Rechazo"
                              >
                                <XCircle className="h-4 w-4" />
                                <span className="sr-only">Rechazo</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => abrirDialog(factura, 'aprobar')}
                                className="h-9 w-9 rounded-full bg-emerald-600 p-0 text-white hover:bg-emerald-700"
                                title="Autorizar pago"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="sr-only">Autorizar pago</span>
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

      <Dialog open={mostrarDialogAccion} onOpenChange={setMostrarDialogAccion}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {accion === 'aprobar' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Confirmacion de autorizacion rectoral
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Rechazo y devolucion a Direccion Financiera
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {accion === 'aprobar'
                ? 'Confirme la autorizacion institucional para que el pago continue al cierre bancario.'
                : 'Registre el motivo formal del rechazo para devolver el caso con trazabilidad completa.'}
            </DialogDescription>
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
                  <p className="text-xs text-slate-500">Valor total</p>
                  <p className="font-semibold text-emerald-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</p>
                </div>
              </div>

              {accion === 'aprobar' ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-semibold text-emerald-900">Checklist previo a la autorizacion</p>
                  <ul className="mt-2 space-y-1 text-sm text-emerald-800">
                    <li>- Expediente completo y validado</li>
                    <li>- Valor y tercero conciliados</li>
                    <li>- Listo para continuar al control bancario</li>
                  </ul>
                </div>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="font-semibold text-red-900">Control de rechazo</p>
                  <p className="mt-1 text-sm text-red-800">
                    El motivo quedara guardado en el historial y el pago regresara a Direccion Financiera para ajuste.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {accion === 'rechazar' ? 'Motivo de rechazo' : 'Observaciones de Rectoria'} <span className="text-red-600">*</span>
            </label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={accion === 'rechazar' ? 'Explique claramente el motivo del rechazo y el ajuste requerido...' : 'Registre las observaciones institucionales de la autorizacion...'}
              className={accion === 'rechazar' ? 'border-red-300' : ''}
              rows={4}
            />
            {motivo.trim().length > 0 && motivo.trim().length < 10 ? (
              <p className="text-xs text-red-600">Minimo 10 caracteres ({motivo.trim().length}/10)</p>
            ) : (
              <p className="text-xs text-slate-500">Obligatorio, minimo 10 caracteres.</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMostrarDialogAccion(false);
                setMotivo('');
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={procesarAutorizacion}
              disabled={isProcessing || motivo.trim().length < 10}
              className={accion === 'aprobar' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isProcessing ? 'Procesando...' : accion === 'aprobar' ? 'Confirmar autorizacion' : 'Confirmar rechazo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FacturaDetailModal
        factura={facturaDetalle}
        isOpen={mostrarDialogDetalle}
        onClose={() => {
          setMostrarDialogDetalle(false);
        }}
      />
    </>
  );
}
