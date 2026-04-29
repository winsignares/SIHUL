import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Button } from '../../../share/button';
import { AlertCircle, Eye, Clock, Calculator, FileText, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import FacturaDetailModal from '../../../share/factura-detail-modal';
import { useContabilidadMisPendientes } from '../../../hooks/financiero/contabilidad';

export default function MisPendientes() {
  const {
    facturas,
    cargando,
    error,
    facturaSeleccionada,
    mostrarDetalle,
    cargarDatos,
    openDetalle,
    closeDetalle,
    nivelRiesgo,
    accionRequerida,
    SLA_DIAS,
    vencidasCount,
    proximasVencerCount,
    enTiempoCount,
  } = useContabilidadMisPendientes();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Calculator className="w-7 h-7 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-white mb-1 text-3xl font-bold">Mis Pendientes</h1>
                <p className="text-red-100 text-sm">
                  Facturas asignadas a contabilidad (Recibidas + Radicadas) — SLA: {SLA_DIAS} días
                </p>
              </div>
            </div>
            <Button onClick={cargarDatos} variant="outline" className="border-white/30 text-white hover:bg-white/10" disabled={cargando}>
              <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Por Procesar</p>
                <p className="text-4xl font-bold text-slate-800 mt-1">{facturas.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg border-purple-200 bg-purple-50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm font-semibold">VENCIDAS</p>
                <p className="text-4xl font-bold text-purple-800 mt-1">{vencidasCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-purple-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg border-orange-200 bg-orange-50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-orange-700 text-sm font-semibold">Próximas a Vencer</p>
                <p className="text-4xl font-bold text-orange-800 mt-1">{proximasVencerCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg border-green-200 bg-green-50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-semibold">En Tiempo</p>
                <p className="text-4xl font-bold text-green-800 mt-1">{enTiempoCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-700" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800">Facturas Pendientes de Procesamiento</CardTitle>
              <CardDescription>
                Recibidas (pendientes de radicar) y Radicadas (pendientes de causar)
              </CardDescription>
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
              ) : facturas.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No hay facturas pendientes</p>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                        <TableHead className="font-semibold text-slate-700">N° Factura</TableHead>
                        <TableHead className="font-semibold text-slate-700">N° Radicado</TableHead>
                        <TableHead className="font-semibold text-slate-700">Proveedor / NIT</TableHead>
                        <TableHead className="font-semibold text-slate-700">Área</TableHead>
                        <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                        <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                        <TableHead className="font-semibold text-slate-700">Días</TableHead>
                        <TableHead className="font-semibold text-slate-700">Acción</TableHead>
                        <TableHead className="font-semibold text-slate-700">Ver</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturas.map((factura) => {
                        const nivel = nivelRiesgo(factura.dias_transcurridos);
                        const colorDot =
                          nivel === 'vencido' ? 'bg-purple-700' :
                          nivel === 'naranja' ? 'bg-orange-500' :
                          nivel === 'amarillo' ? 'bg-yellow-500' : 'bg-green-500';
                        const colorDias =
                          nivel === 'vencido' ? 'text-purple-700 font-bold' :
                          nivel === 'naranja' ? 'text-orange-600 font-semibold' :
                          nivel === 'amarillo' ? 'text-yellow-600 font-semibold' : 'text-green-700';
                        return (
                          <TableRow key={factura.id} className="hover:bg-slate-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${colorDot}`} />
                                {nivel === 'vencido' && <AlertCircle className="w-4 h-4 text-purple-700" />}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-slate-800">{factura.numero_factura}</TableCell>
                            <TableCell>
                              {factura.numero_radicado ? (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 border font-mono text-xs">
                                  {factura.numero_radicado}
                                </Badge>
                              ) : <span className="text-slate-400 text-xs">—</span>}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-slate-800">{factura.proveedor?.razon_social}</p>
                              <p className="text-xs text-slate-500 font-mono">{factura.proveedor?.nit}</p>
                            </TableCell>
                            <TableCell className="text-slate-600">{factura.departamento?.nombre}</TableCell>
                            <TableCell className="font-semibold text-slate-800">
                              ${Number(factura.valor_total).toLocaleString('es-CO')}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                factura.estado === 'Recibida'
                                  ? 'bg-blue-100 text-blue-700 border-blue-200 border'
                                  : 'bg-purple-100 text-purple-700 border-purple-200 border'
                              }>
                                {factura.estado}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={colorDias}>{factura.dias_transcurridos}d / {SLA_DIAS}d</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${nivel === 'vencido' ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-slate-100 text-slate-700 border-slate-300'} border`}>
                                {accionRequerida(factura)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDetalle(factura)}
                                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                              >
                                <Eye className="w-4 h-4 mr-1" /> Ver
                              </Button>
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
        </motion.div>
      </div>

      <FacturaDetailModal
        factura={facturaSeleccionada}
        isOpen={mostrarDetalle}
        onClose={closeDetalle}
      />
    </>
  );
}
