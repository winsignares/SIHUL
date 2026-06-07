import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  FileText,
  Send,
  AlertCircle,
  Building2,
} from 'lucide-react';
import EnviarFactura from './EnviarFactura';
import MisFacturas from './MisFacturas';
import { proveedoresService } from '../../../services/financiero';
import type { Proveedor } from '../../../models/financiero/core.models';
import type { ProveedorDashboardHomeProps } from '../../../models/financiero/proveedor';
import { useProveedorDashboard, useProveedorHome } from '../../../hooks/financiero/proveedor';

export default function ProveedorDashboard() {
  const { activeView, goToEnviar, goToMisFacturas } = useProveedorDashboard();

  const [miProveedor, setMiProveedor] = useState<Proveedor | null>(null);
  const [proveedorLoading, setProveedorLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setProveedorLoading(true);
      try {
        const prov = await proveedoresService.getMiPerfil();
        setMiProveedor(prov);
      } catch {
        setMiProveedor(null);
      } finally {
        setProveedorLoading(false);
      }
    };
    void load();
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'enviar':
        return (
          <EnviarFactura
            miProveedor={miProveedor}
            onSuccess={goToMisFacturas}
          />
        );
      case 'mis-facturas':
        return <MisFacturas miProveedor={miProveedor} />;
      default:
        return (
          <DashboardHome
            miProveedor={miProveedor}
            proveedorLoading={proveedorLoading}
            onGoToEnviar={goToEnviar}
            onGoToMisFacturas={goToMisFacturas}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}

function DashboardHome({ miProveedor, proveedorLoading, onGoToEnviar, onGoToMisFacturas }: ProveedorDashboardHomeProps) {
  const { loading, stats, recentFacturas, hasMoreRecent } = useProveedorHome(miProveedor?.id);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-700 to-red-900 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-start gap-4">
          <Building2 size={24} className="flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Portal de Proveedor</h3>
            {proveedorLoading ? (
              <p className="text-red-200 text-sm">Cargando tu perfil...</p>
            ) : miProveedor ? (
              <div>
                <p className="text-red-100 font-semibold">{miProveedor.razon_social}</p>
                <p className="text-red-200 text-sm mt-0.5">NIT: {miProveedor.nit} · {miProveedor.tipo_proveedor}</p>
              </div>
            ) : (
              <p className="text-red-200 text-sm">
                No se encontró tu perfil de proveedor vinculado. Puedes buscar tu NIT al enviar una factura.
              </p>
            )}
          </div>
          {miProveedor && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${miProveedor.estado === 'Activo' ? 'bg-green-400 text-green-900' : 'bg-yellow-400 text-yellow-900'}`}>
              {miProveedor.estado}
            </span>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 shadow-md border-2 border-slate-300 dark:border-slate-600 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className={stat.iconColor} size={20} />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {loading ? '—' : stat.value}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{stat.trend}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 shadow-md border-2 border-slate-300 dark:border-slate-600"
        >
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Send className="text-red-700" size={20} />
            Enviar Nueva Factura
          </h3>
          <p className="text-slate-700 dark:text-slate-200 text-sm mb-4 font-medium">
            Completa el formulario para enviar una factura al área de cuentas por pagar de la universidad.
          </p>
          <button
            onClick={onGoToEnviar}
            className="w-full px-4 py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg font-semibold text-sm transition-colors shadow-md"
          >
            Enviar Factura
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 shadow-md border-2 border-slate-300 dark:border-slate-600"
        >
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <FileText className="text-blue-700" size={20} />
            Consultar Mis Facturas
          </h3>
          <p className="text-slate-700 dark:text-slate-200 text-sm mb-4 font-medium">
            Ve el estado actualizado de todas tus facturas enviadas y su avance en el proceso de pago.
          </p>
          <button
            onClick={onGoToMisFacturas}
            className="w-full px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-sm transition-colors shadow-md"
          >
            Ver Mis Facturas
          </button>
        </motion.div>
      </div>

      {/* Recent activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 shadow-md border-2 border-slate-300 dark:border-slate-600"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="text-red-700" size={20} />
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Actividad Reciente</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 font-medium">Últimas facturas enviadas</p>

        <div className="space-y-3">
          {loading ? (
            <div className="text-sm text-slate-400 dark:text-slate-500">Cargando actividad...</div>
          ) : recentFacturas.length === 0 ? (
            <div className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
              No has enviado ninguna factura aún.
            </div>
          ) : (
            recentFacturas.map(f => {
              const isOk = f.estado === 'Pagada' || f.estado === 'Pago Aplicado' || f.estado === 'Autorizada';
              const isWarn = f.estado === 'Devuelta' || f.estado === 'Rechazada';
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700/70 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-600"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="text-red-600 dark:text-red-400" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{f.numero_factura}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">{f.descripcion}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      ${Number(f.valor_total || 0).toLocaleString()}
                    </p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isOk ? 'bg-green-100 text-green-700' : isWarn ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {f.estado}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {hasMoreRecent && (
          <button
            onClick={onGoToMisFacturas}
            className="mt-4 w-full rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-900/40 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            Ver más actividad
          </button>
        )}
      </motion.div>
    </div>
  );
}
