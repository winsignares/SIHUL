import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Badge } from '../../../share/badge';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { buildSharedFacturaDetail, type SharedFacturaDetail } from '../../../share/factura-detail-modal';
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
  numeroRadicado: string;
  numeroProcesoPago: string;
  numeroTransaccion: string;
  proveedor: string;
  areaSolicitante: string;
  valorTotal: number;
  fechaPagoAplicado: string;
  fechaComprobante: string;
  numeroComprobante: string;
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
  numeroRadicado: f.numero_radicado || 'Sin radicado',
  numeroProcesoPago: f.numero_proceso_pago || 'Sin proceso',
  numeroTransaccion: f.numero_transaccion || 'Sin transaccion',
  proveedor: f.proveedor?.razon_social || 'Sin Asignar',
  areaSolicitante: f.departamento?.nombre || 'Sin area',
  valorTotal: Number(f.valor_total || 0),
  fechaPagoAplicado: f.fecha_pago_aplicado || 'Sin fecha',
  fechaComprobante: f.fecha_comprobante || 'Sin fecha',
  numeroComprobante: f.numero_comprobante || 'Sin comprobante',
  estado: f.estado,
});

export default function GenerarComprobanteEgreso() {
  const [facturasData, setFacturasData] = useState<APIFactura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [detalleFactura, setDetalleFactura] = useState<SharedFacturaDetail | null>(null);

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

  const loadFacturas = async () => {
    const [pagosAplicados, pagadas] = await Promise.all([
      facturasService.getAll({ estado: 'Pago Aplicado', limit: 200 }),
      facturasService.getAll({ estado: 'Pagada', limit: 200 }),
    ]);

    const map = new Map<number, APIFactura>();
    toList<APIFactura>(pagosAplicados).forEach((f) => map.set(f.id, f));
    toList<APIFactura>(pagadas).forEach((f) => map.set(f.id, f));

    return Array.from(map.values());
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const rows = await loadFacturas();
        setFacturasData(rows);
      } catch {
        setFacturasData([]);
        setLoadError('No fue posible cargar pagos aplicados.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const facturasPagadas = useMemo(() => facturasData.map(mapFactura), [facturasData]);

  const facturasFiltradas = useMemo(() => facturasPagadas.filter((factura) => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.estado && factura.estado !== filtros.estado) return false;
    if (filtros.areaSolicitante && !factura.areaSolicitante.toLowerCase().includes(filtros.areaSolicitante.toLowerCase())) return false;
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
    if (filtros.fechaInicio && factura.fechaPagoAplicado < filtros.fechaInicio) return false;
    if (filtros.fechaFin && factura.fechaPagoAplicado > filtros.fechaFin) return false;
    return true;
  }), [facturasPagadas, filtros]);

  const verDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setNumeroComprobante(
      factura.numeroComprobante !== 'Sin comprobante'
        ? factura.numeroComprobante
        : `CE-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`
    );
  };

  const abrirDetalles = (facturaId: number) => {
    const factura = facturasData.find((f) => f.id === facturaId);
    if (!factura) return;
    setDetalleFactura(buildSharedFacturaDetail(factura));
  };

  const generarComprobante = () => {
    if (!facturaSeleccionada || !numeroComprobante.trim()) {
      toast.error('Debe definir un numero de comprobante de egreso');
      return;
    }

    setProcesando(true);
    void (async () => {
      try {
        const actualizada = await facturasService.generarComprobante(facturaSeleccionada.facturaId, {
          numero_comprobante: numeroComprobante.trim(),
        });
        const latest = await loadFacturas();
        setFacturasData(latest);
        toast.success(`Comprobante generado: ${numeroComprobante}`);
        setFacturaSeleccionada((prev) => (prev ? {
          ...prev,
          estado: actualizada.estado || 'Pagada',
          numeroComprobante: actualizada.numero_comprobante || numeroComprobante.trim(),
          fechaComprobante: actualizada.fecha_comprobante || prev.fechaComprobante,
        } : prev));

        try {
          const blob = await facturasService.descargarComprobantePdf(facturaSeleccionada.facturaId);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Comprobante_Egreso_${actualizada.numero_comprobante || numeroComprobante.trim()}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
        } catch (err: any) {
          toast.error(err?.message || 'No fue posible descargar el PDF del comprobante.');
        }
      } catch (error: any) {
        toast.error(error?.message || 'No fue posible generar el comprobante.');
      } finally {
        setProcesando(false);
      }
    })();
  };

  const descargarComprobante = () => {
    if (!facturaSeleccionada) return;
    void (async () => {
      try {
        const blob = await facturasService.descargarComprobantePdf(facturaSeleccionada.facturaId);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Comprobante_Egreso_${facturaSeleccionada.numeroComprobante}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (err: any) {
        toast.error(err?.message || 'No fue posible descargar el PDF del comprobante.');
      }
    })();
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
                <CardTitle className="text-slate-800">Pagos Aplicados y Pagadas</CardTitle>
                <CardDescription>{facturasFiltradas.length} pago(s) aplicado(s)</CardDescription>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Pago Aplicado / Pagada</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loadError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</div>
            )}
            <TableFilters
              filters={filtros}
              onFilterChange={setFiltros}
              estados={['Pago Aplicado', 'Pagada']}
              proveedores={Array.from(new Set(facturasPagadas.map((f) => f.proveedor)))}
              areas={Array.from(new Set(facturasPagadas.map((f) => f.areaSolicitante)))}
              showMontoFilter
              showFechaFilter
              showAreaFilter
            />
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
                    <TableHead className="font-semibold text-slate-700">N Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proceso</TableHead>
                    <TableHead className="font-semibold text-slate-700">Transaccion</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">Area</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto Pagado</TableHead>
                    <TableHead className="font-semibold text-slate-700">F. Pago</TableHead>
                    <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Comprobante</TableHead>
                    <TableHead className="font-semibold text-slate-700">F. CE</TableHead>
                    <TableHead className="font-semibold text-slate-700">Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-slate-500 py-6">Cargando pagos aplicados...</TableCell>
                    </TableRow>
                  ) : facturasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-slate-500 py-6">No hay pagos aplicados para mostrar.</TableCell>
                    </TableRow>
                  ) : facturasFiltradas.map((factura) => (
                    <TableRow key={factura.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                      <TableCell className="text-slate-600">{factura.numeroRadicado}</TableCell>
                      <TableCell className="text-indigo-600 font-medium">{factura.numeroProcesoPago}</TableCell>
                      <TableCell className="text-emerald-600 font-medium text-sm">{factura.numeroTransaccion}</TableCell>
                      <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                      <TableCell className="text-slate-600">{factura.areaSolicitante}</TableCell>
                      <TableCell className="font-semibold text-green-600">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                      <TableCell className="text-slate-600">{factura.fechaPagoAplicado}</TableCell>
                      <TableCell>
                        <Badge className={factura.estado === 'Pagada' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}>
                          {factura.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{factura.numeroComprobante}</TableCell>
                      <TableCell className="text-slate-600">{factura.fechaComprobante}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => abrirDetalles(factura.facturaId)} variant="outline">
                            <Eye className="w-4 h-4 mr-1" />Ver detalles
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => verDetalle(factura)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={factura.estado !== 'Pago Aplicado'}
                          >
                            <FileOutput className="w-4 h-4 mr-1" />Generar CE
                          </Button>
                        </div>
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
                  <Badge className={facturaSeleccionada.estado === 'Pagada' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}>
                    {facturaSeleccionada.estado}
                  </Badge>
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
                <Button onClick={generarComprobante} disabled={procesando || facturaSeleccionada.estado !== 'Pago Aplicado'} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
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
                <Button
                  variant="outline"
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                  onClick={descargarComprobante}
                  disabled={facturaSeleccionada.numeroComprobante === 'Sin comprobante'}
                >
                  <Download className="w-4 h-4 mr-2" />Descargar Comprobante de Egreso (PDF)
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <FacturaDetailModal
        factura={detalleFactura}
        isOpen={!!detalleFactura}
        onClose={() => setDetalleFactura(null)}
      />
    </div>
  );
}
