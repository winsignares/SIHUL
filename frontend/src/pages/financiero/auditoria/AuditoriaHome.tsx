import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Shield, FileSearch, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';

interface AuditoriaHomeProps {
  onGoToPendientes: () => void;
  onGoToControl: () => void;
}

export default function AuditoriaHome({ onGoToPendientes, onGoToControl }: AuditoriaHomeProps) {
  const [statsData, setStatsData] = useState({
    porRevisar: 0,
    aprobadas: 0,
    rechazadas: 0,
  });
  const [recentFacturas, setRecentFacturas] = useState<APIFactura[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => [
    {
      title: 'Facturas por Revisar',
      value: String(statsData.porRevisar),
      icon: FileSearch,
      color: 'from-orange-600 to-orange-700',
      iconColor: 'text-orange-100',
      trend: 'Estado: Alistadas',
    },
    {
      title: 'Aprobadas (Total)',
      value: String(statsData.aprobadas),
      icon: CheckCircle2,
      color: 'from-green-600 to-green-700',
      iconColor: 'text-green-100',
      trend: 'Control previo aprobado',
    },
    {
      title: 'Rechazadas (Total)',
      value: String(statsData.rechazadas),
      icon: XCircle,
      color: 'from-red-600 to-red-700',
      iconColor: 'text-red-100',
      trend: 'Devueltas a Tesoreria',
    },
    {
      title: 'Tiempo Promedio Revision',
      value: '1.8 dias',
      icon: Clock,
      color: 'from-blue-600 to-blue-700',
      iconColor: 'text-blue-100',
      trend: 'Cumplimiento de SLA',
    },
  ], [statsData]);

  const recentActivity = useMemo(() => recentFacturas.map((factura, index) => {
    const fecha = factura.fecha_alistamiento || factura.fecha_recepcion || '';
    const accion = factura.estado === 'Aprobada Auditoría'
      ? 'Control previo aprobado'
      : factura.estado === 'Rechazada Auditoría'
        ? 'Control previo rechazado'
        : 'Actualizacion de auditoria';

    return {
      id: `${factura.id}-${index}`,
      factura: factura.numero_factura || `FAC-${factura.id}`,
      proveedor: factura.proveedor?.razon_social || 'Sin Asignar',
      monto: Number(factura.valor_total || 0),
      estado: factura.estado === 'Aprobada Auditoría' ? 'Aprobada' : factura.estado === 'Rechazada Auditoría' ? 'Rechazada' : factura.estado,
      fecha,
      accion,
    };
  }), [recentFacturas]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [alistadas, aprobadas, rechazadas, recientes] = await Promise.all([
          facturasService.getAll({ estado: 'Alistada', limit: 200 }),
          facturasService.getAll({ estado: 'Aprobada Auditoría', limit: 200 }),
          facturasService.getAll({ estado: 'Rechazada Auditoría', limit: 200 }),
          facturasService.getAll({ ordering: '-fecha_recepcion', limit: 5 }),
        ]);

        const list = (data: unknown) => Array.isArray((data as { results?: APIFactura[] })?.results)
          ? (data as { results: APIFactura[] }).results
          : (Array.isArray(data) ? data as APIFactura[] : []);

        setStatsData({
          porRevisar: list(alistadas).length,
          aprobadas: list(aprobadas).length,
          rechazadas: list(rechazadas).length,
        });
        setRecentFacturas(list(recientes));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Aprobada':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Rechazada':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-3xl font-bold">Panel de Auditoria</h1>
            <p className="text-red-100">Control previo antes del pago</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-100">
          <Clock className="w-4 h-4" />
          <span>Ultima actualizacion: {new Date().toLocaleString('es-CO')}</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-800 mb-1">{loading ? '...' : stat.value}</p>
                    <p className="text-sm text-slate-600 mb-2">{stat.title}</p>
                    <p className="text-xs text-slate-500">{stat.trend}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          onClick={onGoToPendientes}
          className="text-left"
        >
          <Card className="w-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">Mis Pendientes</h3>
                  <p className="text-sm text-slate-600">Cola de facturas alistadas pendientes de revision de control previo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
          onClick={onGoToControl}
          className="text-left"
        >
          <Card className="w-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileSearch className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">Control Previo</h3>
                  <p className="text-sm text-slate-600">Revisar expediente contable y aprobar o rechazar para continuar el flujo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Clock className="w-5 h-5 text-red-600" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Ultimas revisiones realizadas por auditoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item, index) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + index * 0.05 }} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800">{item.factura}</p>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getEstadoBadge(item.estado)}`}>{item.estado}</span>
                      </div>
                      <p className="text-sm text-slate-600">{item.proveedor} - {item.accion}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">${item.monto.toLocaleString('es-CO')}</p>
                    <p className="text-xs text-slate-500">{item.fecha}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
