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
} from 'lucide-react';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal from '../../../share/factura-detail-modal';
import { useContabilidadRadicarFacturas } from '../../../hooks/financiero/contabilidad';
import { displayDate, displayText } from '../../../share/field-placeholders';

export default function RadicarFacturas() {
  const {
    facturas,
    docsMap,
    cargando,
    error,
    facturaSeleccionada,
    accion,
    observaciones,
    procesando,
    toast,
    modalFactura,
    filtros,
    facturasFiltradas,
    setObservaciones,
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
          <Button onClick={cargarFacturas} variant="outline" className="border-white/30 text-white hover:bg-white/10" disabled={cargando}>
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
              La factura volverá al funcionario con su observación. Este campo es <strong>obligatorio</strong>.
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
            showMontoFilter={true}
            showFechaFilter={true}
            showAreaFilter={true}
          />
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Facturas Pendientes de Radicación</h2>
              <p className="text-sm text-slate-500">{facturasFiltradas.length} factura(s) en estado <em>Recibida / Registrada</em></p>
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
                  {facturasFiltradas.map((factura) => {
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
                          <div className="flex items-center gap-1 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => abrirDetalle(factura)} className="border-slate-300 text-slate-700">
                              <Eye className="w-3 h-3 mr-1" /> Detalle
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => iniciarAccion(factura, 'devolver')} className="border-red-300 text-red-700 hover:bg-red-50">
                              <XCircle className="w-3 h-3 mr-1" /> Devolver
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => iniciarAccion(factura, 'radicar')}
                              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 disabled:text-slate-500"
                              title={!docsOk ? `Faltan: ${faltantes.join(', ')}` : ''}
                              disabled={!docsOk}
                            >
                              <FileCheck className="w-3 h-3 mr-1" />
                              Radicar
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
        </CardContent>
      </Card>
    </div>
  );
}
