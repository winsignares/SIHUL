import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Eye, CheckCircle2, XCircle, Calendar, FolderOpen, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { displayDate, displayRadicado, displayText } from '../../../../components/ui/field-placeholders';
import { openDocumentosConsolidados, downloadDocumentosConsolidadosPdf } from '../documentos-consolidados';
import { SlaIndicator } from '../sla-indicator';
import { ITEMS_POR_PAGINA } from '../../hooks/auditoria/controlPrevioUtils';
import type { useControlPrevio } from '../../hooks/auditoria/useControlPrevio';

type Gestion = ReturnType<typeof useControlPrevio>;

/** Facturas listas para el control previo, con su paginación. */
export function TablaControlPrevio({ loading, loadError, paginaActual, setPaginaActual, facturasOrdenadas, totalPaginas, facturasPaginadas, verDetalle, abrirDialogAprobar, abrirDialogRechazar }: Pick<Gestion, 'loading' | 'loadError' | 'paginaActual' | 'setPaginaActual' | 'facturasOrdenadas' | 'totalPaginas' | 'facturasPaginadas' | 'verDetalle' | 'abrirDialogAprobar' | 'abrirDialogRechazar'>) {
  return (
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
                <TableHead className="font-semibold text-slate-700">Área</TableHead>
                <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                <TableHead className="font-semibold text-slate-700">Fecha Alistamiento</TableHead>
                <TableHead className="font-semibold text-slate-700">Días</TableHead>
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
                  <TableCell colSpan={8} className="text-center text-slate-500 py-6">No hay facturas alistadas para auditoría.</TableCell>
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
                          onClick={() => downloadDocumentosConsolidadosPdf(factura.facturaId, factura.numeroFactura, 'auditoria')}
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
  );
}
