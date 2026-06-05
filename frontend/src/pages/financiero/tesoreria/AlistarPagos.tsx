import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Textarea } from '../../../share/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Badge } from '../../../share/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import { Calendar, FileCheck, Eye, AlertCircle, XCircle, Download, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import { displayDate, displayRadicado, displayText } from '../../../share/field-placeholders';
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';

interface Factura {
  id: string;
  facturaId: number;
  numeroFactura: string;
  numeroRadicado?: string;
  proveedor: string;
  nit?: string;
  valorTotal: number;
  fechaCausacion?: string;
  cuentaContable?: string;
  centroCosto?: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
  numeroProcesoPago?: string;
  archivoPlanoGenerado?: string;
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
  numeroRadicado: f.numero_radicado,
  proveedor: f.proveedor?.razon_social || 'Sin Asignar',
  nit: f.proveedor?.nit,
  valorTotal: Number(f.valor_total || 0),
  fechaCausacion: f.fecha_causacion,
  cuentaContable: f.cuenta_contable ? `${f.cuenta_contable.codigo} - ${f.cuenta_contable.nombre}` : undefined,
  centroCosto: f.centro_costo ? `${f.centro_costo.codigo} - ${f.centro_costo.nombre}` : undefined,
  areaSolicitante: f.departamento?.nombre || 'Sin Asignar',
  estado: f.estado,
  diasTranscurridos: Math.max(0, Number(f.dias_transcurridos || 0)),
  descripcion: f.descripcion || 'Sin Asignar',
  numeroProcesoPago: f.numero_proceso_pago,
  archivoPlanoGenerado: f.archivo_plano_generado,
});

