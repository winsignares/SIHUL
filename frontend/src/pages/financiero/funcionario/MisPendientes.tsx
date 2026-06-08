import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, Eye, FileText, Search, TrendingUp, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { facturasService } from '../../../services/financiero';
import type { Factura } from '../../../models/financiero/core.models';
import type { FuncionarioPendingRow } from '../../../models/financiero/funcionario';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import { displayDate, displayText } from '../../../share/field-placeholders';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Label } from '../../../share/label';
import { Textarea } from '../../../share/textarea';

function mapFacturaToPendingRow(f: Factura): FuncionarioPendingRow {
  const dias = Math.max(0, Number(f.dias_transcurridos || 0));
  const riesgo: FuncionarioPendingRow['nivelRiesgo'] = dias > 2 ? 'vencido' : dias > 0 ? 'amarillo' : 'verde';
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
    observaciones: f.observaciones || '',
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
  const [rows, setRows] = useState<FuncionarioPendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SharedFacturaDetail | null>(null);
  const [rechazarOpen, setRechazarOpen] = useState(false);
  const [rechazarRow, setRechazarRow] = useState<FuncionarioPendingRow | null>(null);
  const [rechazarMotivo, setRechazarMotivo] = useState('');
  const [rechazarError, setRechazarError] = useState<string | null>(null);
  const [rechazarLoading, setRechazarLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState<'oldest' | 'newest'>('oldest');

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
  const filteredRows = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (!normalized) return true;
        return [
          row.numeroFactura,
          row.proveedor,
          row.nit,
          row.tipoDocumento,
          row.observaciones,
          row.descripcion,
          row.areaSolicitante,
        ].some((value) => String(value || '').toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        const aTime = new Date(a.fechaRecepcion || a.fechaFactura || 0).getTime();
        const bTime = new Date(b.fechaRecepcion || b.fechaFactura || 0).getTime();
        return orderBy === 'oldest' ? aTime - bTime : bTime - aTime;
      });
  }, [orderBy, rows, searchTerm]);

  const riskDotClass = (risk: FuncionarioPendingRow['nivelRiesgo']) => {
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

  const abrirRechazo = (row: FuncionarioPendingRow) => {
    setRechazarRow(row);
    setRechazarMotivo('');
    setRechazarError(null);
    setRechazarOpen(true);
  };

  const confirmarRechazo = async () => {
    if (!rechazarRow) return;

    const motivo = rechazarMotivo.trim();
    if (motivo.length < 10) {
      setRechazarError('Describe el motivo (mínimo 10 caracteres).');
      return;
    }

    setRechazarLoading(true);
    try {
      await facturasService.rechazar(Number(rechazarRow.id), motivo);
      setRows((prev) => prev.filter((row) => row.id !== rechazarRow.id));
      toast.success('Factura rechazada y enviada a corrección del proveedor.');
      setRechazarOpen(false);
      setRechazarRow(null);
      setRechazarMotivo('');
    } catch {
      setRechazarError('No fue posible rechazar la factura. Intenta nuevamente.');
    } finally {
      setRechazarLoading(false);
    }
  };

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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600">Por registrar</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{rows.length}</p>
              <p className="text-xs text-slate-500 mt-1">Facturas recibidas pendientes de gestión</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-semibold">Fuera de SLA</p>
              <p className="text-3xl font-bold text-red-800 mt-1">{vencidas}</p>
              <p className="text-xs text-red-700/80 mt-1">Requieren registro prioritario</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-700" />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-semibold">Por vencer</p>
              <p className="text-3xl font-bold text-amber-800 mt-1">{proximas}</p>
              <p className="text-xs text-amber-700/80 mt-1">Conviene atenderlas pronto</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-700" />
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
        <p className="text-slate-500 mb-5">Ordenadas de la factura más antigua a la más reciente para priorizar el registro.</p>

        <div className="mb-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por proveedor, NIT, factura o descripción"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <select
            value={orderBy}
            onChange={(event) => setOrderBy(event.target.value as 'oldest' | 'newest')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          >
            <option value="oldest">Más antigua primero</option>
            <option value="newest">Más reciente primero</option>
          </select>
        </div>

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
                <td className="p-4 text-slate-500" colSpan={9}>Cargando pendientes...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={9}>No hay pendientes que coincidan con la búsqueda.</td>
              </tr>
            ) : filteredRows.map((row) => (
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
                  <div className="text-xs text-slate-500 font-mono">NIT: {displayText(row.nit)}</div>
                </td>
                <td className="p-3 text-slate-700">{displayText(row.tipoDocumento)}</td>
                <td className="p-3 font-semibold text-slate-800">${row.valorTotal.toLocaleString('es-CO')}</td>
                <td className="p-3 text-slate-700">{displayDate(row.fechaRecepcion)}</td>
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
                                observaciones: row.observaciones,
                              },
                            },
                          },
                        });
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      title="Registrar factura"
                      aria-label="Registrar factura"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => abrirRechazo(row)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                      title="Rechazar factura"
                      aria-label="Rechazar factura"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedId(row.id);
                        setOpenDetail(true);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                      title="Ver detalle"
                      aria-label="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
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

      <Dialog open={rechazarOpen} onOpenChange={setRechazarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar factura</DialogTitle>
            <DialogDescription>
              Este rechazo se registrará en el historial y la factura volverá al proveedor para corrección.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rechazo-motivo">Motivo del rechazo</Label>
            <Textarea
              id="rechazo-motivo"
              value={rechazarMotivo}
              onChange={(event) => {
                setRechazarMotivo(event.target.value);
                setRechazarError(null);
              }}
              placeholder="Describe claramente la razón del rechazo (mínimo 10 caracteres)."
              rows={4}
            />
            {rechazarError && <p className="text-sm text-red-600">{rechazarError}</p>}
          </div>
          <DialogFooter>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => setRechazarOpen(false)}
              disabled={rechazarLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
              onClick={confirmarRechazo}
              disabled={rechazarLoading}
            >
              {rechazarLoading ? 'Rechazando...' : 'Confirmar rechazo'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
