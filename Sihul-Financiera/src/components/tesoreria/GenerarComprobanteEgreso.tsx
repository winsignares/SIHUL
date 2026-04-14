import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Eye, CheckCircle2, Calendar, FileText, Download,
  Building2, DollarSign, ArrowLeft, Send, Printer
} from 'lucide-react';

interface Factura {
  id: string;
  numeroFactura: string;
  numeroProcesoPago: string;
  numeroTransaccion: string;
  proveedor: string;
  valorTotal: number;
  fechaPagoAplicado: string;
  estado: string;
}

export default function GenerarComprobanteEgreso() {
  const [facturasPagadas] = useState<Factura[]>([
    {
      id: '1',
      numeroFactura: 'FAC-2026-145',
      numeroProcesoPago: 'PP-2026-00078',
      numeroTransaccion: 'TRX-1234567890',
      proveedor: 'Tecnología Global SAS',
      valorTotal: 8900000,
      fechaPagoAplicado: '2026-04-01',
      estado: 'Pago Aplicado'
    }
  ]);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [procesando, setProcesando] = useState(false);

  const verDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setNumeroComprobante(`CE-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`);
  };

  const generarComprobante = () => {
    if (!numeroComprobante) {
      alert('❌ ERROR\n\nDebe generar un número de comprobante de egreso.');
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      alert(`✅ COMPROBANTE DE EGRESO GENERADO\n\n🎉 PROCESO COMPLETADO 🎉\n\nFactura: ${facturaSeleccionada?.numeroFactura}\nComprobante de Egreso: ${numeroComprobante}\nTransacción: ${facturaSeleccionada?.numeroTransaccion}\n\n📅 Fecha: ${new Date().toISOString().split('T')[0]}\n\nEstado Final: PAGADA\n\n✅ El ciclo completo del proceso de Cuentas por Pagar ha finalizado exitosamente.\n\n📄 El comprobante de egreso ya está disponible para descarga e impresión.`);
      setFacturaSeleccionada(null);
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Generar Comprobante de Egreso</h1>
          <p className="text-slate-600">Paso FINAL del proceso - Después del pago aplicado</p>
        </div>

        {!facturaSeleccionada && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Pagos Aplicados (Pendientes de CE)</CardTitle>
                  <CardDescription>{facturasPagadas.length} pago(s) aplicado(s)</CardDescription>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Pago Aplicado</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-700 mb-1">¡ÚLTIMO PASO DEL CICLO!</h3>
                    <p className="text-sm text-yellow-600">
                      El comprobante de egreso se genera SOLO después de que el pago fue aplicado en el portal bancario.
                      NO existe antes del alistamiento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">N° Factura</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proceso</TableHead>
                      <TableHead className="font-semibold text-slate-700">Transacción</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto Pagado</TableHead>
                      <TableHead className="font-semibold text-slate-700">F. Pago</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasPagadas.map((factura) => (
                      <TableRow key={factura.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                        <TableCell className="text-indigo-600 font-medium">{factura.numeroProcesoPago}</TableCell>
                        <TableCell className="text-emerald-600 font-medium text-sm">{factura.numeroTransaccion}</TableCell>
                        <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                        <TableCell className="font-semibold text-green-600">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                        <TableCell className="text-slate-600">{factura.fechaPagoAplicado}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => verDetalle(factura)} className="bg-red-600 hover:bg-red-700 text-white">
                            <Eye className="w-4 h-4 mr-1" />Generar CE
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
            <Button onClick={() => setFacturaSeleccionada(null)} variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />Volver
            </Button>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800">Comprobante de Egreso - {facturaSeleccionada.numeroFactura}</CardTitle>
                <CardDescription>Generación del comprobante final</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Proveedor</p>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Monto Pagado</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <p className="font-semibold text-green-600 text-xl">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Proceso de Pago</p>
                    <p className="font-semibold text-indigo-600">{facturaSeleccionada.numeroProcesoPago}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Transacción Bancaria</p>
                    <p className="font-semibold text-emerald-600">{facturaSeleccionada.numeroTransaccion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Fecha de Pago Aplicado</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <p className="font-semibold text-emerald-600">{facturaSeleccionada.fechaPagoAplicado}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Estado</p>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      Pago Aplicado
                    </Badge>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-700 mb-1">Generación de Comprobante de Egreso</h3>
                      <p className="text-sm text-green-600">
                        Este es el ÚLTIMO paso del ciclo completo. El pago ya fue aplicado en el portal bancario.
                        Al generar el comprobante, la factura pasará a estado FINAL: <strong>PAGADA</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroComprobante" className="text-slate-700 font-medium">
                    Número de Comprobante de Egreso
                  </Label>
                  <Input
                    id="numeroComprobante"
                    value={numeroComprobante}
                    onChange={(e) => setNumeroComprobante(e.target.value)}
                    className="font-semibold text-lg"
                  />
                  <p className="text-xs text-slate-500">
                    📅 Fecha de Generación: {new Date().toISOString().split('T')[0]}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setFacturaSeleccionada(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={generarComprobante}
                    disabled={procesando}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {procesando ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4 mr-2" />
                        Generar Comprobante
                      </>
                    )}
                  </Button>
                </div>

                {/* Botón de descarga simulado */}
                <div className="border-t border-slate-200 pt-4">
                  <Button
                    variant="outline"
                    className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Comprobante de Egreso (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
