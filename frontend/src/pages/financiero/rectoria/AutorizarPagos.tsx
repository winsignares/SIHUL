import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Badge } from '../../../share/badge';
import { Textarea } from '../../../share/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { CheckSquare, CheckCircle2, XCircle, Calendar, Eye, Building, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal from '../../../share/factura-detail-modal';
import { useAutorizarPagos } from '../../../hooks/financiero/rectoria';

export default function AutorizarPagos() {
  const {
    filtros,
    facturasFiltradas,
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

  return (
    <>
      <div className="space-y-6">
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

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <CheckSquare className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Autorizar Pagos (RF09)</h1>
              <p className="text-red-100 text-sm">Autorizacion final institucional de pagos cargados por Direccion Financiera</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800">Filtros de Busqueda</CardTitle>
              <CardDescription>Filtre por factura, proveedor, area, fechas o monto</CardDescription>
            </CardHeader>
            <CardContent>
              <TableFilters
                filters={filtros}
                onFilterChange={setFiltros}
                estados={['Enviada Rectoría']}
                proveedores={Array.from(new Set(facturasFiltradas.map((f) => f.proveedor)))}
                areas={Array.from(new Set(facturasFiltradas.map((f) => f.areaSolicitante || ''))).filter(Boolean)}
                showMontoFilter
                showFechaFilter
                showAreaFilter
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Pagos Enviados a Rectoría</CardTitle>
                  <CardDescription>{facturasFiltradas.length} pago(s) pendiente(s) de decision</CardDescription>
                </div>
                <Button onClick={cargarFacturas} variant="outline" disabled={cargando}>
                  <Loader2 className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">N Factura</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">Area</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proceso</TableHead>
                      <TableHead className="font-semibold text-slate-700">F. Cargue</TableHead>
                      <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargando ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-slate-500 py-6">Cargando pagos enviados a Rectoría...</TableCell>
                      </TableRow>
                    ) : (
                      facturasFiltradas.map((factura, index) => (
                      <motion.tr
                        key={factura.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">{factura.proveedor}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-blue-700 text-base">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {factura.areaSolicitante}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 border font-mono text-xs">{factura.numeroProcesoPago}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {factura.fechaEnvioRectoria}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              (factura.diasTranscurridos || 0) >= 3
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : (factura.diasTranscurridos || 0) >= 2
                                  ? 'bg-orange-100 text-orange-700 border-orange-300'
                                  : 'bg-green-100 text-green-700 border-green-300'
                            } border text-xs`}
                          >
                            {factura.diasTranscurridos}d
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleVerDetalle(factura)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button size="sm" onClick={() => abrirDialog(factura, 'aprobar')} className="bg-green-600 hover:bg-green-700 text-white">
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Autorizar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => abrirDialog(factura, 'rechazar')} className="bg-red-600 hover:bg-red-700">
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>

                {facturasFiltradas.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No se encontraron pagos con los filtros aplicados</p>
                    <p className="text-sm mt-1">Intente ajustar los criterios de busqueda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={mostrarDialogAccion} onOpenChange={setMostrarDialogAccion}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {accion === 'aprobar' ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span>Autorizar Pago - Rectoria (RF09)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span>Rechazar Pago - Rectoria (RF09)</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {accion === 'aprobar'
                ? 'Confirme la autorizacion final para continuar con la aplicacion del pago.'
                : 'Registre el motivo del rechazo para devolver el tramite a Direccion Financiera.'}
            </DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</p>
                <p className="text-sm text-slate-600">{facturaSeleccionada.proveedor}</p>
                <p className="text-lg font-bold text-slate-800 mt-2">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">{accion === 'aprobar' ? 'Observaciones de Rectoria (opcional)' : 'Motivo del rechazo *'}</p>
                <Textarea
                  placeholder={
                    accion === 'aprobar'
                      ? 'Agregue observaciones adicionales si lo considera necesario...'
                      : 'Explique detalladamente el motivo del rechazo...'
                  }
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={4}
                  className={accion === 'aprobar' ? 'border-slate-300' : 'border-red-300 focus:border-red-600'}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t">
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
              disabled={isProcessing || (accion === 'rechazar' && !motivo.trim())}
              className={accion === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
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
