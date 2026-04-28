import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../../share/card';
import { Button } from '../../../share/button';
import { Textarea } from '../../../share/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../share/table';
import {
  Calculator,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  AlertCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../share/dialog';
import { Badge } from '../../../share/badge';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import {
  facturasService,
  cuentasContablesService,
  centrosCostoService,
  documentosService,
} from '../../../services/financiero';
import type { Factura, CuentaContable, CentroCosto, DocumentoAdjunto } from '../../../models/financiero/core.models';

const facturaToDetail = (
  factura: Factura,
  docs: DocumentoAdjunto[],
  cuentasContables: CuentaContable[] = [],
  centrosCosto: CentroCosto[] = []
): SharedFacturaDetail => {
  const cuenta = cuentasContables.find((c) => c.id === factura.cuenta_contable_id);
  const centro = centrosCosto.find((c) => c.id === factura.centro_costo_id);
  return {
    id: String(factura.id),
    numeroFactura: factura.numero_factura,
    numeroRadicado: factura.numero_radicado,
    proveedor: factura.proveedor?.razon_social ?? '',
    nit: factura.proveedor?.nit ?? '',
    valorTotal: Number(factura.valor_total),
    fechaFactura: factura.fecha_factura,
    fechaRecepcion: factura.fecha_recepcion,
    areaSolicitante: factura.departamento?.nombre ?? '',
    estado: factura.estado,
    diasTranscurridos: factura.dias_transcurridos,
    descripcion: factura.descripcion,
    observaciones: factura.observaciones,
    cuentaContable: cuenta ? `${cuenta.codigo} — ${cuenta.nombre}` : undefined,
    centroCosto: centro ? `${centro.codigo} — ${centro.nombre}` : undefined,
    documentos: docs.map((d) => ({
      id: String(d.id),
      nombre: d.nombre_archivo,
      tipo: d.tipo_documento,
      verificado: d.verificado,
      url: d.archivo_url ?? d.url_storage ?? undefined,
    })),
  };
};

export default function CausarFacturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [cuentasContables, setCuentasContables] = useState<CuentaContable[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [accion, setAccion] = useState<'causar' | 'devolver' | null>(null);
  const [cuentaId, setCuentaId] = useState<string>('');
  const [centroId, setCentroId] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

  const [modalFactura, setModalFactura] = useState<SharedFacturaDetail | null>(null);

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

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [lista, cuentas, centros] = await Promise.all([
        facturasService.getByEstado('Radicada'),
        cuentasContablesService.getAll(),
        centrosCostoService.getAll(),
      ]);
      setFacturas(lista);
      setCuentasContables(Array.isArray(cuentas) ? cuentas : (cuentas as { results?: CuentaContable[] }).results ?? []);
      setCentrosCosto(Array.isArray(centros) ? centros : (centros as { results?: CentroCosto[] }).results ?? []);
      const docsResults = await Promise.all(
        lista.map((f) => documentosService.getByFactura(f.id).then((d) => ({ id: f.id, docs: d })))
      );
      const map: Record<number, DocumentoAdjunto[]> = {};
      docsResults.forEach(({ id, docs }) => { map[id] = docs; });
      setDocsMap(map);
    } catch {
      setError('No se pudo cargar las facturas. Verifique la conexion.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const showToast = (tipo: 'ok' | 'err', msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const facturasFiltradas = facturas.filter((f) => {
    const proveedor = f.proveedor?.razon_social ?? '';
    const area = f.departamento?.nombre ?? '';
    if (filtros.numeroFactura && !f.numero_factura.toLowerCase().includes(filtros.numeroFactura.toLowerCase()) && !(f.numero_radicado ?? '').toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.proveedor && proveedor !== filtros.proveedor) return false;
    if (filtros.areaSolicitante && area !== filtros.areaSolicitante) return false;
    if (filtros.fechaInicio && f.fecha_radicacion && f.fecha_radicacion < filtros.fechaInicio) return false;
    if (filtros.fechaFin && f.fecha_radicacion && f.fecha_radicacion > filtros.fechaFin) return false;
    if (filtros.montoMin && Number(f.valor_total) < Number(filtros.montoMin)) return false;
    if (filtros.montoMax && Number(f.valor_total) > Number(filtros.montoMax)) return false;
    return true;
  });

  const iniciarAccion = (factura: Factura, acc: 'causar' | 'devolver') => {
    setFacturaSeleccionada(factura);
    setAccion(acc);
    setCuentaId('');
    setCentroId('');
    setObservaciones('');
  };

  const cancelar = () => {
    setFacturaSeleccionada(null);
    setAccion(null);
    setCuentaId('');
    setCentroId('');
    setObservaciones('');
  };

  const confirmarCausacion = async () => {
    if (!facturaSeleccionada) return;
    if (!cuentaId) { showToast('err', 'Debe seleccionar una cuenta contable.'); return; }
    setProcesando(true);
    try {
      await facturasService.causar(facturaSeleccionada.id, {
        cuenta_contable_id: Number(cuentaId),
        centro_costo_id: centroId ? Number(centroId) : undefined,
        observaciones: observaciones || undefined,
      });
      showToast('ok', `Factura ${facturaSeleccionada.numero_factura} causada exitosamente.`);
      cancelar();
      cargarDatos();
    } catch {
      showToast('err', 'Error al causar la factura. Intente de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  const confirmarDevolucion = async () => {
    if (!facturaSeleccionada) return;
    if (!observaciones.trim() || observaciones.trim().length < 10) {
      showToast('err', 'El motivo de devolucion es requerido (minimo 10 caracteres).');
      return;
    }
    setProcesando(true);
    try {
      await facturasService.rechazar(facturaSeleccionada.id, observaciones.trim());
      showToast('ok', `Factura ${facturaSeleccionada.numero_factura} devuelta al funcionario.`);
      cancelar();
      cargarDatos();
    } catch {
      showToast('err', 'Error al devolver la factura. Intente de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl text-white font-semibold ${toast.tipo === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.tipo === 'ok' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.msg}
        </motion.div>
      )}

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
              <h1 className="text-white mb-1 text-2xl font-bold">Causar Facturas</h1>
              <p className="text-red-100 text-sm">Registrar el reconocimiento contable de las obligaciones</p>
            </div>
          </div>
          <Button onClick={cargarDatos} variant="outline" className="border-white/30 text-white hover:bg-white/10" disabled={cargando}>
            <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </motion.div>

      {/* Dialog: Causar */}
      <Dialog open={!!facturaSeleccionada && accion === 'causar'} onOpenChange={(o) => { if (!o) cancelar(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" /> Causar Factura
            </DialogTitle>
            <DialogDescription>
              Asigne la cuenta contable y el centro de costo. Se registrara la causacion contable.
            </DialogDescription>
          </DialogHeader>
          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500">Factura</p><p className="font-bold">{facturaSeleccionada.numero_factura}</p></div>
                <div><p className="text-slate-500">Radicado</p><p className="font-bold text-blue-600">{facturaSeleccionada.numero_radicado ?? '-'}</p></div>
                <div><p className="text-slate-500">Proveedor</p><p className="font-bold">{facturaSeleccionada.proveedor?.razon_social}</p></div>
                <div><p className="text-slate-500">Monto</p><p className="font-bold text-green-700">${Number(facturaSeleccionada.valor_total).toLocaleString('es-CO')}</p></div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">* Cuenta Contable (Requerida)</label>
                <select
                  value={cuentaId}
                  onChange={(e) => setCuentaId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-800 text-sm focus:border-green-600 focus:outline-none"
                >
                  <option value="">Seleccionar cuenta contable...</option>
                  {cuentasContables.map((c) => (
                    <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Centro de Costo (Opcional)</label>
                <select
                  value={centroId}
                  onChange={(e) => setCentroId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-800 text-sm focus:border-green-600 focus:outline-none"
                >
                  <option value="">Seleccionar centro de costo...</option>
                  {centrosCosto.map((c) => (
                    <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Observaciones (Opcional)</label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones sobre la causacion..."
                  className="min-h-20 border-slate-300"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={cancelar} variant="outline" className="flex-1" disabled={procesando}>Cancelar</Button>
                <Button onClick={confirmarCausacion} disabled={procesando} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  {procesando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</> : <><Send className="w-4 h-4 mr-2" />Causar</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Devolver */}
      <Dialog open={!!facturaSeleccionada && accion === 'devolver'} onOpenChange={(o) => { if (!o) cancelar(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" /> Devolver Factura
            </DialogTitle>
            <DialogDescription>Indique el motivo de devolucion. El funcionario recibira la observacion.</DialogDescription>
          </DialogHeader>
          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500">Factura</p><p className="font-bold">{facturaSeleccionada.numero_factura}</p></div>
                <div><p className="text-slate-500">Proveedor</p><p className="font-bold">{facturaSeleccionada.proveedor?.razon_social}</p></div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-red-700">* Motivo de Devolucion (Requerido)</label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Especifique claramente que debe corregirse..."
                  className="min-h-28 border-red-300 focus:border-red-600"
                />
                <p className="text-xs text-slate-500">Minimo 10 caracteres.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={cancelar} variant="outline" className="flex-1" disabled={procesando}>Cancelar</Button>
                <Button onClick={confirmarDevolucion} disabled={procesando} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  {procesando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</> : <><Send className="w-4 h-4 mr-2" />Devolver</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal detalle */}
      <FacturaDetailModal factura={modalFactura} isOpen={!!modalFactura} onClose={() => setModalFactura(null)} />

      {/* Filtros */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <TableFilters
            filters={filtros}
            onFilterChange={setFiltros}
            estados={[]}
            proveedores={Array.from(new Set(facturas.map((f) => f.proveedor?.razon_social ?? '').filter(Boolean)))}
            areas={Array.from(new Set(facturas.map((f) => f.departamento?.nombre ?? '').filter(Boolean)))}
            showMontoFilter={true}
            showFechaFilter={true}
            showAreaFilter={true}
          />
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Facturas Radicadas Pendientes de Causacion</h2>
              <p className="text-sm text-slate-500">{facturasFiltradas.length} factura(s) en estado <em>Radicada</em></p>
            </div>
          </div>

          {cargando ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mr-3" /> Cargando facturas...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-red-500 gap-2">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          ) : facturasFiltradas.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay facturas pendientes de causacion</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">N° Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">N° Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor / NIT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Area</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha Radicacion</TableHead>
                    <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                    <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturasFiltradas.map((factura) => {
                    const dias = factura.dias_transcurridos ?? 0;
                    const diasColor = dias >= 17 ? 'text-red-600 font-bold' : dias >= 10 ? 'text-orange-600 font-semibold' : 'text-green-700';
                    return (
                      <TableRow key={factura.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-800">{factura.numero_factura}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 border border-blue-200">{factura.numero_radicado ?? '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-800">{factura.proveedor?.razon_social}</p>
                          <p className="text-xs text-slate-500 font-mono">{factura.proveedor?.nit}</p>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">${Number(factura.valor_total).toLocaleString('es-CO')}</TableCell>
                        <TableCell className="text-slate-600">{factura.departamento?.nombre}</TableCell>
                        <TableCell className="text-slate-600">{factura.fecha_radicacion ?? '-'}</TableCell>
                        <TableCell><span className={diasColor}>{dias}d</span></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => setModalFactura(facturaToDetail(factura, docsMap[factura.id] ?? [], cuentasContables, centrosCosto))} className="border-slate-300 text-slate-700">
                              <Eye className="w-3 h-3 mr-1" /> Detalle
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => iniciarAccion(factura, 'devolver')} className="border-red-300 text-red-700 hover:bg-red-50">
                              <XCircle className="w-3 h-3 mr-1" /> Devolver
                            </Button>
                            <Button size="sm" onClick={() => iniciarAccion(factura, 'causar')} className="bg-green-600 hover:bg-green-700 text-white">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Causar
                            </Button>
                          </div>
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
    </div>
  );
}