export default function AlistarPagos() {
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

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogAlistar, setMostrarDialogAlistar] = useState(false);
  const [mostrarDialogDetener, setMostrarDialogDetener] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [numeroProcesoPago, setNumeroProcesoPago] = useState('');
  const [archivoPlano, setArchivoPlano] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [motivoDetencion, setMotivoDetencion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [facturasTesoreria, setFacturasTesoreria] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFacturas = async () => {
    const response = await facturasService.getAll({ limit: 200 });
    return toList<APIFactura>(response)
      .filter((f) => f.estado === 'Causada' || f.estado === 'Detenida')
      .map(mapFactura);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const rows = await loadFacturas();
        setFacturasTesoreria(rows);
      } catch {
        setFacturasTesoreria([]);
        setLoadError('No fue posible cargar facturas para alistamiento.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const facturasFiltradas = useMemo(() => facturasTesoreria.filter((factura) => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.estado && factura.estado !== filtros.estado) return false;
    if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
    if (filtros.fechaInicio && factura.fechaCausacion && new Date(factura.fechaCausacion) < new Date(filtros.fechaInicio)) return false;
    if (filtros.fechaFin && factura.fechaCausacion && new Date(factura.fechaCausacion) > new Date(filtros.fechaFin)) return false;
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
    return true;
  }), [facturasTesoreria, filtros]);

  const abrirDialogAlistar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setNumeroProcesoPago(factura.numeroProcesoPago || `PP-${new Date().getFullYear()}-${String(factura.facturaId).padStart(4, '0')}`);
    setArchivoPlano(factura.archivoPlanoGenerado || '');
    setObservaciones('');
    setMostrarDialogAlistar(true);
  };

  const abrirDialogDetener = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMotivoDetencion('');
    setMostrarDialogDetener(true);
  };

  const abrirDialogDetalle = (factura: Factura) => {
    setFacturaDetalle({
      numeroFactura: factura.numeroFactura,
      numeroRadicado: factura.numeroRadicado,
      proveedor: factura.proveedor,
      nit: factura.nit,
      valorTotal: factura.valorTotal,
      areaSolicitante: factura.areaSolicitante,
      estado: factura.estado,
      diasTranscurridos: factura.diasTranscurridos,
      fechaRecepcion: factura.fechaCausacion,
      descripcion: factura.descripcion,
      cuentaContable: factura.cuentaContable,
      centroCosto: factura.centroCosto,
      nivelRiesgo: factura.diasTranscurridos > 17 ? 'rojo' : factura.diasTranscurridos > 10 ? 'amarillo' : 'verde',
    });
    setMostrarDialogDetalle(true);
  };

  const alistarPago = () => {
    if (!facturaSeleccionada || (!numeroProcesoPago.trim() && !archivoPlano.trim())) {
      toast.error('Debe registrar número de proceso o archivo plano');
      return;
    }

    setIsProcessing(true);
    void (async () => {
      try {
        await facturasService.alistar(facturaSeleccionada.facturaId, {
          numero_proceso_pago: numeroProcesoPago.trim() || undefined,
          archivo_plano_generado: archivoPlano.trim() || undefined,
          observaciones: observaciones.trim() || undefined,
        });

        const latest = await loadFacturas();
        setFacturasTesoreria(latest);
        toast.success(`Pago alistado: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogAlistar(false);
        setFacturaSeleccionada(null);
      } catch (error: any) {
        toast.error(error?.message || 'No fue posible completar el alistamiento.');
      } finally {
        setIsProcessing(false);
      }
    })();
  };

  const detenerFactura = () => {
    if (!facturaSeleccionada || motivoDetencion.trim().length < 10) {
      toast.error('Debe indicar una observación mínima de 10 caracteres');
      return;
    }

    setIsProcessing(true);
    void (async () => {
      try {
        await facturasService.detenerEnTesoreria(facturaSeleccionada.facturaId, motivoDetencion.trim());
        const latest = await loadFacturas();
        setFacturasTesoreria(latest);
        toast.warning(`Factura detenida en tesorería: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogDetener(false);
        setFacturaSeleccionada(null);
      } catch (error: any) {
        toast.error(error?.message || 'No fue posible detener la factura en tesorería.');
      } finally {
        setIsProcessing(false);
      }
    })();
  };

  const generarArchivoPlano = () => {
    if (!facturaSeleccionada) return;
    const nombreArchivo = `PAGO_${facturaSeleccionada.numeroFactura.replace(/-/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    setArchivoPlano(nombreArchivo);
    toast.success(`Archivo plano generado: ${nombreArchivo}`);
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
              <FileCheck className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Alistar Pagos</h1>
              <p className="text-red-100 text-sm">Preparar proceso de pago y archivo plano para el aplicativo financiero</p>
            </div>
          </div>
        </motion.div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Filtros de Busqueda Independientes
            </CardTitle>
            <CardDescription>Filtre por columna especifica usando campos independientes</CardDescription>
          </CardHeader>
          <CardContent>
            <TableFilters
              filters={filtros}
              onFilterChange={setFiltros}
              estados={['Causada', 'Detenida']}
              proveedores={Array.from(new Set(facturasTesoreria.map((f) => f.proveedor)))}
              areas={Array.from(new Set(facturasTesoreria.map((f) => f.areaSolicitante)))}
              showMontoFilter
              showFechaFilter
              showAreaFilter
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800">Facturas Causadas Pendientes</CardTitle>
                <CardDescription>{facturasFiltradas.length} factura(s) lista(s) para alistar</CardDescription>
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-lg px-4 py-2">{facturasFiltradas.length} Por Alistar</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loadError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</div>
            )}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                    <TableHead className="font-semibold text-slate-700">N Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">N Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                    <TableHead className="font-semibold text-slate-700">Centro Costo</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha Causacion</TableHead>
                    <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                    <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-slate-500 py-6">Cargando facturas de tesorería...</TableCell>
                    </TableRow>
                  ) : facturasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-slate-500 py-6">No hay facturas en Causada/Detenida con los filtros actuales.</TableCell>
                    </TableRow>
                  ) : facturasFiltradas.map((factura, index) => {
                    const colorRiesgo = factura.diasTranscurridos >= 18 ? 'bg-orange-500' : factura.diasTranscurridos >= 12 ? 'bg-yellow-500' : 'bg-green-500';

                    return (
                      <motion.tr
                        key={factura.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colorRiesgo}`} />
                            {factura.diasTranscurridos >= 18 && <AlertCircle className="w-4 h-4 text-orange-700" />}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                        <TableCell><Badge className="bg-blue-100 text-blue-700 border-blue-200 border font-mono text-xs">{displayRadicado(factura.numeroRadicado)}</Badge></TableCell>
                        <TableCell className="text-slate-600 max-w-[180px] truncate" title={displayText(factura.proveedor)}>{displayText(factura.proveedor)}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{displayText(factura.nit)}</TableCell>
                        <TableCell className="font-semibold text-slate-800">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                        <TableCell>{factura.cuentaContable ? <Badge className="bg-purple-100 text-purple-700 border-purple-200 border font-mono text-xs">{factura.cuentaContable}</Badge> : <span className="text-slate-400 text-xs">{displayText(factura.cuentaContable)}</span>}</TableCell>
                        <TableCell>{factura.centroCosto ? <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 border font-mono text-xs">{factura.centroCosto}</Badge> : <span className="text-slate-400 text-xs">{displayText(factura.centroCosto)}</span>}</TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-slate-400" />{displayDate(factura.fechaCausacion)}</div>
                        </TableCell>
                        <TableCell><span className="inline-flex items-center gap-1 font-bold text-sm text-slate-700">{factura.diasTranscurridos}d</span></TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => abrirDialogDetener(factura)} className="border-red-300 text-red-700 hover:bg-red-50">
                              <XCircle className="w-4 h-4 mr-1" />Detener
                            </Button>
                            <Button size="sm" onClick={() => abrirDialogAlistar(factura)} className="bg-blue-600 hover:bg-blue-700 text-white">
                              <FileCheck className="w-4 h-4 mr-1" />Alistar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => abrirDialogDetalle(factura)} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                              <Eye className="w-4 h-4 mr-1" />Detalle
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={mostrarDialogAlistar} onOpenChange={setMostrarDialogAlistar}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Alistar Pago</DialogTitle>
            <DialogDescription>Revise soportes, registre número de proceso y/o archivo plano para marcar como Alistada</DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <Label className="text-xs text-slate-500">Factura</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Proveedor</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                </div>
                <div>
                  <Label htmlFor="proceso" className="text-xs text-slate-500">Numero Proceso Pago</Label>
                  <Input id="proceso" value={numeroProcesoPago} onChange={(e) => setNumeroProcesoPago(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Archivo Plano</Label>
                  <div className="flex items-center gap-2">
                    <Input value={archivoPlano} readOnly placeholder="No generado" />
                    <Button type="button" variant="outline" onClick={generarArchivoPlano}>
                      <Download className="w-4 h-4 mr-1" />Generar
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="obs">Observaciones</Label>
                <Textarea id="obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones del alistamiento" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogAlistar(false)}>Cancelar</Button>
            <Button onClick={alistarPago} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
              {isProcessing ? 'Alistando...' : 'Confirmar Alistamiento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarDialogDetener} onOpenChange={setMostrarDialogDetener}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Detener en Tesorería</DialogTitle>
            <DialogDescription>Registre la inconsistencia para mantener el trámite en tesorería hasta corregir</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="motivo">Observación de detención</Label>
            <Textarea id="motivo" value={motivoDetencion} onChange={(e) => setMotivoDetencion(e.target.value)} placeholder="Detalle de la inconsistencia detectada (mínimo 10 caracteres)" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogDetener(false)}>Cancelar</Button>
            <Button onClick={detenerFactura} disabled={isProcessing} className="bg-red-600 hover:bg-red-700">
              {isProcessing ? 'Deteniendo...' : 'Confirmar Detención'}
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
