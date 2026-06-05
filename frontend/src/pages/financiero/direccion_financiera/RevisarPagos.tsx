import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Button } from '../../../share/button';
import { Badge } from '../../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Loader2, FileCheck, Filter, Calendar, CheckCircle2, RotateCcw, Eye, Building, AlertCircle, Upload, ClipboardList, ShieldAlert, Landmark } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Textarea } from '../../../share/textarea';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal from '../../../share/factura-detail-modal';
import { useRevisarPagos } from '../../../hooks/financiero/direccion_financiera';

export default function RevisarPagos() {
  const {
    facturasFiltradas,
    cargando,
    error,
    procesando,
    facturaSeleccionada,
    detalleAbierto,
    decisionAbierta,
    decisionTipo,
    observaciones,
    filtros,
    toast,
    setFiltros,
    setObservaciones,
    setDetalleAbierto,
    setDecisionAbierta,
    abrirDetalle,
    abrirDecision,
    cerrarDecision,
    aprobarFactura,
    devolverFactura,
    cargarFacturas,
  } = useRevisarPagos();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <FileCheck className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-2xl font-bold">Cargue de Pagos</h1>
            <p className="text-red-100">Actualizar proceso de pago y cargue formal previo a autorizacion</p>
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
              <CardTitle className="text-slate-800">Pagos Recibidos de Tesoreria - Pendientes de Cargue Formal</CardTitle>
              <CardDescription>{facturasFiltradas.length} pago(s) pendiente(s) de cargue</CardDescription>
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
              <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay pagos pendientes de cargue</p>
              <p className="text-sm mt-1">Los pagos remitidos por Tesoreria apareceran aqui</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>N Factura</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>F. Envio</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturasFiltradas.map((factura, index) => (
                  <motion.tr key={factura.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                    <TableCell className="font-medium">{factura.numeroFactura}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" />
                        {factura.proveedor}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-green-700">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                    <TableCell><Badge variant="outline">{factura.areaSolicitante}</Badge></TableCell>
                    <TableCell><Calendar className="w-3 h-3 inline mr-1" />{factura.fechaEnvio}</TableCell>
                    <TableCell>
                      <Badge className={factura.diasTranscurridos && factura.diasTranscurridos >= 2 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                        {factura.diasTranscurridos || 0}d
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => abrirDetalle(factura)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => abrirDecision(factura, 'aprobar')}>
                          <Upload className="w-4 h-4 mr-1" />Cargar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => abrirDecision(factura, 'devolver')}>
                          <RotateCcw className="w-4 h-4" />
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

      {/* Dialog Decision */}
      <Dialog open={decisionAbierta} onOpenChange={setDecisionAbierta}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {decisionTipo === 'aprobar' ? (
                <>
                  <Upload className="w-5 h-5 text-green-600" />
                  Confirmacion de Cargue Financiero
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5 text-red-600" />
                  Devolucion para Ajustes
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {decisionTipo === 'aprobar'
                ? 'Valide la informacion operativa antes de dejar la factura en estado Cargada para autorizacion de Rectoria.'
                : 'Registre una justificacion formal para retornar la factura al flujo de ajustes.'}
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
                  <p className="text-xs text-slate-500">Valor total</p>
                  <p className="font-semibold text-green-700">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</p>
                </div>
              </div>

              {decisionTipo === 'aprobar' ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <ClipboardList className="w-5 h-5 text-emerald-700 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-900">Checklist de control previo al cargue</p>
                      <ul className="mt-2 text-sm text-emerald-800 space-y-1">
                        <li>- Soportes documentales validados y trazables</li>
                        <li>- Proceso de pago y area solicitante confirmados</li>
                        <li>- Lista para remision a Rectoria</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-700 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Control de devolucion</p>
                      <p className="mt-1 text-sm text-red-800">
                        Esta accion retornara la factura al flujo de ajustes. El motivo quedara registrado en historial para trazabilidad.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {decisionTipo === 'devolver' ? '* Motivo de devolucion (Requerido)' : 'Observaciones de cargue (opcional)'}
            </label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder={decisionTipo === 'devolver' ? 'Especifique claramente el motivo de la devolucion y accion requerida...' : 'Registre contexto operativo, validaciones realizadas o notas para Rectoria...'}
              className={decisionTipo === 'devolver' ? 'border-red-300' : ''}
              rows={4}
            />
            {decisionTipo === 'devolver' && (
              <p className="text-xs text-slate-500">Minimo 10 caracteres.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cerrarDecision} disabled={procesando}>Cancelar</Button>
            <Button
              variant={decisionTipo === 'aprobar' ? 'default' : 'destructive'}
              className={decisionTipo === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={decisionTipo === 'aprobar' ? aprobarFactura : devolverFactura}
              disabled={procesando}
            >
              {procesando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</> : (decisionTipo === 'aprobar' ? <><Landmark className="w-4 h-4 mr-2" />Confirmar cargue financiero</> : <><RotateCcw className="w-4 h-4 mr-2" />Confirmar devolucion</>)}
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
