import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Button } from '../../../share/button';
import { AlertCircle, Eye, ShieldCheck, FileSearch, CheckCircle2 } from 'lucide-react';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';
import { Pagination } from '../../../components/common/Pagination';

const ITEMS_PER_PAGE = 5;

interface FacturaPendiente {
  id: string;
  facturaId: number;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  proveedor: string;
  valorTotal: number;
  fechaAlistamiento: string;
  diasTranscurridos: number;
  diasMaximos: number;
  nivelRiesgo: 'verde' | 'amarillo' | 'rojo' | 'vencido';
  accionRequerida: string;
  areaSolicitante: string;
  cuentaContable: string;
  centroCosto: string;
  estado: string;
  descripcion?: string;
}

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

const getNivelRiesgo = (dias: number, max: number): FacturaPendiente['nivelRiesgo'] => {
  if (dias >= max) return 'vencido';
  if (dias >= Math.round(max * 0.8)) return 'rojo';
  if (dias >= Math.round(max * 0.6)) return 'amarillo';
  return 'verde';
};

const mapFactura = (f: APIFactura, diasMaximos: number): FacturaPendiente => {
  const diasTranscurridos = Math.max(0, Number(f.dias_transcurridos || 0));
  return {
    id: String(f.id),
    facturaId: Number(f.id),
    numeroFactura: f.numero_factura || `FAC-${f.id}`,
    numeroRadicado: f.numero_radicado || 'Sin radicado',
    numeroProcesoPago: f.numero_proceso_pago || 'Sin proceso',
    proveedor: f.proveedor?.razon_social || 'Sin Asignar',
    valorTotal: Number(f.valor_total || 0),
    fechaAlistamiento: f.fecha_alistamiento || 'Sin fecha',
    diasTranscurridos,
    diasMaximos,
    nivelRiesgo: getNivelRiesgo(diasTranscurridos, diasMaximos),
    accionRequerida: 'Realizar control previo de auditoria',
    areaSolicitante: f.departamento?.nombre || 'Sin Asignar',
    cuentaContable: f.cuenta_contable ? `${f.cuenta_contable.codigo} - ${f.cuenta_contable.nombre}` : 'Sin cuenta',
    centroCosto: f.centro_costo ? `${f.centro_costo.codigo} - ${f.centro_costo.nombre}` : 'Sin centro',
    estado: f.estado,
    descripcion: f.descripcion,
  };
};

