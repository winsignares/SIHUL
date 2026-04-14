import { motion } from 'framer-motion';
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

function DashboardHome({
  onGoToRegistrar,
  onGoToConsultar,
}: {
  onGoToRegistrar: () => void;
  onGoToConsultar: () => void;
}) {
  const stats = [
    {
      title: 'Facturas Recibidas Hoy',
      value: '8',
      icon: Receipt,
      color: 'from-blue-600 to-blue-700',
      iconColor: 'text-blue-100',
      trend: '+2 desde ayer',
    },
    {
      title: 'Facturas Pendientes',
      value: '15',
      icon: Clock,
      color: 'from-yellow-600 to-yellow-700',
      iconColor: 'text-yellow-100',
      trend: 'Requieren atención',
    },
    {
      title: 'Procesadas Este Mes',
      value: '124',
      icon: CheckCircle2,
      color: 'from-green-600 to-green-700',
      iconColor: 'text-green-100',
      trend: '+12% vs mes anterior',
    },
    {
      title: 'En Radicación',
      value: '23',
      icon: TrendingUp,
      color: 'from-red-600 to-red-700',
      iconColor: 'text-red-100',
      trend: 'Promedio: 2.3 días',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      factura: 'FAC-2026-001',
      proveedor: 'Papelería Central Ltda.',
      monto: 2450000,
      estado: 'Recibida',
      fecha: '2026-03-23 09:15',
    },
    {
      id: 2,
      factura: 'FAC-2026-002',
      proveedor: 'Servicios TI Colombia SAS',
      monto: 8950000,
      estado: 'Radicada',
      fecha: '2026-03-23 08:30',
    },
    {
      id: 3,
      factura: 'FAC-2026-003',
      proveedor: 'Suministros Industriales SA',
      monto: 3200000,
      estado: 'Recibida',
      fecha: '2026-03-22 16:45',
    },
    {
      id: 4,
      factura: 'FAC-2026-004',
      proveedor: 'Mantenimiento y Obras EU',
      monto: 12500000,
      estado: 'Radicada',
      fecha: '2026-03-22 14:20',
    },
  ];

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
          {recentActivity.map((activity) => (
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
