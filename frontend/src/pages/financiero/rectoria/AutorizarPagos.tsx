import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Badge } from '../../../share/badge';
import { Textarea } from '../../../share/textarea';
import { Label } from '../../../share/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { CheckSquare, CheckCircle2, XCircle, Calendar, Eye, Building, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import { toast } from 'sonner';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';

interface Factura extends SharedFacturaDetail {
  id: string;
  numeroProcesoPago: string;
  fechaCargue: string;
  cuentaContable: string;
  centroCosto: string;
}

export default function AutorizarPagos() {
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    estado: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: '',
  });

  const [facturasCargadas] = useState<Factura[]>([
    {
      id: '1',
      numeroFactura: 'FAC-2026-018',
      numeroRadicado: 'RAD-2026-00115',
      numeroProcesoPago: 'PP-2026-0092',
      proveedor: 'Construcciones Universitarias SAS',
      nit: '900123456-7',
      valorTotal: 45000000,
      fechaCargue: '2026-04-01',
      areaSolicitante: 'Infraestructura',
      cuentaContable: '5180-001',
      centroCosto: 'CC-010',
      estado: 'Cargada para autorizacion',
      diasTranscurridos: 1,
      descripcion: 'Obra construccion bloque D - pago parcial',
      observaciones: 'Cargue formal completado. Todo en orden.',
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-020',
      numeroRadicado: 'RAD-2026-00118',
      numeroProcesoPago: 'PP-2026-0095',
      proveedor: 'Equipos Medicos Especializados',
      nit: '900234567-8',
      valorTotal: 28500000,
      fechaCargue: '2026-04-02',
      areaSolicitante: 'Ciencias de la Salud',
      cuentaContable: '5160-002',
      centroCosto: 'CC-012',
      estado: 'Cargada para autorizacion',
      diasTranscurridos: 0,
      descripcion: 'Equipamiento laboratorio de fisiologia',
      observaciones: 'Cargado sin observaciones.',
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-022',
      numeroRadicado: 'RAD-2026-00120',
      numeroProcesoPago: 'PP-2026-0097',
      proveedor: 'Tecnologia Educativa Global',
      nit: '900345678-9',
      valorTotal: 15200000,
      fechaCargue: '2026-04-01',
      areaSolicitante: 'Sistemas',
      cuentaContable: '5165-001',
      centroCosto: 'CC-007',
      estado: 'Cargada para autorizacion',
      diasTranscurridos: 1,
      descripcion: 'Licencias software educativo anual',
      observaciones: 'Proceso completado correctamente.',
    },
  ]);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogAccion, setMostrarDialogAccion] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [accion, setAccion] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [motivo, setMotivo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const facturasFiltradas = useMemo(
    () =>
      facturasCargadas.filter((factura) => {
        if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
        if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
        if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
        if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
        if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
        if (filtros.fechaInicio && factura.fechaCargue < filtros.fechaInicio) return false;
        if (filtros.fechaFin && factura.fechaCargue > filtros.fechaFin) return false;
        return true;
      }),
    [facturasCargadas, filtros]
  );

  const abrirDialog = (factura: Factura, accionSeleccionada: 'aprobar' | 'rechazar') => {
    setFacturaSeleccionada(factura);
    setAccion(accionSeleccionada);
    setMotivo('');
    setMostrarDialogAccion(true);
  };

  const handleVerDetalle = (factura: Factura) => {
    setFacturaDetalle(factura);
    setMostrarDialogDetalle(true);
  };

  const procesarAutorizacion = () => {
    if (!facturaSeleccionada) return;

    if (accion === 'rechazar' && !motivo.trim()) {
      toast.error('Motivo requerido', {
        description: 'Debe registrar el motivo del rechazo para devolver a Direccion Financiera',
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      if (accion === 'aprobar') {
        toast.success('Pago autorizado por Rectoria', {
          description: `${facturaSeleccionada.numeroFactura} enviado para aplicacion en portal bancario.`,
        });
      } else {
        toast.warning('Pago rechazado por Rectoria', {
          description: `${facturaSeleccionada.numeroFactura} devuelto a Direccion Financiera.`,
        });
      }

      setIsProcessing(false);
      setMostrarDialogAccion(false);
      setFacturaSeleccionada(null);
      setMotivo('');
    }, 1200);
  };

  return (
    <>
      <div className="space-y-6">
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
                estados={['Cargada para autorizacion']}
                proveedores={Array.from(new Set(facturasCargadas.map((f) => f.proveedor)))}
                areas={Array.from(new Set(facturasCargadas.map((f) => f.areaSolicitante || ''))).filter(Boolean)}
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
                  <CardTitle className="text-slate-800">Pagos Cargados para Autorizacion</CardTitle>
                  <CardDescription>{facturasFiltradas.length} pago(s) pendiente(s) de decision</CardDescription>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 border text-lg px-4 py-2">
                  {facturasFiltradas.length} Por Autorizar
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
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
                    {facturasFiltradas.map((factura, index) => (
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
                            {factura.fechaCargue}
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
                    ))}
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
                <Label className="text-sm font-semibold text-slate-700">
                  {accion === 'aprobar' ? 'Observaciones de Rectoria (opcional)' : 'Motivo del rechazo *'}
                </Label>
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
                setFacturaSeleccionada(null);
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
          setFacturaDetalle(null);
        }}
      />
    </>
  );
}
