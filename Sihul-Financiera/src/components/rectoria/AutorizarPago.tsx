import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  FileCheck, Eye, CheckCircle2, XCircle, AlertTriangle, Calendar,
  Building2, DollarSign, ArrowLeft, Send, Shield
} from 'lucide-react';

interface Factura {
  id: string;
  numeroFactura: string;
  numeroProcesoPago: string;
  proveedor: string;
  valorTotal: number;
  fechaRecepcion: string;
  fechaCargue: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
}

export default function AutorizarPago() {
  const [facturasCargadas] = useState<Factura[]>([
    {
      id: '1',
      numeroFactura: 'FAC-2026-145',
      numeroProcesoPago: 'PP-2026-00078',
      proveedor: 'Tecnología Global SAS',
      valorTotal: 8900000,
      fechaRecepcion: '2026-03-28',
      fechaCargue: '2026-04-01',
      areaSolicitante: 'Sistemas',
      estado: 'Cargada',
      diasTranscurridos: 0,
      descripcion: 'Equipos de cómputo para área administrativa'
    }
  ]);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [accion, setAccion] = useState<'autorizar' | 'rechazar' | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);

  const verDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setAccion(null);
    setObservaciones('');
  };

  const confirmarAutorizacion = () => {
    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      alert(`✅ PAGO AUTORIZADO POR RECTORÍA\n\nFactura: ${facturaSeleccionada?.numeroFactura}\nProceso: ${facturaSeleccionada?.numeroProcesoPago}\n\nEstado: AUTORIZADA PARA PAGO\nSiguiente: Aplicación Real del Pago (Portal Bancario)`);
      setFacturaSeleccionada(null);
      setAccion(null);
    }, 1500);
  };

  const confirmarRechazo = () => {
    if (!observaciones.trim() || observaciones.trim().length < 10) {
      alert('❌ ERROR\n\nLa observación es OBLIGATORIA. Mínimo 10 caracteres.');
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      alert(`❌ PAGO RECHAZADO POR RECTORÍA\n\nMotivo:\n${observaciones}\n\nEstado: RECHAZADA\nVuelve a: Dirección Financiera\n\nDespués de corrección debe subir nuevamente hasta Rectoría.`);
      setFacturaSeleccionada(null);
      setAccion(null);
      setObservaciones('');
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Autorización de Pagos</h1>
          <p className="text-slate-600">Revise y autorice los pagos cargados formalmente</p>
        </div>

        {!facturaSeleccionada && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Facturas Pendientes de Autorización</CardTitle>
                  <CardDescription>{facturasCargadas.length} factura(s) cargada(s)</CardDescription>
                </div>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">Cargada</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">N° Factura</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proceso</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">F. Cargue</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasCargadas.map((factura) => (
                      <TableRow key={factura.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                        <TableCell className="text-orange-600 font-medium">{factura.numeroProcesoPago}</TableCell>
                        <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                        <TableCell className="font-semibold text-slate-800">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                        <TableCell className="text-slate-600">{factura.fechaCargue}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => verDetalle(factura)} className="bg-red-600 hover:bg-red-700 text-white">
                            <Eye className="w-4 h-4 mr-1" />Revisar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {facturaSeleccionada && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Button onClick={() => { setFacturaSeleccionada(null); setAccion(null); }} variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />Volver
            </Button>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800">Autorización - {facturaSeleccionada.numeroFactura}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Proveedor</p>
                    <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Valor Total</p>
                    <p className="font-semibold text-green-600 text-xl">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Proceso de Pago</p>
                    <p className="font-semibold text-orange-600">{facturaSeleccionada.numeroProcesoPago}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Descripción</p>
                    <p className="text-slate-800">{facturaSeleccionada.descripcion}</p>
                  </div>
                </div>

                {!accion && (
                  <div className="flex gap-4 pt-4">
                    <Button onClick={() => setAccion('autorizar')} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      <Shield className="w-4 h-4 mr-2" />Autorizar Pago
                    </Button>
                    <Button onClick={() => setAccion('rechazar')} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                      <XCircle className="w-4 h-4 mr-2" />Rechazar
                    </Button>
                  </div>
                )}

                <AnimatePresence>
                  {accion === 'autorizar' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t pt-6 space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <div>
                            <h3 className="font-semibold text-green-700">Autorizar Pago</h3>
                            <p className="text-sm text-green-600">El pago pasará a aplicación en portal bancario.</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={() => setAccion(null)} variant="outline" className="flex-1">Cancelar</Button>
                        <Button onClick={confirmarAutorizacion} disabled={procesando} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                          {procesando ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                          Confirmar
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {accion === 'rechazar' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t pt-6 space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <div>
                            <h3 className="font-semibold text-red-700">Rechazar Pago</h3>
                            <p className="text-sm text-red-600">Vuelve a Dirección Financiera. Observación obligatoria.</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Motivo <span className="text-red-600">*</span></Label>
                        <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Especifique el motivo..." rows={4} className="border-red-300" />
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={() => { setAccion(null); setObservaciones(''); }} variant="outline" className="flex-1">Cancelar</Button>
                        <Button onClick={confirmarRechazo} disabled={procesando} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                          {procesando ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                          Confirmar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
