import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
} from 'lucide-react';
import { facturasService } from '../../../services/financiero';
import type { Factura, HistorialFactura } from '../../../models/financiero';

const formatMoney = (val: any) => {
  const num = Number(val) || 0;
  return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const ESTADO_STEP: Record<string, number> = {
  'Recibida': 1,
  'Registrada': 2,
  'Radicada': 3,
  'Causada': 4,
  'Alistada': 5,
  'Aprobada Auditoría': 6,
  'Cargada': 7,
  'Revisada Dir. Financiera': 8,
  'Enviada Rectoría': 9,
  'Autorizada': 10,
  'Pago Aplicado': 11,
  'Pagada': 12,
};

const ESTADO_COLOR: Record<string, string> = {
  'Recibida':               'bg-blue-100 text-blue-700',
  'Registrada':             'bg-indigo-100 text-indigo-700',
  'Radicada':               'bg-purple-100 text-purple-700',
  'Causada':                'bg-yellow-100 text-yellow-700',
  'Alistada':               'bg-orange-100 text-orange-700',
  'Aprobada Auditoría':     'bg-green-100 text-green-700',
  'Rechazada Auditoría':    'bg-red-100 text-red-700',
  'Cargada':                'bg-cyan-100 text-cyan-700',
  'Revisada Dir. Financiera': 'bg-teal-100 text-teal-700',
  'Enviada Rectoría':       'bg-violet-100 text-violet-700',
  'Autorizada':             'bg-green-200 text-green-800',
  'Pago Aplicado':          'bg-emerald-100 text-emerald-700',
  'Pagada':                 'bg-green-300 text-green-900',
  'Devuelta':               'bg-amber-100 text-amber-700',
  'Rechazada':              'bg-red-200 text-red-800',
  'Anulada':                'bg-slate-100 text-slate-600',
};

const PROCESO_STEPS = [
  { label: 'Recibida', icon: Clock },
  { label: 'Registrada', icon: FileText },
  { label: 'Radicada', icon: FileText },
  { label: 'Causada', icon: CheckCircle2 },
  { label: 'Alistada', icon: CheckCircle2 },
  { label: 'Aprobada', icon: CheckCircle2 },
  { label: 'Autorizada', icon: CheckCircle2 },
  { label: 'Pagada', icon: CheckCircle2 },
];

export default function FacturaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [factura, setFactura] = useState<Factura | null>(null);
  const [historial, setHistorial] = useState<HistorialFactura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const seg = await facturasService.getSeguimiento(Number(id));
        setFactura(seg.factura || null);
        setHistorial(Array.isArray(seg.historial) ? seg.historial : []);
      } catch {
        try {
          const f = await facturasService.getById(Number(id));
          setFactura(f);
        } catch {
          setError('No se pudo cargar la factura.');
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-500 text-sm">Cargando factura...</span>
      </div>
    );
  }

  if (error || !factura) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          {error || 'Factura no encontrada.'}
        </div>
      </div>
    );
  }

  const estadoStep = ESTADO_STEP[factura.estado] || 1;
  const isPagada = factura.estado === 'Pagada' || factura.estado === 'Pago Aplicado';
  const isDevuelta = factura.estado === 'Devuelta' || factura.estado === 'Rechazada' || factura.estado === 'Anulada';

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/financiero/proveedor/mis-facturas')}
        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} /> Volver a Mis Facturas
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl p-6 text-white shadow-lg ${
          isPagada ? 'bg-gradient-to-r from-green-600 to-green-700' :
          isDevuelta ? 'bg-gradient-to-r from-red-600 to-red-700' :
          'bg-gradient-to-r from-blue-600 to-blue-700'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-xl">{factura.numero_factura}</h2>
            {factura.numero_radicado && (
              <p className="text-sm opacity-80 mt-0.5">Radicado: {factura.numero_radicado}</p>
            )}
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ESTADO_COLOR[factura.estado] || 'bg-white/20 text-white'}`}>
                {factura.estado}
              </span>
              {factura.urgente && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold">
                  URGENTE
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatMoney(factura.valor_total)}</p>
            <p className="text-sm opacity-80">Valor total</p>
          </div>
        </div>
      </motion.div>

      {/* Progress bar */}
      {!isDevuelta && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700"
        >
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Progreso del Proceso</h3>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {PROCESO_STEPS.map((s, i) => {
              const stepNum = i + 1;
              const done = estadoStep > stepNum || isPagada;
              const current = estadoStep === stepNum;
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-1 flex-shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      done ? 'bg-green-500 text-white' : current ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-slate-200 dark:bg-slate-600 text-slate-400'
                    }`}>
                      {done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                    </div>
                    <span className={`text-xs text-center whitespace-nowrap max-w-[60px] ${current ? 'text-blue-600 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < PROCESO_STEPS.length - 1 && (
                    <div className={`h-0.5 w-8 flex-shrink-0 mb-4 ${done ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-600'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Devuelta alert */}
      {isDevuelta && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 flex gap-3">
          <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Factura {factura.estado}</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Esta factura fue devuelta o rechazada. Revisa el historial para ver el motivo y corregirla si aplica.
            </p>
          </div>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos del documento */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 space-y-4"
        >
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            Datos del Documento
          </h3>
          <div className="space-y-3 text-sm">
            <InfoRow label="Tipo" value={factura.tipo_documento} />
            <InfoRow label="Descripción" value={factura.descripcion} />
            {factura.observaciones && <InfoRow label="Observaciones" value={factura.observaciones} />}
            <InfoRow label="Etapa actual" value={factura.etapa_actual || factura.estado} />
          </div>
        </motion.div>

        {/* Fechas */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 space-y-4"
        >
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            Fechas del Proceso
          </h3>
          <div className="space-y-3 text-sm">
            <InfoRow label="Fecha factura" value={factura.fecha_factura} />
            <InfoRow label="Fecha recepción" value={factura.fecha_recepcion} />
            {factura.fecha_radicacion && <InfoRow label="Fecha radicación" value={factura.fecha_radicacion} />}
            {factura.fecha_causacion && <InfoRow label="Fecha causación" value={factura.fecha_causacion} />}
            {factura.fecha_autorizacion && <InfoRow label="Fecha autorización" value={factura.fecha_autorizacion} />}
            {factura.fecha_pago_aplicado && <InfoRow label="Fecha pago" value={factura.fecha_pago_aplicado} />}
            <InfoRow label="Días transcurridos" value={`${factura.dias_transcurridos} días`} />
          </div>
        </motion.div>

        {/* Valores */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 space-y-4"
        >
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign size={18} className="text-blue-600" />
            Valores
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
              <span className="font-medium text-slate-900 dark:text-white">{formatMoney(factura.valor_subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">IVA</span>
              <span className="font-medium text-slate-900 dark:text-white">{formatMoney(factura.valor_iva)}</span>
            </div>
            {Number(factura.valor_retencion_renta) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Retención Renta</span>
                <span className="font-medium text-red-600">-{formatMoney(factura.valor_retencion_renta)}</span>
              </div>
            )}
            {Number(factura.valor_retencion_iva) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Retención IVA</span>
                <span className="font-medium text-red-600">-{formatMoney(factura.valor_retencion_iva)}</span>
              </div>
            )}
            {Number(factura.valor_retencion_ica) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Retención ICA</span>
                <span className="font-medium text-red-600">-{formatMoney(factura.valor_retencion_ica)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
              <span className="font-bold text-slate-900 dark:text-white">Total</span>
              <span className="font-bold text-blue-600 text-lg">{formatMoney(factura.valor_total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Neto a pagar</span>
              <span className="font-semibold text-green-600">{formatMoney(factura.valor_neto_pagar)}</span>
            </div>
          </div>
        </motion.div>

        {/* Proveedor + Área */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 space-y-4"
        >
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 size={18} className="text-blue-600" />
            Partes
          </h3>
          <div className="space-y-3 text-sm">
            {factura.proveedor && (
              <>
                <InfoRow label="Proveedor" value={factura.proveedor.razon_social} />
                <InfoRow label="NIT" value={factura.proveedor.nit} />
              </>
            )}
            {factura.departamento && (
              <InfoRow label="Área solicitante" value={factura.departamento.nombre} />
            )}
            {factura.usuario_responsable && (
              <InfoRow label="Responsable" value={factura.usuario_responsable.nombre} />
            )}
          </div>
        </motion.div>
      </div>

      {/* Historial */}
      {historial.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700"
        >
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-600" />
            Historial de Movimientos
          </h3>
          <div className="space-y-3">
            {historial.slice().reverse().map((h, i) => (
              <div key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-blue-600" />
                  </div>
                  {i < historial.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{h.accion}</p>
                    {h.estado_nuevo && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLOR[h.estado_nuevo] || 'bg-slate-100 text-slate-600'}`}>
                        {h.estado_nuevo}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {h.usuario_nombre || 'Sistema'} {h.usuario_rol ? `· ${h.usuario_rol}` : ''} · {new Date(h.fecha_accion).toLocaleString('es-CO')}
                    </p>
                  </div>
                  {h.observacion && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 bg-slate-50 dark:bg-slate-700/50 p-2 rounded italic">
                      {h.observacion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 dark:text-slate-400 flex-shrink-0">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white text-right">{value}</span>
    </div>
  );
}
