import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Badge } from '../../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import {
  Loader2,
  CheckCircle,
  CheckCircle2,
  Eye,
  Building,
  AlertCircle,
  Landmark,
  FolderOpen,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Textarea } from '../../../share/textarea';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal from '../../../share/factura-detail-modal';
import { SlaIndicator } from '../../../share/sla-indicator';
import { useConfirmacionPagos } from '../../../hooks/financiero/direccion_financiera';
import { displayDate, displayRadicado, displayText } from '../../../share/field-placeholders';
import { downloadDocumentosConsolidados, openDocumentosConsolidados } from '../../../share/documentos-consolidados';

const ITEMS_POR_PAGINA = 5;
const ORDER_OPTIONS = [
  { label: 'Mas recientes primero', value: 'recientes' },
  { label: 'Mas antiguos primero', value: 'antiguos' },
  { label: 'Mayor monto primero', value: 'monto' },
];

export default function ConfirmacionPagos() {
  const {
    facturasConfirmacion,
    facturasFiltradas,
    cargando,
    error,
    procesando,
    facturaSeleccionada,
    detalleAbierto,
    confirmarAbierto,
    numeroConfirmacion,
    observaciones,
    filtros,
    toast,
    setFiltros,
    setObservaciones,
    setDetalleAbierto,
    setConfirmarAbierto,
    abrirDetalle,
    abrirConfirmar,
    cerrarConfirmar,
    confirmarPago,
    cargarFacturas,
  } = useConfirmacionPagos();

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

  const proveedores = Array.from(new Set(facturasConfirmacion.map((factura) => factura.proveedor))).sort();
  const areas = Array.from(
    new Set(facturasConfirmacion.map((factura) => factura.areaSolicitante || '').filter(Boolean))
  ).sort();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_36%),linear-gradient(135deg,_#991b1b_0%,_#b91c1c_42%,_#7f1d1d_100%)] p-7 text-white shadow-[0_24px_60px_-24px_rgba(127,29,29,0.7)]"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-red-50">
              <Landmark className="h-4 w-4 text-amber-300" />
              Direccion Financiera / Control Bancario
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/12">
                <CheckCircle className="h-8 w-8 text-amber-200" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Control de Pago Bancario</h1>
                <p className="mt-2 text-sm leading-6 text-red-50/90">
                  Aqui aparecen unicamente los pagos autorizados por Rectoria para confirmar el control bancario antes del registro del pago aplicado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-4 text-sm font-semibold text-white shadow-xl ${toast.tipo === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.tipo === 'ok' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {toast.msg}
        </motion.div>
      )}

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-800">Filtros y control de confirmacion</CardTitle>
          <CardDescription>Consulta pagos autorizados por Rectoria, prioriza los mas antiguos y confirma el control bancario con trazabilidad.</CardDescription>
        </CardHeader>
        <CardContent>
          <TableFilters
            filters={filtros}
            onFilterChange={setFiltros}
            estados={[]}
            proveedores={proveedores}
            areas={areas}
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-slate-800">Pagos autorizados para control bancario</CardTitle>
              <CardDescription>
                Mostrando {facturasFiltradas.length === 0 ? 0 : (paginaActual - 1) * ITEMS_POR_PAGINA + 1} a {Math.min(paginaActual * ITEMS_POR_PAGINA, facturasFiltradas.length)} de {facturasFiltradas.length} pagos autorizados pendientes de confirmacion bancaria
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
                Autorizados y listos para control
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

          <div className="rounded-2xl border border-slate-200 overflow-hidden">
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
                {cargando ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Cargando pagos autorizados...
                        
                      </div>
                    </TableCell>
                  </TableRow>
                ) : facturasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                      No hay pagos autorizados pendientes de control bancario con los filtros actuales.
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
                          {factura.numeroConfirmacion ? (
                            <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">{factura.numeroConfirmacion}</Badge>
                          ) : (
                            <Badge className="border border-slate-200 bg-slate-50 text-slate-600">Pendiente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirDetalle(factura)}
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
                                void openDocumentosConsolidados(factura.facturaId, 'direccion_financiera');
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
                                void downloadDocumentosConsolidados(factura.facturaId, factura.numeroFactura, 'direccion_financiera');
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
                              onClick={() => abrirConfirmar(factura)}
                              className="h-9 w-9 rounded-full bg-emerald-600 p-0 text-white hover:bg-emerald-700"
                              title="Confirmar control bancario"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="sr-only">Confirmar control bancario</span>
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

      <Dialog open={confirmarAbierto} onOpenChange={setConfirmarAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Confirmar control de pago bancario
            </DialogTitle>
            <DialogDescription>
              {facturaSeleccionada ? `Confirme el cierre bancario para ${facturaSeleccionada.numeroFactura}.` : 'Seleccione una factura.'}
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

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <Landmark className="mt-0.5 h-5 w-5 text-emerald-700" />
                  <div>
                    <p className="font-semibold text-emerald-900">Validacion previa al cierre</p>
                    <ul className="mt-2 space-y-1 text-sm text-emerald-800">
                      <li>- Autorizacion de Rectoria confirmada</li>
                      <li>- Soportes bancarios y expediente verificados</li>
                      <li>- Lista para marcar control bancario realizado</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Numero de confirmacion</label>
                <Input
                  value={numeroConfirmacion}
                  readOnly
                  placeholder="Se genera automaticamente al confirmar"
                />
                <p className="text-xs text-slate-500">Este consecutivo se guarda para trazabilidad del control bancario.</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Observaciones</label>
                <Textarea
                  rows={4}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Registre novedad bancaria, validaciones realizadas o notas de cierre..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cerrarConfirmar} disabled={procesando}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={confirmarPago} disabled={procesando}>
              {procesando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar control
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FacturaDetailModal
        factura={facturaSeleccionada}
        isOpen={detalleAbierto}
        onClose={() => {
          setDetalleAbierto(false);
        }}
      />
    </div>
  );
}
