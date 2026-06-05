import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Button } from '../../../share/button';
import { Eye, Clock, FileCheck, Send, FileOutput } from 'lucide-react';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';

interface FacturaPendiente {
  id: string;
  facturaId: number;
  numeroFactura: string;
  numeroRadicado: string;
  proveedor: string;
  valorTotal: number;
  fechaCausacion: string;
  diasTranscurridos: number;
  diasMaximos: number;
  nivelRiesgo: 'verde' | 'amarillo' | 'naranja' | 'vencido';
  accionRequerida: string;
  areaSolicitante: string;
  estado: string;
  cuentaContable: string;
  descripcion?: string;
}

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

const getNivelRiesgo = (dias: number, max: number): FacturaPendiente['nivelRiesgo'] => {
  if (dias >= max) return 'vencido';
  if (dias >= Math.round(max * 0.8)) return 'naranja';
  if (dias >= Math.round(max * 0.6)) return 'amarillo';
  return 'verde';
};

const mapFactura = (f: APIFactura, diasMaximos: number, accionRequerida: string): FacturaPendiente => {
  const diasTranscurridos = Math.max(0, Number(f.dias_transcurridos || 0));
  return {
    id: String(f.id),
    facturaId: Number(f.id),
    numeroFactura: f.numero_factura || `FAC-${f.id}`,
    numeroRadicado: f.numero_radicado || 'Sin radicado',
    proveedor: f.proveedor?.razon_social || 'Sin Asignar',
    valorTotal: Number(f.valor_total || 0),
    fechaCausacion: f.fecha_causacion || f.fecha_alistamiento || f.fecha_pago_aplicado || 'Sin fecha',
    diasTranscurridos,
    diasMaximos,
    nivelRiesgo: getNivelRiesgo(diasTranscurridos, diasMaximos),
    accionRequerida,
    areaSolicitante: f.departamento?.nombre || 'Sin Asignar',
    estado: f.estado,
    cuentaContable: f.cuenta_contable ? `${f.cuenta_contable.codigo} - ${f.cuenta_contable.nombre}` : 'Sin cuenta',
    descripcion: f.descripcion,
  };
};

