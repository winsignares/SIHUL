import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { Badge } from '../../../../../components/ui/badge';
import { SlaIndicator } from '../../sla-indicator';
import { displayDate, displayRadicado, displayText } from '../../../../../components/ui/field-placeholders';
import { downloadDocumentosConsolidados, openDocumentosConsolidados } from '../../documentos-consolidados';
import { AlertCircle, Building, Calendar, ChevronLeft, ChevronRight, Download, Eye, FolderOpen, Loader2, Upload } from 'lucide-react';
import { ITEMS_POR_PAGINA } from '../../../hooks/tesoreria/registrarPagoAplicadoUtils';
import type { useRegistrarPagoAplicado } from '../../../hooks/tesoreria/useRegistrarPagoAplicado';

type Gestion = ReturnType<typeof useRegistrarPagoAplicado>;

/** Pagos confirmados listos para registrar, con su paginación. */
export function TablaRegistrarPago({ paginaActual, setPaginaActual, loading, loadError, cargarFacturas, facturasFiltradas, totalPaginas, facturasPaginadas, abrirDialogRegistrar, handleVerDetalle }: Pick<Gestion, 'paginaActual' | 'setPaginaActual' | 'loading' | 'loadError' | 'cargarFacturas' | 'facturasFiltradas' | 'totalPaginas' | 'facturasPaginadas' | 'abrirDialogRegistrar' | 'handleVerDetalle'>) {
  return (
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
              Confirmados por Dirección Financiera
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
                <TableHead className="font-semibold text-slate-700">Área</TableHead>
                <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                <TableHead className="font-semibold text-slate-700">Fecha de autorización</TableHead>
                <TableHead className="font-semibold text-slate-700">Confirmación</TableHead>
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
  );
}
