import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Badge } from '../../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Loader2, CheckCircle, Filter, Calendar, CheckCircle2, Eye, Building, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Textarea } from '../../../share/textarea';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal from '../../../share/factura-detail-modal';
import { useConfirmacionPagos } from '../../../hooks/financiero/direccion_financiera';

export default function ConfirmacionPagos() {
  const {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-2xl font-bold">Confirmacion de Pagos</h1>
            <p className="text-red-100 text-sm">Control de procesos de pago autorizados por Rectoria</p>
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
              <CardTitle>Pagos Autorizados por Rectoria</CardTitle>
              <CardDescription>{facturasFiltradas.length} pago(s) pendiente(s) de confirmacion</CardDescription>
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
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay pagos pendientes de confirmacion</p>
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
                  <TableHead>F. Autorizacion</TableHead>
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
                    <TableCell><Calendar className="w-3 h-3 inline mr-1" />{factura.fechaAutorizacion}</TableCell>
                    <TableCell>
                      <Badge className={factura.diasTranscurridos && factura.diasTranscurridos >= 2 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                        {factura.diasTranscurridos || 0}d
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => abrirDetalle(factura)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => abrirConfirmar(factura)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />Confirmar
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

      {/* Dialog Confirmar */}
      <Dialog open={confirmarAbierto} onOpenChange={setConfirmarAbierto}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Confirmar Control de Pago</DialogTitle>
            <DialogDescription>
              {facturaSeleccionada ? `Confirmar proceso de pago para ${facturaSeleccionada.numeroFactura}.` : 'Selecciona una factura.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Numero de Confirmacion (automatico)</label>
              <Input
                value={numeroConfirmacion}
                readOnly
                placeholder="Se genera automaticamente al confirmar"
              />
              <p className="text-xs text-slate-500">El sistema genera este consecutivo y lo guarda en base de datos para trazabilidad.</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Observaciones</label>
              <Textarea
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalles adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cerrarConfirmar} disabled={procesando}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={confirmarPago} disabled={procesando}>
              {procesando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</> : 'Confirmar control'}
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