export default function MisPendientes() {
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [facturasPendientes, setFacturasPendientes] = useState<FacturaPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await facturasService.getAll({ estado: 'Alistada', limit: 200 });
        const rows = toList<APIFactura>(response).map((f) => mapFactura(f, 24));
        setFacturasPendientes(rows);
      } catch {
        setFacturasPendientes([]);
        setLoadError('No fue posible cargar las facturas alistadas.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleVerDetalle = (factura: FacturaPendiente) => {
    setFacturaSeleccionada({
      numeroFactura: factura.numeroFactura,
      numeroRadicado: factura.numeroRadicado,
      numeroProcesoPago: factura.numeroProcesoPago,
      proveedor: factura.proveedor,
      valorTotal: factura.valorTotal,
      areaSolicitante: factura.areaSolicitante,
      estado: factura.estado,
      diasTranscurridos: factura.diasTranscurridos,
      fechaRecepcion: factura.fechaAlistamiento,
      descripcion: factura.descripcion,
      observaciones: factura.accionRequerida,
      cuentaContable: factura.cuentaContable,
      centroCosto: factura.centroCosto,
      auditoriaView: true,
      auditoriaNotas: 'Revise causacion contable, soportes y distribucion correcta en el rubro antes de aprobar.',
      nivelRiesgo: factura.nivelRiesgo,
    });
    setMostrarDetalle(true);

    setCargandoDetalle(true);
    void (async () => {
      try {
        const detail = await facturasService.getById(factura.facturaId);
        const documentos = (detail.documentos || []).map((doc) => ({
          id: doc.id ? String(doc.id) : undefined,
          nombre: doc.nombre_archivo,
          tipo: doc.tipo_documento,
          fecha: doc.fecha_carga,
          verificado: doc.verificado,
          url: doc.archivo_url || doc.url_storage || null,
        }));

        setFacturaSeleccionada((prev) => prev ? {
          ...prev,
          documentos,
          observaciones: detail.observaciones || prev.observaciones,
        } : prev);
      } finally {
        setCargandoDetalle(false);
      }
    })();
  };

  const totalPendientes = facturasPendientes.length;
  const totalPages = Math.max(1, Math.ceil(facturasPendientes.length / ITEMS_PER_PAGE));
  const facturasPaginadas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return facturasPendientes.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, facturasPendientes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [facturasPendientes.length]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);
  const enTiempoCount = facturasPendientes.filter((f) => f.nivelRiesgo === 'verde').length;
  const proximasVencerCount = facturasPendientes.filter((f) => f.nivelRiesgo === 'amarillo' || f.nivelRiesgo === 'rojo').length;

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
              <ShieldCheck className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Mis Pendientes</h1>
              <p className="text-red-100 text-sm">Facturas alistadas para control previo (SLA de proceso: 24 dias)</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">Total Por Revisar</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{totalPendientes}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <FileSearch className="w-6 h-6 text-yellow-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-0 shadow-lg border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-semibold">En Tiempo</p>
                    <p className="text-3xl font-bold text-green-800 mt-1">{enTiempoCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-lg border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-700 text-sm font-semibold">Proximas a Vencer</p>
                    <p className="text-3xl font-bold text-orange-800 mt-1">{proximasVencerCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-lg bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Mi responsabilidad en control previo</h3>
                  <p className="text-sm text-blue-700">
                    No revisa disponibilidad presupuestal. Si revisa causacion contable, soportes y distribucion correcta en rubro.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800">Facturas Pendientes de Control Previo</CardTitle>
              <CardDescription>Facturas alistadas para revisar antes del siguiente paso del flujo financiero</CardDescription>
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
                      <TableHead className="font-semibold text-slate-700">Proceso Pago</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                      <TableHead className="font-semibold text-slate-700">Centro Costo</TableHead>
                      <TableHead className="font-semibold text-slate-700">Area</TableHead>
                      <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                      <TableHead className="font-semibold text-slate-700">Accion</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-slate-500 py-6">Cargando facturas alistadas...</TableCell>
                      </TableRow>
                    ) : facturasPendientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-slate-500 py-6">No hay facturas alistadas para auditoría.</TableCell>
                      </TableRow>
                    ) : facturasPaginadas.map((factura, index) => {
                      const colorRiesgo =
                        factura.nivelRiesgo === 'vencido'
                          ? 'bg-purple-700'
                          : factura.nivelRiesgo === 'rojo'
                            ? 'bg-orange-500'
                            : factura.nivelRiesgo === 'amarillo'
                              ? 'bg-yellow-500'
                              : 'bg-green-500';

                      return (
                        <motion.tr key={factura.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-slate-50 transition-colors">
                          <TableCell><div className={`w-3 h-3 rounded-full ${colorRiesgo}`} /></TableCell>
                          <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                          <TableCell><Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border font-mono text-xs">{factura.numeroProcesoPago}</Badge></TableCell>
                          <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                          <TableCell className="font-semibold text-slate-800">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                          <TableCell><Badge className="bg-purple-100 text-purple-700 border-purple-200 border font-mono text-xs">{factura.cuentaContable}</Badge></TableCell>
                          <TableCell><Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 border font-mono text-xs">{factura.centroCosto}</Badge></TableCell>
                          <TableCell className="text-slate-600">{factura.areaSolicitante}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 font-bold text-sm text-green-700">{factura.diasTranscurridos}d / {factura.diasMaximos}d</span>
                          </TableCell>
                          <TableCell><Badge className="bg-blue-100 text-blue-800 border-blue-300 border text-xs">{factura.accionRequerida}</Badge></TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => handleVerDetalle(factura)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
                              <Eye className="w-4 h-4 mr-1" />Revisar
                            </Button>
                          </TableCell>
                        </motion.tr>
                    );
                    })}
                  </TableBody>
                </Table>
              </div>
              {!loading && facturasPendientes.length > 0 && (
                <div className="mt-5">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={facturasPendientes.length}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <FacturaDetailModal
        factura={facturaSeleccionada}
        isOpen={mostrarDetalle}
        onClose={() => {
          if (cargandoDetalle) return;
          setMostrarDetalle(false);
          setFacturaSeleccionada(null);
        }}
      />
    </>
  );
}
