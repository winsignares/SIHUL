import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { displayDate, displayRadicado, displayText } from '../../../../../components/ui/field-placeholders';
import { openDocumentosConsolidados, downloadDocumentosConsolidadosPdf } from '../../documentos-consolidados';
import { Building, Calendar, ChevronLeft, ChevronRight, Download, Eye, FolderOpen, Loader2, ShieldCheck } from 'lucide-react';
import { ITEMS_POR_PAGINA } from '../../../hooks/tesoreria/generarComprobanteEgresoUtils';
import type { useGenerarComprobanteEgreso } from '../../../hooks/tesoreria/useGenerarComprobanteEgreso';

type Gestion = ReturnType<typeof useGenerarComprobanteEgreso>;

/** Facturas pagadas, con su paginación y la descarga del comprobante. */
export function TablaComprobanteEgreso({ loading, loadError, paginaActual, setPaginaActual, cargarFacturas, facturasFiltradas, totalPaginas, facturasPaginadas, handleVerDetalle }: Pick<Gestion, 'loading' | 'loadError' | 'paginaActual' | 'setPaginaActual' | 'cargarFacturas' | 'facturasFiltradas' | 'totalPaginas' | 'facturasPaginadas' | 'handleVerDetalle'>) {
  return (
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
  );
}
