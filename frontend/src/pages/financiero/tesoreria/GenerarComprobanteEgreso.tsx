import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Badge } from '../../../share/badge';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import {
  Eye,
  CheckCircle2,
  Calendar,
  FileText,
  Download,
  Building2,
  DollarSign,
  ArrowLeft,
  Printer,
  FileOutput,
} from 'lucide-react';
import { toast } from 'sonner';
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';

interface Factura {
  id: string;
  facturaId: number;
  numeroFactura: string;
  numeroProcesoPago: string;
  numeroTransaccion: string;
  proveedor: string;
  valorTotal: number;
  fechaPagoAplicado: string;
  estado: string;
}

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

const mapFactura = (f: APIFactura): Factura => ({
  id: String(f.id),
  facturaId: Number(f.id),
  numeroFactura: f.numero_factura || `FAC-${f.id}`,
  numeroProcesoPago: f.numero_proceso_pago || 'Sin proceso',
  numeroTransaccion: f.numero_transaccion || 'Sin transaccion',
  proveedor: f.proveedor?.razon_social || 'Sin Asignar',
  valorTotal: Number(f.valor_total || 0),
  fechaPagoAplicado: f.fecha_pago_aplicado || 'Sin fecha',
  estado: f.estado,
});

export default function GenerarComprobanteEgreso() {
  const [facturasPagadas, setFacturasPagadas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [procesando, setProcesando] = useState(false);

  const loadFacturas = async () => {
    const response = await facturasService.getAll({ estado: 'Pago Aplicado', limit: 200 });
    return toList<APIFactura>(response).map(mapFactura);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const rows = await loadFacturas();
        setFacturasPagadas(rows);
      } catch {
        setFacturasPagadas([]);
        setLoadError('No fue posible cargar pagos aplicados.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const verDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setNumeroComprobante(`CE-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`);
  };

  const generarComprobante = () => {
    if (!facturaSeleccionada || !numeroComprobante.trim()) {
      toast.error('Debe definir un numero de comprobante de egreso');
      return;
    }

    setProcesando(true);
    void (async () => {
      try {
        await facturasService.generarComprobante(facturaSeleccionada.facturaId, {
          numero_comprobante: numeroComprobante.trim(),
        });
        const latest = await loadFacturas();
        setFacturasPagadas(latest);
        toast.success(`Comprobante generado: ${numeroComprobante}`);
        setFacturaSeleccionada(null);
      } catch (error: any) {
        toast.error(error?.message || 'No fue posible generar el comprobante.');
      } finally {
        setProcesando(false);
      }
    })();
  };

  const descargarComprobante = () => {
    if (!numeroComprobante) return;
    toast.success(`Descarga iniciada: ${numeroComprobante}.pdf`);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <FileOutput className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-3xl font-bold">Generar Comprobante de Egreso</h1>
            <p className="text-red-100 text-sm">Paso final del proceso despues del pago aplicado</p>
          </div>
        </div>
      </motion.div>

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
            {loadError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</div>
            )}
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <FileText className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-700">El comprobante de egreso se genera solo despues de registrar pago aplicado.</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">N Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proceso</TableHead>
                    <TableHead className="font-semibold text-slate-700">Transaccion</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto Pagado</TableHead>
                    <TableHead className="font-semibold text-slate-700">F. Pago</TableHead>
                    <TableHead className="font-semibold text-slate-700">Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 py-6">Cargando pagos aplicados...</TableCell>
                    </TableRow>
                  ) : facturasPagadas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 py-6">No hay pagos aplicados pendientes de comprobante.</TableCell>
                    </TableRow>
                  ) : facturasPagadas.map((factura) => (
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
              <CardDescription>Generacion del comprobante final</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Proveedor</p>
                  <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /><p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p></div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Monto Pagado</p>
                  <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-600" /><p className="font-semibold text-green-600 text-xl">${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}</p></div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Proceso de Pago</p>
                  <p className="font-semibold text-indigo-600">{facturaSeleccionada.numeroProcesoPago}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Transaccion Bancaria</p>
                  <p className="font-semibold text-emerald-600">{facturaSeleccionada.numeroTransaccion}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Fecha de Pago Aplicado</p>
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-600" /><p className="font-semibold text-emerald-600">{facturaSeleccionada.fechaPagoAplicado}</p></div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Estado</p>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Pago Aplicado</Badge>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">Al generar el comprobante, la factura pasara al estado final: PAGADA.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroComprobante" className="text-slate-700 font-medium">Numero de Comprobante de Egreso</Label>
                <Input id="numeroComprobante" value={numeroComprobante} onChange={(e) => setNumeroComprobante(e.target.value)} className="font-semibold text-lg" />
                <p className="text-xs text-slate-500">Fecha de generacion: {new Date().toISOString().split('T')[0]}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setFacturaSeleccionada(null)} variant="outline" className="flex-1">Cancelar</Button>
                <Button onClick={generarComprobante} disabled={procesando} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  {procesando ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4 mr-2" />Generar Comprobante
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <Button variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50" onClick={descargarComprobante}>
                  <Download className="w-4 h-4 mr-2" />Descargar Comprobante de Egreso (PDF)
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
