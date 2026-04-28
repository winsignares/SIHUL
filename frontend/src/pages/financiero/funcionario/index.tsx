import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Search,
  Clock,
  Plus,
  Receipt,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import RegistrarFactura from './RegistrarFactura.tsx';
import ConsultarFacturas from './ConsultarFacturas.tsx';
import MisPendientes from './MisPendientes.tsx';
import { facturasService } from '../../../services/financiero';
import type { Factura } from '../../../models/financiero/core.models';
import type { FuncionarioDashboardHomeProps, FuncionarioStatsApi } from '../../../models/financiero/funcionario';

const toList = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.results)) return data.results as T[];
  return [];
};

const isFuncionarioStatsApi = (value: unknown): value is FuncionarioStatsApi => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<FuncionarioStatsApi>;
  return (
    typeof candidate.total_facturas === 'number' &&
    typeof candidate.vencidas === 'number' &&
    typeof candidate.atrasadas === 'number' &&
    typeof candidate.por_estado === 'object' &&
    candidate.por_estado !== null
  );
};

export default function FuncionarioDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/registrar')) return 'registrar';
    if (path.includes('/consultar')) return 'consultar';
    if (path.includes('/pendientes')) return 'pendientes';
    return 'dashboard';
  })();

  const renderContent = () => {
    switch (activeView) {
      case 'registrar':
        return <RegistrarFactura />;
      case 'consultar':
        return <ConsultarFacturas />;
      case 'pendientes':
        return <MisPendientes />;
      default:
        return (
          <DashboardHome
            onGoToRegistrar={() => navigate('/financiero/funcionario/registrar')}
            onGoToConsultar={() => navigate('/financiero/funcionario/consultar')}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}

function DashboardHome({ onGoToRegistrar, onGoToConsultar }: FuncionarioDashboardHomeProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [statsApi, setStatsApi] = useState<FuncionarioStatsApi | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [listResp, statsResp, pendingResp] = await Promise.all([
          facturasService.getAll({ limit: 20 }),
          facturasService.getEstadisticas(),
          facturasService.getPendientes(),
        ]);

        setFacturas(toList<Factura>(listResp));
        setStatsApi(isFuncionarioStatsApi(statsResp) ? statsResp : null);
        setPendingCount(Array.isArray(pendingResp) ? pendingResp.length : 0);
      } catch {
        setFacturas([]);
        setStatsApi(null);
        setPendingCount(0);
        setLoadError('No fue posible cargar el dashboard desde el backend.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const stats = useMemo(() => {
    const total = statsApi?.total_facturas ?? 0;
    const porEstado = statsApi?.por_estado ?? {};
    const recibidas = porEstado['Recibida'] ?? 0;
    const pendientes = pendingCount;
    const procesadas = (porEstado['Pagada'] ?? 0) + (porEstado['Pago Aplicado'] ?? 0) + (porEstado['Autorizada'] ?? 0);
    const enRadicacion = porEstado['Radicada'] ?? 0;

    return [
      {
        title: 'Facturas Recibidas',
        value: String(recibidas),
        icon: Receipt,
        color: 'from-blue-600 to-blue-700',
        iconColor: 'text-blue-100',
        trend: `Total sistema: ${total}`,
      },
      {
        title: 'Facturas Pendientes',
        value: String(pendientes),
        icon: Clock,
        color: 'from-yellow-600 to-yellow-700',
        iconColor: 'text-yellow-100',
        trend: 'Requieren atención',
      },
      {
        title: 'Procesadas',
        value: String(procesadas),
        icon: CheckCircle2,
        color: 'from-green-600 to-green-700',
        iconColor: 'text-green-100',
        trend: `Vencidas: ${statsApi?.vencidas ?? 0}`,
      },
      {
        title: 'En Radicación',
        value: String(enRadicacion),
        icon: TrendingUp,
        color: 'from-red-600 to-red-700',
        iconColor: 'text-red-100',
        trend: `Atrasadas: ${statsApi?.atrasadas ?? 0}`,
      },
    ];
  }, [pendingCount, statsApi]);

  const recentActivity = useMemo(() => {
    return facturas.slice(0, 8).map((f) => ({
      id: f.id,
      factura: f.numero_factura,
      proveedor: f.proveedor?.razon_social || 'Proveedor sin nombre',
      monto: Number(f.valor_total || 0),
      estado: f.estado,
      fecha: f.fecha_recepcion || '',
    }));
  }, [facturas]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-start gap-4">
          <AlertCircle size={24} className="flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg mb-1">Panel de Funcionario - Cuentas por Pagar</h3>
            <p className="text-red-100">Gestiona el registro y seguimiento de facturas recibidas</p>
            <p className="text-red-100 text-sm mt-2">Ultima actualización: Hoy, 23 de Marzo 2026 - 10:30 AM</p>
          </div>
        </div>
      </motion.div>

      {loadError && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className={`${stat.iconColor}`} size={24} />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.trend}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700"
        >
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="text-red-600" size={20} />
            Registrar Nueva Factura
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
            Iniciar el proceso de registro de una factura recibida del proveedor
          </p>
          <button
            onClick={onGoToRegistrar}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Comenzar Registro
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700"
        >
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Search className="text-blue-600" size={20} />
            Consultar Facturas
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
            Ver el estado y hacer seguimiento de las facturas registradas
          </p>
          <button
            onClick={onGoToConsultar}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Consultar Todas
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="text-red-600" size={20} />
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Actividad Reciente</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Ultimas facturas registradas en el sistema</p>

        <div className="space-y-3">
          {loading ? (
            <div className="text-sm text-slate-500">Cargando actividad...</div>
          ) : recentActivity.length === 0 ? (
            <div className="text-sm text-slate-500">No hay facturas registradas todavía.</div>
          ) : recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="text-red-600 dark:text-red-400" size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{activity.factura}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{activity.proveedor}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900 dark:text-white">${activity.monto.toLocaleString()}</p>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      activity.estado === 'Recibida' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {activity.estado}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{activity.fecha}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
