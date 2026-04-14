import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { FileCheck, Filter, Calendar, CheckCircle2, XCircle, Eye, Building, AlertCircle, Send, FileText, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import TableFilters from '../ui/table-filters';
import FacturaDetailModal from '../ui/factura-detail-modal';

interface Factura {
  id: string;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  proveedor: string;
  nit: string;
  valorTotal: number;
  fechaEnvio: string;
  areaSolicitante: string;
  cuentaContable: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
}

export default function RevisarPagos() {
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: ''
  });

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [mostrarDialogRevisar, setMostrarDialogRevisar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [accion, setAccion] = useState<'aprobar' | 'devolver'>('aprobar');
  const [observaciones, setObservaciones] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Facturas enviadas por Tesorería
  const facturasRecibidas: Factura[] = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-025',
      numeroRadicado: 'RAD-2026-00125',
      numeroProcesoPago: 'PP-2026-0100',
      proveedor: 'Servicios Integrales SA',
      nit: '900890123-4',
      valorTotal: 18500000,
      fechaEnvio: '2026-04-02',
      areaSolicitante: 'Servicios Generales',
      cuentaContable: '5145-001',
      estado: 'Enviado a dirección financiera',
      diasTranscurridos: 0,
      descripcion: 'Servicios de aseo y cafetería mensual'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-026',
      numeroRadicado: 'RAD-2026-00126',
      numeroProcesoPago: 'PP-2026-0101',
      proveedor: 'Papelería Universitaria',
      nit: '900901234-5',
      valorTotal: 3200000,
      fechaEnvio: '2026-04-01',
      areaSolicitante: 'Suministros',
      cuentaContable: '5150-002',
      estado: 'Enviado a dirección financiera',
      diasTranscurridos: 1,
      descripcion: 'Material de oficina y papelería'
    }
  ];

  const columnasParaFiltrar = [
    { key: 'numeroFactura', label: 'Nº Factura' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'areaSolicitante', label: 'Área' }
  ];

  const facturasFiltradas = facturasRecibidas.filter(factura => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.areaSolicitante && !factura.areaSolicitante.toLowerCase().includes(filtros.areaSolicitante.toLowerCase())) return false;
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
    if (filtros.fechaInicio && factura.fechaEnvio < filtros.fechaInicio) return false;
    if (filtros.fechaFin && factura.fechaEnvio > filtros.fechaFin) return false;
    return true;
  });

  const abrirDialogRevisar = (factura: Factura, accionSeleccionada: 'aprobar' | 'devolver') => {
    setFacturaSeleccionada(factura);
    setAccion(accionSeleccionada);
    setObservaciones('');
    setMostrarDialogRevisar(true);
  };

  const handleVerDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMostrarDialogDetalle(true);
  };

  const procesarRevision = () => {
    if (!facturaSeleccionada) return;

    if (accion === 'devolver' && !observaciones.trim()) {
      toast.error('Observaciones requeridas', {
        description: 'Debe indicar el motivo de la devolución a Tesorería'
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      if (accion === 'aprobar') {
        toast.success('¡Pago revisado y aprobado!', {
          description: `${facturaSeleccionada.numeroFactura} - Listo para enviar a Rectoría`
        });
      } else {
        toast.warning('Pago devuelto a Tesorería', {
          description: `${facturaSeleccionada.numeroFactura} - Devuelto para corrección`
        });
      }

      setIsProcessing(false);
      setMostrarDialogRevisar(false);
      setFacturaSeleccionada(null);
      setObservaciones('');
    }, 1500);
  };

  return (
    <>
      <div className="p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FileCheck className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1">Revisar Pagos</h1>
              <p className="text-red-100 text-sm">Revisión y validación de pagos enviados por Tesorería - SLA: 2 días</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Filter className="w-5 h-5 text-red-600" />
                Filtros de Búsqueda Independientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TableFilters
                filters={filtros}
                onFilterChange={setFiltros}
                estados={['Enviado a dirección financiera']}
                proveedores={Array.from(new Set(facturasRecibidas.map(f => f.proveedor)))}
                areas={Array.from(new Set(facturasRecibidas.map(f => f.areaSolicitante)))}
                showMontoFilter={true}
                showFechaFilter={true}
                showAreaFilter={true}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800">Pagos Recibidos de Tesorería</CardTitle>
              <CardDescription>{facturasFiltradas.length} pago(s) pendiente(s) de revisión</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Nº Factura</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>F. Envío</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturasFiltradas.map((factura, index) => (
                    <motion.tr key={factura.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <TableCell className="font-medium">{factura.numeroFactura}</TableCell>
                      <TableCell><Building className="w-4 h-4 inline mr-2" />{factura.proveedor}</TableCell>
                      <TableCell className="font-bold text-green-700">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                      <TableCell><Badge variant="outline">{factura.areaSolicitante}</Badge></TableCell>
                      <TableCell><Calendar className="w-3 h-3 inline mr-1" />{factura.fechaEnvio}</TableCell>
                      <TableCell><Badge className={factura.diasTranscurridos >= 2 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>{factura.diasTranscurridos}d</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleVerDetalle(factura)}><Eye className="w-4 h-4" /></Button>
                          <Button size="sm" onClick={() => abrirDialogRevisar(factura, 'aprobar')} className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-4 h-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => abrirDialogRevisar(factura, 'devolver')}><XCircle className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={mostrarDialogRevisar} onOpenChange={setMostrarDialogRevisar}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {accion === 'aprobar' ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span>Aprobar Pago - Dirección Financiera</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span>Devolver Pago - Dirección Financiera</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {accion === 'aprobar' 
                ? 'Revise cuidadosamente la información antes de aprobar el pago. Al aprobar, el trámite será enviado a Rectoría para autorización final.'
                : 'Indique el motivo por el cual devuelve este pago. El trámite regresará a Tesorería.'}
            </DialogDescription>
          </DialogHeader>
          {facturaSeleccionada && (
            <div className="space-y-6">
              {/* INFORMACIÓN PRINCIPAL */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border-2 border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-300 pb-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Información de la Factura
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Número de Factura</Label>
                    <p className="font-bold text-slate-800 text-lg">{facturaSeleccionada.numeroFactura}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Número de Radicado</Label>
                    <p className="font-mono font-semibold text-blue-700">{facturaSeleccionada.numeroRadicado}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">N° Proceso de Pago</Label>
                    <p className="font-mono font-semibold text-purple-700">{facturaSeleccionada.numeroProcesoPago}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Proveedor</Label>
                    <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                    <p className="text-sm text-slate-600">NIT: {facturaSeleccionada.nit}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Área Solicitante</Label>
                    <Badge variant="outline" className="text-sm font-medium">
                      {facturaSeleccionada.areaSolicitante}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Cuenta Contable</Label>
                    <p className="font-mono text-slate-700">{facturaSeleccionada.cuentaContable}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">Fecha de Envío</Label>
                    <p className="text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {facturaSeleccionada.fechaEnvio}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <Label className="text-xs text-slate-500 mb-1">Descripción del Servicio/Producto</Label>
                  <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">
                    {facturaSeleccionada.descripcion}
                  </p>
                </div>
              </div>

              {/* INFORMACIÓN FINANCIERA */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                <h3 className="font-bold text-green-800 text-lg flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5" />
                  Información Financiera
                </h3>
                <div className="bg-white p-4 rounded-lg border-2 border-green-300">
                  <Label className="text-xs text-green-600 mb-1">Monto Total a Pagar</Label>
                  <p className="font-bold text-green-700 text-3xl">
                    ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              {/* ESTADO Y TIEMPO */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <Label className="text-xs text-blue-600 mb-2">Estado Actual</Label>
                  <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                    {facturaSeleccionada.estado}
                  </Badge>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <Label className="text-xs text-orange-600 mb-2">Días en Proceso</Label>
                  <p className="font-bold text-orange-700 text-2xl">
                    {facturaSeleccionada.diasTranscurridos} días
                  </p>
                </div>
              </div>

              {/* CAMPO DE OBSERVACIONES */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <Label className="text-sm font-semibold text-slate-700">
                  Observaciones de Dirección Financiera {accion === 'devolver' && <span className="text-red-600">*</span>}
                </Label>
                <Textarea 
                  value={observaciones} 
                  onChange={(e) => setObservaciones(e.target.value)} 
                  rows={4}
                  placeholder={accion === 'aprobar' 
                    ? 'Agregue observaciones relevantes sobre la aprobación (opcional)...'
                    : 'Indique detalladamente el motivo de la devolución (requerido)...'
                  }
                  className={`resize-none ${accion === 'devolver' ? 'border-red-300 focus:border-red-600' : 'border-slate-300'}`}
                />
              </div>

              {/* INFORMACIÓN DEL SIGUIENTE PASO */}
              <div className={`${accion === 'aprobar' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'} border-2 rounded-lg p-4`}>
                <div className="flex items-start gap-3">
                  {accion === 'aprobar' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className={accion === 'aprobar' ? 'text-green-800' : 'text-red-800'}>
                    <p className="font-semibold mb-1">
                      {accion === 'aprobar' ? '¿Qué sucede al aprobar?' : '¿Qué sucede al devolver?'}
                    </p>
                    <p className="text-sm">
                      {accion === 'aprobar' 
                        ? 'El pago será enviado a Rectoría para autorización final. Una vez autorizado, volverá a Dirección Financiera para aplicar el pago en el portal bancario.'
                        : 'El pago será devuelto a Tesorería para correcciones. Deberán revisar y volver a enviar el trámite.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setMostrarDialogRevisar(false);
                setObservaciones('');
              }}
              disabled={isProcessing}
              className="border-slate-300"
            >
              Cancelar
            </Button>
            <Button 
              onClick={procesarRevision} 
              disabled={isProcessing || (accion === 'devolver' && !observaciones.trim())}
              className={accion === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isProcessing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Procesando...
                </>
              ) : (
                <>
                  {accion === 'aprobar' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprobar y Enviar a Rectoría
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Devolver a Tesorería
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FacturaDetailModal factura={facturaSeleccionada} isOpen={mostrarDialogDetalle} onClose={() => setMostrarDialogDetalle(false)} />
    </>
  );
}