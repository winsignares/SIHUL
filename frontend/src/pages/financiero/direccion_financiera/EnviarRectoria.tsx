import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Button } from '../../../share/button';
import { Badge } from '../../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Loader2, Send, Filter, Calendar, CheckCircle2, Eye, Building, AlertCircle, ClipboardCheck, Landmark } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Textarea } from '../../../share/textarea';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal from '../../../share/factura-detail-modal';
import { SlaIndicator } from '../../../share/sla-indicator';
import { useEnviarRectoria } from '../../../hooks/financiero/direccion_financiera';

export default function EnviarRectoria() {
  const {
    facturasFiltradas,
    cargando,
    error,
    procesando,
    facturaSeleccionada,
    detalleAbierto,
    envioAbierto,
    observaciones,
    filtros,
    toast,
    setFiltros,
    setObservaciones,
    setDetalleAbierto,
    setEnvioAbierto,
    abrirDetalle,
    abrirEnvio,
    cerrarEnvio,
    enviarARectoria,
    cargarFacturas,
  } = useEnviarRectoria();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Send className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-2xl font-bold">Enviar a Rectoria</h1>
            <p className="text-red-100 text-sm">Remitir pagos cargados para autorizacion final</p>
          </div>
        </div>
      </motion.div>

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

      {/* Filtros */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Filter className="w-5 h-5 text-red-600" />
            Filtros de Busqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableFilters
            filters={filtros}
            onFilterChange={setFiltros}
            estados={[]}
            proveedores={Array.from(new Set(facturasFiltradas.map((f) => f.proveedor)))}
            areas={Array.from(new Set(facturasFiltradas.map((f) => f.areaSolicitante || '').filter(Boolean)))}
            showMontoFilter
            showFechaFilter
            showAreaFilter
          />
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pagos Revisados - Listos para Enviar</CardTitle>
              <CardDescription>{facturasFiltradas.length} pago(s) cargado(s) listo(s) para enviar a Rectoria</CardDescription>
            </div>
            <Button onClick={cargarFacturas} variant="outline" disabled={cargando}>
              <Loader2 className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
              <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay pagos listos para enviar a Rectoria</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>N Factura</TableHead>
                  <TableHead>N Radicado</TableHead>
                  <TableHead>N Proceso</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>NIT</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>F. Revision</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturasFiltradas.map((factura, index) => (
                  <motion.tr key={factura.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                    <TableCell className="font-medium">{factura.numeroFactura}</TableCell>
                    <TableCell className="font-mono text-blue-700 text-xs">{factura.numeroRadicado}</TableCell>
                    <TableCell className="font-mono text-purple-700 text-xs">{factura.numeroProcesoPago}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" />
                        {factura.proveedor}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{factura.nit}</TableCell>
                    <TableCell className="font-bold text-green-700">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                    <TableCell><Badge variant="outline">{factura.areaSolicitante}</Badge></TableCell>
                    <TableCell><Calendar className="w-3 h-3 inline mr-1" />{factura.fechaRevision}</TableCell>
                    <TableCell>
                      <Badge className={factura.diasTranscurridos && factura.diasTranscurridos >= 2 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
                        <SlaIndicator dias={factura.diasTranscurridos || 0} objetivo={factura.slaObjetivoDias ?? null} compact />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => abrirDetalle(factura)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => abrirEnvio(factura)}>
                          <Send className="w-4 h-4 mr-1" />Enviar
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Envio */}
      <Dialog open={envioAbierto} onOpenChange={setEnvioAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Send className="w-5 h-5 text-blue-600" />
              Remision Formal a Rectoria
            </DialogTitle>
            <DialogDescription>
              {facturaSeleccionada ? `Confirme la remision de ${facturaSeleccionada.numeroFactura} para autorizacion final institucional.` : 'Seleccione una factura para remitir.'}
            </DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Factura</p>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Proveedor</p>
                  <p className="font-semibold text-slate-800 truncate">{facturaSeleccionada.proveedor}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Monto</p>
                  <p className="font-semibold text-green-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</p>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <ClipboardCheck className="w-5 h-5 text-blue-700 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Control previo a la remision</p>
                    <ul className="mt-2 text-sm text-blue-800 space-y-1">
                      <li>- Cargue financiero y soportes completos verificados</li>
                      <li>- Datos de proceso de pago y rubro confirmados</li>
                      <li>- Factura lista para decision final de Rectoria</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Observaciones para Rectoria <span className="text-red-600">*</span></label>
            <Textarea
              rows={4}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Contexto de envio, prioridad, riesgos o validaciones relevantes para la autorizacion (obligatorio, minimo 10 caracteres)..."
            />
            {observaciones.trim().length > 0 && observaciones.trim().length < 10 && (
              <p className="text-xs text-red-600">Minimo 10 caracteres ({observaciones.trim().length}/10)</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cerrarEnvio} disabled={procesando}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={enviarARectoria} disabled={procesando || observaciones.trim().length < 10}>
              {procesando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</> : <><Landmark className="w-4 h-4 mr-2" />Confirmar remision</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle */}
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