export default function MisPendientes() {
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const [facturasPendientesAlistar, setFacturasPendientesAlistar] = useState<FacturaPendiente[]>([]);
  const [facturasAprobadasAuditoria, setFacturasAprobadasAuditoria] = useState<FacturaPendiente[]>([]);
  const [pagosPendientesComprobante, setPagosPendientesComprobante] = useState<FacturaPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPendientes = async () => {
    const [causadas, detenidas, aprobadas, pagos] = await Promise.all([
      facturasService.getAll({ estado: 'Causada', limit: 200 }),
      facturasService.getAll({ estado: 'Detenida', limit: 200 }),
      facturasService.getAll({ estado: 'Aprobada Auditoría', limit: 200 }),
      facturasService.getAll({ estado: 'Pago Aplicado', limit: 200 }),
    ]);

    const alistar = [...toList<APIFactura>(causadas), ...toList<APIFactura>(detenidas)]
      .map((f) => mapFactura(f, 18, 'Alistar pago y generar proceso'));
    const enviar = toList<APIFactura>(aprobadas)
      .map((f) => mapFactura(f, 18, 'Enviar a Direccion Financiera'));
    const comprobantes = toList<APIFactura>(pagos)
      .map((f) => mapFactura(f, 24, 'Generar comprobante de egreso'));

    return { alistar, enviar, comprobantes };
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { alistar, enviar, comprobantes } = await loadPendientes();
        setFacturasPendientesAlistar(alistar);
        setFacturasAprobadasAuditoria(enviar);
        setPagosPendientesComprobante(comprobantes);
      } catch {
        setFacturasPendientesAlistar([]);
        setFacturasAprobadasAuditoria([]);
        setPagosPendientesComprobante([]);
        setLoadError('No fue posible cargar los pendientes de tesoreria.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const todasFacturas = [...facturasPendientesAlistar, ...facturasAprobadasAuditoria, ...pagosPendientesComprobante];

  const handleVerDetalle = (factura: FacturaPendiente) => {
    setFacturaSeleccionada({
      numeroFactura: factura.numeroFactura,
      numeroRadicado: factura.numeroRadicado,
      proveedor: factura.proveedor,
      valorTotal: factura.valorTotal,
      areaSolicitante: factura.areaSolicitante,
      estado: factura.estado,
      diasTranscurridos: factura.diasTranscurridos,
      fechaRecepcion: factura.fechaCausacion,
      descripcion: factura.descripcion,
      observaciones: factura.accionRequerida,
      cuentaContable: factura.cuentaContable,
      nivelRiesgo:
        factura.nivelRiesgo === 'vencido'
          ? 'vencido'
          : factura.nivelRiesgo === 'naranja'
            ? 'rojo'
            : factura.nivelRiesgo === 'amarillo'
              ? 'amarillo'
              : 'verde',
    });
    setMostrarDetalle(true);
  };

  const vencidasCount = todasFacturas.filter((f) => f.nivelRiesgo === 'vencido').length;
  const proximasVencerCount = todasFacturas.filter((f) => f.nivelRiesgo === 'amarillo' || f.nivelRiesgo === 'naranja').length;

  const renderTabla = (titulo: string, descripcion: string, rows: FacturaPendiente[], icon: React.ReactNode, delay: number) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center gap-2">{icon}{titulo}</CardTitle>
          <CardDescription>{descripcion}</CardDescription>
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
                  <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                  <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                  <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                  <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                  <TableHead className="font-semibold text-slate-700">Accion</TableHead>
                  <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-slate-500 py-6">Cargando pendientes...</TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-slate-500 py-6">No hay registros con este criterio.</TableCell>
                  </TableRow>
                ) : rows.map((factura, index) => {
                  const colorRiesgo =
                    factura.nivelRiesgo === 'vencido'
                      ? 'bg-red-700'
                      : factura.nivelRiesgo === 'naranja'
                        ? 'bg-orange-500'
                        : factura.nivelRiesgo === 'amarillo'
                          ? 'bg-yellow-500'
                          : 'bg-green-500';

                  return (
                    <motion.tr
                      key={factura.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell><div className={`w-3 h-3 rounded-full ${colorRiesgo}`} /></TableCell>
                      <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                      <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                      <TableCell className="font-semibold text-slate-800">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 border font-mono text-xs">{factura.cuentaContable}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 font-bold text-sm text-slate-700">{factura.diasTranscurridos}d / {factura.diasMaximos}d</span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 border text-xs">{factura.accionRequerida}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerDetalle(factura)}
                          className="border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

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
              <Clock className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Mis Pendientes - Tesoreria</h1>
              <p className="text-red-100 text-sm">Alistamiento, envio a Direccion Financiera y cierre por comprobante</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-lg border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <p className="text-blue-700 text-sm font-semibold">Por Alistar</p>
              <p className="text-3xl font-bold text-blue-800 mt-1">{facturasPendientesAlistar.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <p className="text-purple-700 text-sm font-semibold">Por Enviar</p>
              <p className="text-3xl font-bold text-purple-800 mt-1">{facturasAprobadasAuditoria.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg border-green-200 bg-green-50">
            <CardContent className="p-6">
              <p className="text-green-700 text-sm font-semibold">Comprobantes</p>
              <p className="text-3xl font-bold text-green-800 mt-1">{pagosPendientesComprobante.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-700 text-sm font-semibold">Vencidas</p>
              <p className="text-3xl font-bold text-red-800 mt-1">{vencidasCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <p className="text-orange-700 text-sm font-semibold">Proximas</p>
              <p className="text-3xl font-bold text-orange-800 mt-1">{proximasVencerCount}</p>
            </CardContent>
          </Card>
        </div>

        {renderTabla(
          '1. Facturas Pendientes de Alistamiento',
          'Facturas causadas por Contabilidad para preparar proceso de pago',
          facturasPendientesAlistar,
          <FileCheck className="w-5 h-5 text-blue-600" />,
          0.2
        )}

        {renderTabla(
          '2. Facturas Aprobadas para Enviar a Direccion Financiera',
          'Facturas aprobadas por Auditoria pendientes de envio formal RF06',
          facturasAprobadasAuditoria,
          <Send className="w-5 h-5 text-purple-600" />,
          0.25
        )}

        {renderTabla(
          '3. Pagos Aplicados Pendientes de Comprobante',
          'Pagos ya ejecutados en banco para cierre con comprobante de egreso',
          pagosPendientesComprobante,
          <FileOutput className="w-5 h-5 text-green-600" />,
          0.3
        )}
      </div>

      <FacturaDetailModal
        factura={facturaSeleccionada}
        isOpen={mostrarDetalle}
        onClose={() => {
          setMostrarDetalle(false);
          setFacturaSeleccionada(null);
        }}
      />
    </>
  );
}
