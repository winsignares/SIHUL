import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Send, Filter, Calendar, Eye, Building, AlertCircle, FileText, DollarSign, CheckCircle2 } from 'lucide-react';
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
  fechaRevision: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
}

export default function EnviarRectoria() {
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
  const [mostrarDialogEnviar, setMostrarDialogEnviar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const facturasRevisadas: Factura[] = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-025',
      numeroRadicado: 'RAD-2026-00125',
      numeroProcesoPago: 'PP-2026-0100',
      proveedor: 'Servicios Integrales SA',
      nit: '900890123-4',
      valorTotal: 18500000,
      fechaRevision: '2026-04-02',
      areaSolicitante: 'Servicios Generales',
      estado: 'Revisado por dirección financiera',
      diasTranscurridos: 0,
      descripcion: 'Servicios de aseo y cafetería mensual'
    }
  ];

  const columnasParaFiltrar = [
    { key: 'numeroFactura', label: 'Nº Factura' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'areaSolicitante', label: 'Área' }
  ];

  const facturasFiltradas = facturasRevisadas.filter(factura => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.areaSolicitante && !factura.areaSolicitante.toLowerCase().includes(filtros.areaSolicitante.toLowerCase())) return false;
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
    return true;
  });

  const abrirDialogEnviar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setObservaciones('');
    setMostrarDialogEnviar(true);
  };

  const enviarRectoria = () => {
    if (!facturaSeleccionada) return;
    setIsProcessing(true);

    setTimeout(() => {
      toast.success('¡Enviado a Rectoría!', {
        description: `${facturaSeleccionada.numeroFactura} - Enviado para autorización final`
      });
      setIsProcessing(false);
      setMostrarDialogEnviar(false);
      setFacturaSeleccionada(null);
      setObservaciones('');
    }, 1500);
  };

  const handleVerDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMostrarDialogDetalle(true);
  };

  return (
    <>
      <div className="p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Send className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1">Enviar a Rectoría</h1>
              <p className="text-red-100 text-sm">Remitir pagos revisados a Rectoría para autorización final</p>
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
                estados={['Revisado por dirección financiera']}
                proveedores={Array.from(new Set(facturasRevisadas.map(f => f.proveedor)))}
                areas={Array.from(new Set(facturasRevisadas.map(f => f.areaSolicitante)))}
                showMontoFilter={true}
                showFechaFilter={false}
                showAreaFilter={true}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Pagos Revisados - Listos para Enviar</CardTitle>
              <CardDescription>{facturasFiltradas.length} pago(s) listo(s) para enviar a Rectoría</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Nº Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">N° Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">N° Proceso</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Área</TableHead>
                    <TableHead className="font-semibold text-slate-700">F. Revisión</TableHead>
                    <TableHead className="font-semibold text-slate-700">Días</TableHead>
                    <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturasFiltradas.map((factura, index) => (
                    <motion.tr key={factura.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}>
                      <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                      <TableCell className="font-mono text-blue-700 text-sm">{factura.numeroRadicado}</TableCell>
                      <TableCell className="font-mono text-purple-700 text-sm">{factura.numeroProcesoPago}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">{factura.proveedor}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">{factura.nit}</TableCell>
                      <TableCell className="font-bold text-green-700 text-base">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{factura.areaSolicitante}</Badge></TableCell>
                      <TableCell className="text-slate-600">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {factura.fechaRevision}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={factura.diasTranscurridos >= 2 ? 'bg-orange-100 text-orange-700 border-orange-300 border' : 'bg-green-100 text-green-700 border-green-300 border'}>
                          {factura.diasTranscurridos}d
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleVerDetalle(factura)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" onClick={() => abrirDialogEnviar(factura)} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Send className="w-4 h-4 mr-1" />
                            Enviar
                          </Button>
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

      <Dialog open={mostrarDialogEnviar} onOpenChange={setMostrarDialogEnviar}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Send className="w-6 h-6 text-blue-600" />
              Enviar Pago a Rectoría para Autorización Final
            </DialogTitle>
            <DialogDescription>
              Revise la información antes de enviar el pago a Rectoría. Una vez enviado, Rectoría deberá autorizar el pago antes de continuar con el proceso.
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
                  <Label className="text-xs text-orange-600 mb-2">Fecha de Revisión</Label>
                  <p className="font-semibold text-orange-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {facturaSeleccionada.fechaRevision}
                  </p>
                </div>
              </div>

              {/* CAMPO DE OBSERVACIONES */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <Label className="text-sm font-semibold text-slate-700">
                  Observaciones para Rectoría <span className="text-slate-500">(Opcional)</span>
                </Label>
                <Textarea 
                  value={observaciones} 
                  onChange={(e) => setObservaciones(e.target.value)} 
                  rows={4}
                  placeholder="Agregue observaciones relevantes para la autorización de Rectoría (opcional)..."
                  className="resize-none border-slate-300"
                />
              </div>

              {/* INFORMACIÓN DEL SIGUIENTE PASO */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-blue-800">
                    <p className="font-semibold mb-1">¿Qué sucede al enviar a Rectoría?</p>
                    <p className="text-sm">
                      El pago será remitido a <strong>Rectoría</strong> para su autorización final. Una vez autorizado por Rectoría, 
                      el trámite regresará a Dirección Financiera para aplicar el pago en el portal bancario.
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
                setMostrarDialogEnviar(false);
                setObservaciones('');
              }}
              disabled={isProcessing}
              className="border-slate-300"
            >
              Cancelar
            </Button>
            <Button 
              onClick={enviarRectoria} 
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Enviando a Rectoría...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Confirmar Envío a Rectoría
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