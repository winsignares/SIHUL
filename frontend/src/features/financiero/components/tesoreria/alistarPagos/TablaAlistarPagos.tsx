import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { Badge } from '../../../../../components/ui/badge';
import { FileCheck, Eye, XCircle, FileText, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { SlaIndicator } from '../../sla-indicator';
import { displayRadicado, displayText } from '../../../../../components/ui/field-placeholders';
import { openDocumentosConsolidados, downloadDocumentosConsolidadosPdf } from '../../documentos-consolidados';
import { ITEMS_POR_PAGINA } from '../../../hooks/tesoreria/alistarPagosUtils';
import type { useAlistarPagos } from '../../../hooks/tesoreria/useAlistarPagos';

type Gestion = ReturnType<typeof useAlistarPagos>;

/** Facturas pendientes de alistamiento, con su paginación. */
export function TablaAlistarPagos({ loading, loadError, paginaActual, setPaginaActual, facturasOrdenadas, totalPaginas, facturasPaginadas, abrirDialogAlistar, abrirDialogRechazar, abrirDialogDetalle }: Pick<Gestion, 'loading' | 'loadError' | 'paginaActual' | 'setPaginaActual' | 'facturasOrdenadas' | 'totalPaginas' | 'facturasPaginadas' | 'abrirDialogAlistar' | 'abrirDialogRechazar' | 'abrirDialogDetalle'>) {
  return (
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
                <TableHead className="font-semibold text-slate-700">Área</TableHead>
                <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                <TableHead className="font-semibold text-slate-700">Días transcurridos</TableHead>
                <TableHead className="text-center font-semibold text-slate-700">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-slate-500">Cargando facturas de Tesorería...</TableCell>
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
  );
}
