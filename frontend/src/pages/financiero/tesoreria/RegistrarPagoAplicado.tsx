import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Textarea } from '../../../share/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Badge } from '../../../share/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import { CheckCircle, Filter, Calendar, Eye, Building, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';

interface Factura {
  id: string;
  facturaId: number;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  proveedor: string;
  nit: string;
  valorTotal: number;
  fechaAutorizacion: string;
  areaSolicitante: string;
  cuentaContable: string;
  centroCosto: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
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
  proveedor: f.proveedor?.razon_social || 'Sin Asignar',
  nit: f.proveedor?.nit || 'Sin NIT',
  valorTotal: Number(f.valor_total || 0),
  fechaAutorizacion: f.fecha_autorizacion || 'Sin fecha',
  areaSolicitante: f.departamento?.nombre || 'Sin Asignar',
  cuentaContable: f.cuenta_contable ? `${f.cuenta_contable.codigo} - ${f.cuenta_contable.nombre}` : 'Sin cuenta',
  centroCosto: f.centro_costo ? `${f.centro_costo.codigo} - ${f.centro_costo.nombre}` : 'Sin centro',
  estado: f.estado,
  diasTranscurridos: Math.max(0, Number(f.dias_transcurridos || 0)),
  descripcion: f.descripcion || 'Sin Asignar',
});

