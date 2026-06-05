import { useEffect, useState, type ElementType } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
} from 'lucide-react';
import { facturasService } from '../../../services/financiero';
import type { Factura, HistorialFactura } from '../../../models/financiero/core.models';

const formatMoney = (val: number | string | null | undefined) => {
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
  'Recibida': 'bg-amber-100 text-amber-800',
  'Registrada': 'bg-rose-100 text-rose-800',
  'Radicada': 'bg-red-100 text-red-800',
  'Causada': 'bg-orange-100 text-orange-800',
  'Alistada': 'bg-orange-100 text-orange-800',
  'Aprobada Auditoría': 'bg-green-100 text-green-800',
  'Rechazada Auditoría': 'bg-red-100 text-red-800',
  'Cargada': 'bg-amber-100 text-amber-800',
  'Revisada Dir. Financiera': 'bg-rose-100 text-rose-800',
  'Enviada Rectoría': 'bg-red-100 text-red-800',
  'Autorizada': 'bg-green-200 text-green-900',
  'Pago Aplicado': 'bg-green-100 text-green-800',
  'Pagada': 'bg-green-300 text-green-900',
  'Devuelta': 'bg-amber-100 text-amber-800',
  'Rechazada': 'bg-red-200 text-red-800',
  'Anulada': 'bg-slate-100 text-slate-700',
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
        const facturaSeguimiento = (seg?.factura || null) as Factura | null;
        setFactura(facturaSeguimiento);
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
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
  const canCorregir = factura.estado === 'Devuelta' || factura.estado === 'Rechazada';
  const diasTranscurridos = Math.max(Number(factura.dias_transcurridos) || 0, 0);

  return (
    <div className="min-h-full px-4 md:px-8 py-6 font-['Space_Grotesk']">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/financiero/proveedor/mis-facturas')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Volver a Mis Facturas
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-white/90 border border-white/60 shadow-sm ${ESTADO_COLOR[factura.estado] || 'text-slate-700'}`}>
              {factura.estado}
            </span>
            {factura.urgente && (
              <span className="px-2.5 py-1 rounded-full bg-amber-400/90 text-amber-900 text-xs font-bold tracking-wide">
                URGENTE
              </span>
            )}
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-red-100/70 dark:border-red-900/50 bg-gradient-to-br from-white via-white to-red-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-red-950/30 p-6 md:p-8 shadow-xl"
        >
          <div className="absolute -top-24 -right-16 h-56 w-56 rounded-full bg-red-200/50 blur-3xl" />
          <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-red-500 font-semibold">Detalle de factura</p>
              <h2 className="text-2xl md:text-3xl font-['Fraunces'] font-bold text-slate-900 dark:text-white">
                {factura.numero_factura}
              </h2>
              {factura.numero_radicado && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Radicado: <span className="font-semibold text-slate-900 dark:text-white">{factura.numero_radicado}</span>
                </p>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {factura.descripcion || 'Factura en proceso con seguimiento activo.'}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl bg-red-700 text-white p-5 shadow-lg border border-red-600/40">
                <p className="text-xs uppercase tracking-wide text-red-100">Valor total</p>
                <p className="text-3xl font-bold mt-1">{formatMoney(factura.valor_total)}</p>
                <p className="text-xs text-red-100 mt-2">
                  Neto a pagar: <span className="font-semibold text-white">{formatMoney(factura.valor_neto_pagar)}</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard title="Dias transcurridos" value={`${diasTranscurridos} dias`} icon={Calendar} tone="amber" />
                <StatCard title="Etapa actual" value={factura.etapa_actual || factura.estado} icon={CheckCircle2} tone="red" />
              </div>
            </div>
          </div>
        </motion.section>

        {!isDevuelta && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 dark:bg-slate-900/60 backdrop-blur rounded-2xl p-5 md:p-6 shadow-md border border-slate-200/70 dark:border-slate-700/60"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">Progreso del proceso</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Paso {estadoStep} de {PROCESO_STEPS.length}</span>
            </div>
            <div className="relative overflow-x-auto pb-2">
              <div className="absolute left-4 right-4 top-4 h-px bg-slate-200 dark:bg-slate-700" />
              <div className="grid grid-cols-8 gap-4 min-w-[720px] relative">
                {PROCESO_STEPS.map((s, i) => {
                  const stepNum = i + 1;
                  const done = estadoStep > stepNum || isPagada;
                  const current = estadoStep === stepNum;
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="relative flex flex-col items-center text-center gap-2">
                      <div
                        className={`z-10 h-9 w-9 rounded-full flex items-center justify-center border transition ${
                          done
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : current
                              ? 'border-red-500 bg-red-600 text-white shadow-lg shadow-red-500/30'
                              : 'border-slate-200 bg-white text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                        }`}
                      >
                        {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                      </div>
                      <span className={`text-xs font-medium ${current ? 'text-red-600' : done ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}

        {isDevuelta && (
          <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 flex gap-3">
            <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">Factura {factura.estado}</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Esta factura fue devuelta o rechazada. Revisa el historial para ver el motivo y corregirla si aplica.
              </p>
              {canCorregir && (
                <button
                  type="button"
                  onClick={() =>
                    navigate('/financiero/proveedor/enviar', {
                      state: { correccionFactura: factura },
                    })
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                >
                  Corregir factura
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/90 dark:bg-slate-900/60 backdrop-blur rounded-2xl p-6 shadow-md border border-slate-200/70 dark:border-slate-700/60 space-y-4"
          >
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-red-600" />
              Datos del Documento
            </h3>
            <div className="space-y-2 text-sm">
              <InfoRow label="Tipo" value={factura.tipo_documento} />
              <InfoRow label="Descripcion" value={factura.descripcion} />
              {factura.observaciones && <InfoRow label="Observaciones" value={factura.observaciones} />}
              <InfoRow label="Etapa actual" value={factura.etapa_actual || factura.estado} />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white/90 dark:bg-slate-900/60 backdrop-blur rounded-2xl p-6 shadow-md border border-slate-200/70 dark:border-slate-700/60 space-y-4"
          >
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-red-600" />
              Fechas del Proceso
            </h3>
            <div className="space-y-2 text-sm">
              <InfoRow label="Fecha factura" value={factura.fecha_factura} />
              <InfoRow label="Fecha recepcion" value={factura.fecha_recepcion} />
              {factura.fecha_radicacion && <InfoRow label="Fecha radicacion" value={factura.fecha_radicacion} />}
              {factura.fecha_causacion && <InfoRow label="Fecha causacion" value={factura.fecha_causacion} />}
              {factura.fecha_autorizacion && <InfoRow label="Fecha autorizacion" value={factura.fecha_autorizacion} />}
              {factura.fecha_pago_aplicado && <InfoRow label="Fecha pago" value={factura.fecha_pago_aplicado} />}
              <InfoRow label="Dias transcurridos" value={`${diasTranscurridos} dias`} />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white/90 dark:bg-slate-900/60 backdrop-blur rounded-2xl p-6 shadow-md border border-slate-200/70 dark:border-slate-700/60 space-y-4"
          >
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign size={18} className="text-red-600" />
              Valores
            </h3>
            <div className="space-y-2 text-sm">
              <ValueRow label="Subtotal" value={formatMoney(factura.valor_subtotal)} />
              <ValueRow label="IVA" value={formatMoney(factura.valor_iva)} />
              {Number(factura.valor_retencion_renta) > 0 && (
                <ValueRow label="Retencion Renta" value={`-${formatMoney(factura.valor_retencion_renta)}`} tone="danger" />
              )}
              {Number(factura.valor_retencion_iva) > 0 && (
                <ValueRow label="Retencion IVA" value={`-${formatMoney(factura.valor_retencion_iva)}`} tone="danger" />
              )}
              {Number(factura.valor_retencion_ica) > 0 && (
                <ValueRow label="Retencion ICA" value={`-${formatMoney(factura.valor_retencion_ica)}`} tone="danger" />
              )}
              <div className="flex justify-between border-t border-slate-200/70 dark:border-slate-700/60 pt-3 mt-3">
                <span className="font-bold text-slate-900 dark:text-white">Total</span>
                <span className="font-bold text-red-700 text-lg">{formatMoney(factura.valor_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Neto a pagar</span>
                <span className="font-semibold text-emerald-600">{formatMoney(factura.valor_neto_pagar)}</span>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-white/90 dark:bg-slate-900/60 backdrop-blur rounded-2xl p-6 shadow-md border border-slate-200/70 dark:border-slate-700/60 space-y-4"
          >
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 size={18} className="text-red-600" />
              Partes
            </h3>
            <div className="space-y-2 text-sm">
              {factura.proveedor && (
                <>
                  <InfoRow label="Proveedor" value={factura.proveedor.razon_social} />
                  <InfoRow label="NIT" value={factura.proveedor.nit} />
                </>
              )}
              {factura.departamento && (
                <InfoRow label="Area solicitante" value={factura.departamento.nombre} />
              )}
              {factura.usuario_responsable && (
                <InfoRow label="Responsable" value={factura.usuario_responsable.nombre} />
              )}
            </div>
          </motion.section>
        </div>

        {historial.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 dark:bg-slate-900/60 backdrop-blur rounded-2xl p-6 shadow-md border border-slate-200/70 dark:border-slate-700/60"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-red-600" />
                Historial de Movimientos
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">{historial.length} registros</span>
            </div>
            <div className="space-y-3">
              {historial.slice().reverse().map((h, i) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={15} className="text-red-600" />
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {h.usuario_nombre || 'Sistema'} {h.usuario_rol ? `· ${h.usuario_rol}` : ''} · {new Date(h.fecha_accion).toLocaleString('es-CO')}
                    </p>
                    {h.observacion && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl italic">
                        {h.observacion}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[170px,1fr] gap-1 sm:gap-3 py-2 border-b border-slate-100/70 dark:border-slate-700/50 last:border-b-0">
      <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white text-sm break-words sm:text-right">{value}</span>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, tone = 'red' }: { title: string; value: string; icon: ElementType; tone?: 'red' | 'amber' }) {
  const baseStyles = 'dark:bg-slate-900/70 dark:text-slate-100 dark:border-slate-700/60';
  const toneStyles =
    tone === 'amber'
      ? `bg-amber-50 text-amber-900 border-amber-200/70 ${baseStyles}`
      : `bg-red-50 text-red-900 border-red-200/70 ${baseStyles}`;

  return (
    <div className={`rounded-2xl border p-4 ${toneStyles} shadow-sm`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide font-semibold">{title}</p>
        <Icon size={16} />
      </div>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function ValueRow({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-medium ${tone === 'danger' ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  );
}
