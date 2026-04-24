import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, Eye, FileText, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { facturasService } from '../../../services/financiero';
import type { Factura } from '../../../models/financiero';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';

type PendingRow = {
  id: string;
  numeroFactura?: string;
  proveedor: string;
  nit: string;
  contacto: string;
  tipoDocumento: string;
  descripcion: string;
  valorTotal: number;
  fechaFactura: string;
  fechaRecepcion: string;
  areaSolicitante: string;
  dias: number;
  slaMax: number;
  nivelRiesgo: 'verde' | 'amarillo' | 'vencido';
  accion: string;
  proveedorId: number;
  departamentoId?: number;
  departamentoNombre?: string;
};

function mapFacturaToPendingRow(f: Factura): PendingRow {
  const dias = Math.max(0, Number(f.dias_transcurridos || 0));
  const riesgo: PendingRow['nivelRiesgo'] = dias > 2 ? 'vencido' : dias > 0 ? 'amarillo' : 'verde';
  const contacto = [f.proveedor?.email, f.proveedor?.telefono].filter(Boolean).join(' | ');
  const area = f.departamento?.nombre?.trim() || '';

  return {
    id: String(f.id),
    numeroFactura: f.numero_factura || undefined,
    proveedor: f.proveedor?.razon_social || 'Proveedor sin nombre',
    nit: f.proveedor?.nit || 'Sin NIT',
    contacto: contacto || 'Sin datos de contacto',
    tipoDocumento: f.tipo_documento || 'Factura',
    descripcion: f.descripcion || 'Sin descripcion',
    valorTotal: Number(f.valor_total || 0),
    fechaFactura: f.fecha_factura || '',
    fechaRecepcion: f.fecha_recepcion || '',
    areaSolicitante: area || 'Sin area asignada',
    dias,
    slaMax: 2,
    nivelRiesgo: riesgo,
    accion: area
      ? riesgo === 'vencido'
        ? 'URGENTE: completar registro y documentos'
        : 'Completar registro y subir documentos'
      : 'Asignar area y completar registro',
    proveedorId: Number(f.proveedor_id),
    departamentoId: f.departamento?.id,
    departamentoNombre: area || undefined,
  };
}

