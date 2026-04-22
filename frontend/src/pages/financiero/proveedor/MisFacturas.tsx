import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { proveedoresService } from '../../../services/financiero';
import type { Factura, Proveedor } from '../../../models/financiero';

const toList = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.results)) return data.results as T[];
  return [];
};

const formatMoney = (val: any) => {
  const num = Number(val) || 0;
  return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const ESTADO_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  'Recibida':              { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',        icon: Clock,          label: 'Recibida' },
  'Registrada':            { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', icon: FileText,       label: 'Registrada' },
  'Radicada':              { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: FileText,       label: 'Radicada' },
  'Causada':               { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock,          label: 'Causada' },
  'Alistada':              { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: Clock,          label: 'Alistada' },
  'Aprobada Auditoría':    { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',     icon: CheckCircle2,   label: 'Aprobada Auditoría' },
  'Rechazada Auditoría':   { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',             icon: XCircle,        label: 'Rechazada Auditoría' },
  'Cargada':               { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',         icon: FileText,       label: 'Cargada' },
  'Revisada Dir. Financiera': { color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',     icon: CheckCircle2,   label: 'En Revisión' },
  'Enviada Rectoría':      { color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', icon: Clock,          label: 'En Rectoría' },
  'Autorizada':            { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',     icon: CheckCircle2,   label: 'Autorizada' },
  'Pago Aplicado':         { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2, label: 'Pago Aplicado' },
  'Pagada':                { color: 'bg-green-200 text-green-800 dark:bg-green-800/40 dark:text-green-200',     icon: CheckCircle2,   label: 'Pagada' },
  'Devuelta':              { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',     icon: AlertCircle,    label: 'Devuelta' },
  'Rechazada':             { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',             icon: XCircle,        label: 'Rechazada' },
  'Anulada':               { color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',        icon: XCircle,        label: 'Anulada' },
};

interface Props {
  miProveedor: Proveedor | null;
}

export default function MisFacturas({ miProveedor }: Props) {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const loadFacturas = async () => {
    if (!miProveedor) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await proveedoresService.getMisFacturas(miProveedor.id);
      setFacturas(toList<Factura>(resp));
    } catch {
      setError('No se pudieron cargar tus facturas. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFacturas();
  }, [miProveedor]);

  const filteredFacturas = facturas.filter(f => {
    const matchSearch =
      !search ||
      f.numero_factura.toLowerCase().includes(search.toLowerCase()) ||
      (f.numero_radicado || '').toLowerCase().includes(search.toLowerCase()) ||
      f.descripcion.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !estadoFiltro || f.estado === estadoFiltro;
    return matchSearch && matchEstado;
  });

  const estados = [...new Set(facturas.map(f => f.estado))];

  if (!miProveedor) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <AlertCircle className="text-slate-400" size={48} />
        <p className="text-slate-600 dark:text-slate-400 text-center">
          No se encontró tu perfil de proveedor. Completa el proceso de identificación primero.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <FileText size={24} className="flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-1">Mis Facturas</h3>
              <p className="text-blue-100 text-sm">Consulta el estado de todas tus facturas enviadas</p>
            </div>
          </div>
          <button
            onClick={() => void loadFacturas()}
            className="p-2 hover:bg-blue-500/40 rounded-lg transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </motion.div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: facturas.length, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
          { label: 'En Proceso', value: facturas.filter(f => !['Pagada', 'Rechazada', 'Anulada', 'Devuelta'].includes(f.estado)).length, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Pagadas', value: facturas.filter(f => f.estado === 'Pagada' || f.estado === 'Pago Aplicado').length, color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Devueltas', value: facturas.filter(f => f.estado === 'Devuelta' || f.estado === 'Rechazada').length, color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`${stat.bg} rounded-xl p-4`}
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número, radicado o descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={estadoFiltro}
          onChange={e => setEstadoFiltro(e.target.value)}
          className="px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Todos los estados</option>
          {estados.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Lista */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-500 dark:text-slate-400 text-sm">Cargando facturas...</span>
          </div>
        ) : filteredFacturas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <FileText className="text-slate-300 dark:text-slate-600" size={48} />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {facturas.length === 0 ? 'Aún no has enviado ninguna factura.' : 'No hay facturas que coincidan con los filtros.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredFacturas.map((factura, i) => {
              const cfg = ESTADO_CONFIG[factura.estado] || { color: 'bg-slate-100 text-slate-600', icon: FileText, label: factura.estado };
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={factura.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/financiero/proveedor/${factura.id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="text-blue-600 dark:text-blue-400" size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{factura.numero_factura}</p>
                      {factura.numero_radicado && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">| {factura.numero_radicado}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{factura.descripcion}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Recibida: {factura.fecha_recepcion}
                      {factura.fecha_factura && ` · Factura: ${factura.fecha_factura}`}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{formatMoney(factura.valor_total)}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                      <Icon size={10} />
                      {cfg.label}
                    </span>
                  </div>

                  <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors flex-shrink-0" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