export default function RegistrarPagoAplicado() {
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: '',
  });

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogRegistrar, setMostrarDialogRegistrar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [numeroTransaccion, setNumeroTransaccion] = useState('');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [facturasAutorizadas, setFacturasAutorizadas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFacturas = async () => {
    const response = await facturasService.getAll({ estado: 'Autorizada', limit: 200 });
    return toList<APIFactura>(response).map(mapFactura);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const rows = await loadFacturas();
        setFacturasAutorizadas(rows);
      } catch {
        setFacturasAutorizadas([]);
        setLoadError('No fue posible cargar pagos autorizados.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const facturasFiltradas = useMemo(() => facturasAutorizadas.filter((factura) => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.areaSolicitante && !factura.areaSolicitante.toLowerCase().includes(filtros.areaSolicitante.toLowerCase())) return false;
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
    if (filtros.fechaInicio && factura.fechaAutorizacion < filtros.fechaInicio) return false;
    if (filtros.fechaFin && factura.fechaAutorizacion > filtros.fechaFin) return false;
    return true;
  }), [facturasAutorizadas, filtros]);

  const abrirDialogRegistrar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setNumeroTransaccion('');
    setFechaPago(new Date().toISOString().split('T')[0]);
    setArchivoComprobante(null);
    setObservaciones('');
    setMostrarDialogRegistrar(true);
  };

  const handleVerDetalle = (factura: Factura) => {
    setFacturaDetalle({
      numeroFactura: factura.numeroFactura,
      numeroRadicado: factura.numeroRadicado,
      numeroProcesoPago: factura.numeroProcesoPago,
      proveedor: factura.proveedor,
      nit: factura.nit,
      valorTotal: factura.valorTotal,
      areaSolicitante: factura.areaSolicitante,
      estado: factura.estado,
      diasTranscurridos: factura.diasTranscurridos,
      fechaRecepcion: factura.fechaAutorizacion,
      descripcion: factura.descripcion,
      cuentaContable: factura.cuentaContable,
      centroCosto: factura.centroCosto,
      nivelRiesgo: factura.diasTranscurridos >= 2 ? 'amarillo' : 'verde',
    });
    setMostrarDialogDetalle(true);
  };

  const registrarPago = () => {
    if (!facturaSeleccionada) return;

    if (!numeroTransaccion.trim()) {
      toast.error('Debe ingresar el numero de transaccion bancaria');
      return;
    }

    if (!archivoComprobante) {
      toast.error('Debe cargar el comprobante bancario en archivo.');
      return;
    }

    setIsProcessing(true);

    void (async () => {
      try {
        await facturasService.registrarPagoAplicado(facturaSeleccionada.facturaId, {
          numero_transaccion: numeroTransaccion.trim(),
          fecha_pago_aplicado: fechaPago,
          observaciones: observaciones.trim() || undefined,
          comprobante_bancario: archivoComprobante,
        });
        const latest = await loadFacturas();
        setFacturasAutorizadas(latest);
        toast.success(`Pago aplicado registrado: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogRegistrar(false);
        setFacturaSeleccionada(null);
        setNumeroTransaccion('');
        setObservaciones('');
        setArchivoComprobante(null);
      } catch (error: any) {
        toast.error(error?.message || 'No fue posible registrar el pago aplicado.');
      } finally {
        setIsProcessing(false);
      }
    })();
  };

  const onSelectComprobante = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setArchivoComprobante(null);
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    const allowedExtensions = ['pdf', 'xml', 'png', 'jpg', 'jpeg'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(extension)) {
      toast.error('Formato no permitido. Use PDF, XML, PNG o JPG.');
      event.target.value = '';
      setArchivoComprobante(null);
      return;
    }

    if (file.size > maxSizeBytes) {
      toast.error('El archivo supera el tamaño máximo permitido (10 MB).');
      event.target.value = '';
      setArchivoComprobante(null);
      return;
    }

    setArchivoComprobante(file);
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
              <CheckCircle className="w-7 h-7 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-white mb-1 text-3xl font-bold">Registrar Pago Aplicado</h1>
              <p className="text-red-100 text-sm">Registra en SIHUL los pagos ya ejecutados en el portal bancario externo</p>
            </div>
            <div className="bg-blue-500/20 border border-blue-300/30 rounded-lg px-4 py-2">
              <p className="text-blue-100 text-xs font-medium">Informacion</p>
              <p className="text-white text-sm font-semibold">El pago se ejecuta en el banco</p>
            </div>
          </div>
        </motion.div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800"><Filter className="w-5 h-5 text-red-600" />Filtros de Busqueda Independientes</CardTitle>
            <CardDescription>Filtre por columna especifica usando campos independientes</CardDescription>
          </CardHeader>
          <CardContent>
            <TableFilters
              filters={filtros}
              onFilterChange={setFiltros}
              estados={['Autorizada']}
              proveedores={Array.from(new Set(facturasAutorizadas.map((f) => f.proveedor)))}
              areas={Array.from(new Set(facturasAutorizadas.map((f) => f.areaSolicitante)))}
              showMontoFilter
              showFechaFilter
              showAreaFilter
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg border-green-200 bg-green-50"><CardContent className="p-6"><p className="text-green-700 text-sm font-semibold">Pagos Autorizados</p><p className="text-3xl font-bold text-green-800 mt-1">{facturasFiltradas.length}</p></CardContent></Card>
          <Card className="border-0 shadow-lg border-blue-200 bg-blue-50"><CardContent className="p-6"><p className="text-blue-700 text-sm font-semibold">Monto Total</p><p className="text-2xl font-bold text-blue-800 mt-1">${facturasFiltradas.reduce((sum, f) => sum + f.valorTotal, 0).toLocaleString('es-CO')}</p></CardContent></Card>
          <Card className="border-0 shadow-lg border-purple-200 bg-purple-50"><CardContent className="p-6"><p className="text-purple-700 text-sm font-semibold">Por Registrar</p><p className="text-3xl font-bold text-purple-800 mt-1">{facturasFiltradas.length}</p></CardContent></Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800">Pagos Autorizados (Ejecutados en Portal Bancario)</CardTitle>
                <CardDescription>{facturasFiltradas.length} pago(s) pendiente(s) de registro</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200 border text-lg px-4 py-2">
                <CheckCircle className="w-4 h-4 mr-2" />{facturasFiltradas.length} Autorizados
              </Badge>
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
                    <TableHead className="font-semibold text-slate-700">N Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Area</TableHead>
                    <TableHead className="font-semibold text-slate-700">N Proceso</TableHead>
                    <TableHead className="font-semibold text-slate-700">F. Autorizacion</TableHead>
                    <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                    <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-500 py-6">Cargando pagos autorizados...</TableCell>
                    </TableRow>
                  ) : facturasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-500 py-6">No hay pagos autorizados para registrar.</TableCell>
                    </TableRow>
                  ) : facturasFiltradas.map((factura, index) => (
                    <motion.tr key={factura.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><Building className="w-4 h-4 text-slate-400" /><span className="text-slate-700">{factura.proveedor}</span></div></TableCell>
                      <TableCell className="font-bold text-green-700 text-base">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{factura.areaSolicitante}</Badge></TableCell>
                      <TableCell><Badge className="bg-blue-100 text-blue-700 border-blue-200 border font-mono text-xs">{factura.numeroProcesoPago}</Badge></TableCell>
                      <TableCell className="text-slate-600"><div className="flex items-center gap-1 text-sm"><Calendar className="w-3 h-3" />{factura.fechaAutorizacion}</div></TableCell>
                      <TableCell><Badge className={`${factura.diasTranscurridos >= 2 ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-green-100 text-green-700 border-green-300'} border text-xs`}>{factura.diasTranscurridos}d</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleVerDetalle(factura)} className="border-slate-300 text-slate-700 hover:bg-slate-100"><Eye className="w-4 h-4 mr-1" />Ver</Button>
                          <Button size="sm" onClick={() => abrirDialogRegistrar(factura)} className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="w-4 h-4 mr-1" />Registrar</Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>

              {!loading && facturasFiltradas.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">No se encontraron pagos autorizados con los filtros aplicados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={mostrarDialogRegistrar} onOpenChange={setMostrarDialogRegistrar}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" />Registrar Pago Ejecutado</DialogTitle>
            <DialogDescription>Registre en el sistema el pago ya aplicado en portal bancario externo</DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex gap-2">
                  <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-700">Este modulo no ejecuta pagos. Solo registra pagos ya aplicados en banco.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div><Label className="text-xs text-slate-500">Factura</Label><p className="font-semibold text-slate-800">{facturaSeleccionada.numeroFactura}</p></div>
                <div><Label className="text-xs text-slate-500">Proveedor</Label><p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p></div>
                <div><Label htmlFor="trans" className="text-xs text-slate-500">Numero de transaccion</Label><Input id="trans" value={numeroTransaccion} onChange={(e) => setNumeroTransaccion(e.target.value)} placeholder="TRX-XXXX" /></div>
                <div><Label htmlFor="fecha-pago" className="text-xs text-slate-500">Fecha de pago aplicado</Label><Input id="fecha-pago" type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} /></div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="comprobante-bancario" className="text-xs text-slate-500">Comprobante bancario (requerido)</Label>
                  <Input id="comprobante-bancario" type="file" accept=".pdf,.xml,.png,.jpg,.jpeg" onChange={onSelectComprobante} />
                  <Input value={archivoComprobante?.name || ''} readOnly placeholder="Sin archivo" />
                  <p className="text-xs text-slate-500">Formatos: PDF, XML, PNG o JPG. Maximo 10 MB.</p>
                </div>
              </div>

              <div>
                <Label htmlFor="obs">Observaciones</Label>
                <Textarea id="obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas de registro interno" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogRegistrar(false)}>Cancelar</Button>
            <Button onClick={registrarPago} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? 'Registrando...' : 'Confirmar Registro'}
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