export default function MisPendientes() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SharedFacturaDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await facturasService.getPendientes();
        const apiRows = Array.isArray(response) ? response.map(mapFacturaToPendingRow) : [];
        setRows(apiRows);
      } catch {
        setRows([]);
        setLoadError('No fue posible consultar pendientes del usuario.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const vencidas = useMemo(() => rows.filter(r => r.nivelRiesgo === 'vencido').length, [rows]);
  const proximas = useMemo(() => rows.filter(r => r.nivelRiesgo === 'amarillo').length, [rows]);

  const riskDotClass = (risk: PendingRow['nivelRiesgo']) => {
    if (risk === 'vencido') return 'bg-red-600';
    if (risk === 'amarillo') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const selectedRow = rows.find((r) => r.id === selectedId) || null;

  useEffect(() => {
    if (!openDetail || !selectedId) return;

    const loadDetalle = async () => {
      setDetailLoading(true);
      try {
        const seguimiento = await facturasService.getSeguimiento(Number(selectedId));
        const factura = seguimiento?.factura as Factura | null;

        if (!factura) {
          setSelectedDetail(null);
          return;
        }

        const contactoProveedor = [factura.proveedor?.email, factura.proveedor?.telefono].filter(Boolean).join(' | ');

        setSelectedDetail({
          id: String(factura.id),
          numeroFactura: factura.numero_factura || `PEND-${factura.id}`,
          proveedor: factura.proveedor?.razon_social || 'Proveedor sin nombre',
          nit: factura.proveedor?.nit || 'Sin NIT',
          contactoProveedor,
          tipoDocumento: factura.tipo_documento,
          valorSubtotal: Number(factura.valor_subtotal || 0),
          valorIva: Number(factura.valor_iva || 0),
          valorTotal: Number(factura.valor_total || 0),
          fechaFactura: factura.fecha_factura || '',
          fechaRecepcion: factura.fecha_recepcion || '',
          areaSolicitante: factura.departamento?.nombre || 'Sin area asignada',
          estado: factura.estado || 'Recibida',
          diasTranscurridos: Math.max(0, Number(factura.dias_transcurridos || 0)),
          numeroRadicado: factura.numero_radicado || undefined,
          numeroProcesoPago: factura.numero_proceso_pago || undefined,
          descripcion: factura.descripcion || undefined,
          observaciones: factura.observaciones || undefined,
          cuentaBancariaProveedor: factura.cuenta_bancaria_proveedor || undefined,
          nivelRiesgo:
            Number(factura.dias_transcurridos || 0) > 2
              ? 'vencido'
              : Number(factura.dias_transcurridos || 0) > 0
                ? 'amarillo'
                : 'verde',
          documentos: (factura.documentos || []).map((doc) => ({
            id: String(doc.id),
            tipo: doc.tipo_documento,
            nombre: doc.nombre_archivo,
            fecha: doc.fecha_carga,
            verificado: doc.verificado,
            url: doc.archivo_url || doc.url_storage || undefined,
          })),
        });
      } catch {
        if (selectedRow) {
          setSelectedDetail({
            id: selectedRow.id,
            numeroFactura: selectedRow.numeroFactura || `PEND-${selectedRow.id}`,
            proveedor: selectedRow.proveedor,
            valorTotal: selectedRow.valorTotal,
            fechaFactura: selectedRow.fechaFactura,
            fechaRecepcion: selectedRow.fechaRecepcion,
            areaSolicitante: selectedRow.areaSolicitante,
            estado: 'Recibida',
            diasTranscurridos: selectedRow.dias,
            descripcion: selectedRow.descripcion,
            nit: selectedRow.nit,
            nivelRiesgo:
              selectedRow.nivelRiesgo === 'vencido'
                ? 'vencido'
                : selectedRow.nivelRiesgo === 'amarillo'
                  ? 'amarillo'
                  : 'verde',
          });
        }
      } finally {
        setDetailLoading(false);
      }
    };

    void loadDetalle();
  }, [openDetail, selectedId, selectedRow]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Mis Pendientes</h2>
            <p className="text-red-100">Facturas recibidas que debo registrar en el sistema (SLA: 2 dias)</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Pendientes</p>
              <p className="text-4xl font-bold text-slate-800 mt-1">{rows.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl border border-purple-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-semibold">Facturas VENCIDAS</p>
              <p className="text-4xl font-bold text-purple-800 mt-1">{vencidas}</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-purple-700" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-xl border border-yellow-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-semibold">Proximas a Vencer</p>
              <p className="text-4xl font-bold text-yellow-800 mt-1">{proximas}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-x-auto">
        {loadError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {loadError}
          </div>
        )}
        <h3 className="text-xl font-semibold text-slate-800 mb-1">Facturas Pendientes de Registro</h3>
        <p className="text-slate-500 mb-5">Vista resumida con campos esenciales. El detalle completo está en “Ver”.</p>

        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="bg-slate-50 border border-slate-200">
              <th className="py-3 px-3 text-left">SLA</th>
              <th className="py-3 px-3 text-left">Factura</th>
              <th className="py-3 px-3 text-left">Proveedor</th>
              <th className="py-3 px-3 text-left">Tipo</th>
              <th className="py-3 px-3 text-left">Monto</th>
              <th className="py-3 px-3 text-left">Recepción</th>
              <th className="py-3 px-3 text-left">Dias</th>
              <th className="py-3 px-3 text-left">Estado</th>
              <th className="py-3 px-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={8}>Cargando pendientes...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={8}>No hay pendientes para mostrar.</td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${riskDotClass(row.nivelRiesgo)}`} />
                    {row.nivelRiesgo === 'vencido' && <AlertCircle className="w-4 h-4 text-red-700" />}
                  </div>
                </td>
                <td className="p-3 text-slate-700 font-mono">{row.numeroFactura || `PEND-${row.id}`}</td>
                <td className="p-3 text-slate-700">
                  <div className="font-medium text-slate-800">{row.proveedor}</div>
                  <div className="text-xs text-slate-500 font-mono">NIT: {row.nit}</div>
                </td>
                <td className="p-3 text-slate-700">{row.tipoDocumento}</td>
                <td className="p-3 font-semibold text-slate-800">${row.valorTotal.toLocaleString('es-CO')}</td>
                <td className="p-3 text-slate-700">{row.fechaRecepcion || 'Sin fecha'}</td>
                <td className="p-3 font-semibold">
                  <span className={row.nivelRiesgo === 'vencido' ? 'text-red-700' : row.nivelRiesgo === 'amarillo' ? 'text-yellow-700' : 'text-green-700'}>
                    {row.dias}d / {row.slaMax}d
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs border ${row.nivelRiesgo === 'vencido' ? 'bg-red-100 text-red-800 border-red-300' : row.nivelRiesgo === 'amarillo' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                    {row.accion}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigate('/financiero/funcionario/registrar', {
                          state: {
                            prefillFromPendiente: {
                              facturaId: Number(row.id),
                              snapshot: {
                                numeroFactura: row.numeroFactura,
                                proveedorId: row.proveedorId,
                                proveedorNombre: row.proveedor,
                                nit: row.nit,
                                tipoDocumento: row.tipoDocumento,
                                valorTotal: row.valorTotal,
                                fechaFactura: row.fechaFactura,
                                fechaRecepcion: row.fechaRecepcion,
                                departamentoId: row.departamentoId,
                                departamentoNombre: row.departamentoNombre,
                                descripcion: row.descripcion,
                                observaciones: '',
                              },
                            },
                          },
                        });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-700"
                    >
                      Registrar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedId(row.id);
                        setOpenDetail(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                    >
                      <Eye className="w-4 h-4" /> Ver
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FacturaDetailModal
        isOpen={openDetail}
        onClose={() => {
          setOpenDetail(false);
          setSelectedDetail(null);
        }}
        factura={selectedDetail}
      />

      {openDetail && detailLoading && (
        <div className="text-sm text-slate-500">Cargando detalles completos de la factura...</div>
      )}
    </div>
  );
}
