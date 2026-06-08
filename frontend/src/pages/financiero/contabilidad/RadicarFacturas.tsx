import { motion } from 'framer-motion';
import { Card, CardContent } from '../../../share/card';
import { Button } from '../../../share/button';
import { Textarea } from '../../../share/textarea';
import { Badge } from '../../../share/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../share/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../share/table';
import {
  FileCheck,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  AlertCircle,
  RefreshCw,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal from '../../../share/factura-detail-modal';
import { useContabilidadRadicarFacturas } from '../../../hooks/financiero/contabilidad';
import { displayDate, displayText } from '../../../share/field-placeholders';
import { downloadDocumentosConsolidados, openDocumentosConsolidados } from '../../../share/documentos-consolidados';

export default function RadicarFacturas() {
  const {
    facturas,
    docsMap,
    cargando,
    error,
    facturaSeleccionada,
    accion,
    observaciones,
    numeroOperacionContable,
    consecutivoOperacion,
    soporteOperacion,
    procesando,
    toast,
    modalFactura,
    filtros,
    facturasFiltradas,
    facturasPaginadas,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setObservaciones,
    setNumeroOperacionContable,
    setConsecutivoOperacion,
    setSoporteOperacion,
    setFiltros,
    setModalFactura,
    cargarFacturas,
    abrirDetalle,
    iniciarAccion,
    cancelarAccion,
    confirmarRadicacion,
    confirmarDevolucion,
    validarDocumentosCompletos,
    obtenerDocumentosFaltantes,
    getSlaLevel,
    dotColor,
    diasColor,
  } = useContabilidadRadicarFacturas();

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl text-white font-semibold ${toast.tipo === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.tipo === 'ok' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.msg}
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FileCheck className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-2xl font-bold">Radicar Facturas</h1>
              <p className="text-red-100 text-sm">Formalizar la entrada de documentos al sistema institucional</p>
            </div>
          </div>
          <Button
            onClick={cargarFacturas}
            variant="outline"
            className="border-yellow-300 text-slate-900 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 shadow-lg shadow-yellow-500/30 hover:from-yellow-400 hover:via-yellow-500 hover:to-amber-500 hover:text-slate-900 disabled:opacity-60"
            disabled={cargando}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </motion.div>

      {/* Dialogs de acción (Radicar / Devolver) */}
      <Dialog open={!!facturaSeleccionada && accion === 'radicar'} onOpenChange={(o) => { if (!o) cancelarAccion(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" /> Confirmar Radicación
            </DialogTitle>
            <DialogDescription>
              Se generará automáticamente el número de radicado y se cambiará el estado a <strong>Radicada</strong>.
            </DialogDescription>
          </DialogHeader>
          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500">Factura</p><p className="font-bold">{facturaSeleccionada.numero_factura}</p></div>
                <div><p className="text-slate-500">Proveedor</p><p className="font-bold">{displayText(facturaSeleccionada.proveedor?.razon_social)}</p></div>
                <div><p className="text-slate-500">Monto</p><p className="font-bold text-green-700">${Number(facturaSeleccionada.valor_total).toLocaleString('es-CO')}</p></div>
                <div><p className="text-slate-500">Área</p><p className="font-bold">{displayText(facturaSeleccionada.departamento?.nombre)}</p></div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Numero de operacion (Opcional)</label>
                <input
                  value={numeroOperacionContable}
                  onChange={(e) => setNumeroOperacionContable(e.target.value)}
                  placeholder="Ej: OP-2026-A1"
                  className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-800 focus:border-green-600 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Consecutivo (Opcional)</label>
                <input
                  value={consecutivoOperacion}
                  onChange={(e) => setConsecutivoOperacion(e.target.value)}
                  placeholder="Ej: CONS-00451"
                  className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-800 focus:border-green-600 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Soporte de operacion (PDF opcional)</label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setSoporteOperacion(e.target.files?.[0] || null)}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
                />
                {soporteOperacion && <p className="text-xs text-slate-500">Archivo seleccionado: {soporteOperacion.name}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Observaciones (Opcional)</label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones sobre la radicación..."
                  className="min-h-20 border-slate-300"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={cancelarAccion} variant="outline" className="flex-1" disabled={procesando}>Cancelar</Button>
                <Button onClick={confirmarRadicacion} disabled={procesando} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  {procesando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</> : <><Send className="w-4 h-4 mr-2" />Radicar</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!facturaSeleccionada && accion === 'devolver'} onOpenChange={(o) => { if (!o) cancelarAccion(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" /> Devolver Factura
            </DialogTitle>
            <DialogDescription>
              La factura volverá al proveedor para corrección. Este campo es <strong>obligatorio</strong>.
            </DialogDescription>
          </DialogHeader>
          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500">Factura</p><p className="font-bold">{facturaSeleccionada.numero_factura}</p></div>
                <div><p className="text-slate-500">Proveedor</p><p className="font-bold">{displayText(facturaSeleccionada.proveedor?.razon_social)}</p></div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-red-700">* Motivo de Devolución (Requerido)</label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Especifique claramente qué correcciones o documentos faltan..."
                  className="min-h-28 border-red-300 focus:border-red-600"
                />
                <p className="text-xs text-slate-500">Mínimo 10 caracteres.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={cancelarAccion} variant="outline" className="flex-1" disabled={procesando}>Cancelar</Button>
                <Button onClick={confirmarDevolucion} disabled={procesando} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  {procesando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</> : <><Send className="w-4 h-4 mr-2" />Devolver</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de detalle */}
      <FacturaDetailModal factura={modalFactura} isOpen={!!modalFactura} onClose={() => setModalFactura(null)} />

      {/* Filtros */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <TableFilters
            filters={filtros}
            onFilterChange={setFiltros}
            estados={[]}
            proveedores={Array.from(new Set(facturas.map((f) => f.proveedor?.razon_social ?? '').filter(Boolean)))}
            areas={Array.from(new Set(facturas.map((f) => f.departamento?.nombre ?? '').filter(Boolean)))}
            showFechaFilter={true}
            showAreaFilter={true}
            showEstadoFilter={false}
          />
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Facturas Pendientes de Radicación</h2>
              <p className="text-sm text-slate-500">{facturasFiltradas.length} factura(s) en estado <em>Registrada</em> - Página {currentPage} de {totalPages || 1}</p>
            </div>
          </div>

          {cargando ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mr-3" /> Cargando facturas...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-red-500 gap-2">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          ) : facturasFiltradas.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay facturas pendientes de radicación</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                    <TableHead className="font-semibold text-slate-700">N° Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor / NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Área</TableHead>
                    <TableHead className="font-semibold text-slate-700">Recepción</TableHead>
                    <TableHead className="font-semibold text-slate-700">Días</TableHead>
                    <TableHead className="font-semibold text-slate-700">Documentos</TableHead>
                    <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturasPaginadas.map((factura) => {
                    const docs = docsMap[factura.id] ?? [];
                    const dias = factura.dias_transcurridos ?? 0;
                    const nivel = getSlaLevel(dias);
                    const docsOk = validarDocumentosCompletos(docs);
                    const faltantes = obtenerDocumentosFaltantes(docs);

                    return (
                      <TableRow key={factura.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${dotColor(nivel)}`} />
                            {nivel === 'vencido' && <AlertCircle className="w-4 h-4 text-purple-700" />}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{factura.numero_factura}</TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-800">{displayText(factura.proveedor?.razon_social)}</p>
                          <p className="text-xs text-slate-500 font-mono">{displayText(factura.proveedor?.nit)}</p>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          ${Number(factura.valor_total).toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell className="text-slate-600">{displayText(factura.departamento?.nombre)}</TableCell>
                        <TableCell className="text-slate-600">{displayDate(factura.fecha_recepcion)}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${diasColor(nivel)}`}>{dias}d</span>
                        </TableCell>
                        <TableCell>
                          {docsOk ? (
                            <Badge className="bg-green-100 text-green-700 border border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Completos ({docs.length})
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge className="bg-red-100 text-red-700 border border-red-200">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Incompletos ({docs.length}/3)
                              </Badge>
                              {faltantes.length > 0 && (
                                <p className="text-xs text-red-600">Faltan: {faltantes.join(', ')}</p>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => abrirDetalle(factura)} className="border-slate-300 text-slate-700 p-2" title="Detalle">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void openDocumentosConsolidados(factura.id, 'contabilidad')}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 p-2"
                              title="Ver documentos"
                            >
                              <FileCheck className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void downloadDocumentosConsolidados(factura.id, factura.numero_factura, 'contabilidad')}
                              className="border-slate-300 text-slate-700 hover:bg-slate-50 p-2"
                              title="Descargar documentos"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => iniciarAccion(factura, 'devolver')} className="border-red-300 text-red-700 hover:bg-red-50 p-2" title="Devolver">
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => iniciarAccion(factura, 'radicar')}
                              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 disabled:text-slate-500 p-2"
                              title={!docsOk ? `Faltan: ${faltantes.join(', ')}` : 'Radicar'}
                              disabled={!docsOk}
                            >
                              <FileCheck className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, facturasFiltradas.length)} de {facturasFiltradas.length} resultados
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? "bg-slate-900 text-white hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50"}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
