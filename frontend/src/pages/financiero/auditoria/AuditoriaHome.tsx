import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Shield, FileSearch, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface AuditoriaHomeProps {
  onGoToPendientes: () => void;
  onGoToControl: () => void;
}

export default function AuditoriaHome({ onGoToPendientes, onGoToControl }: AuditoriaHomeProps) {
  const stats = [
    {
      title: 'Facturas por Revisar',
      value: '14',
      icon: FileSearch,
      color: 'from-orange-600 to-orange-700',
      iconColor: 'text-orange-100',
      trend: 'Estado: Alistadas',
    },
    {
      title: 'Aprobadas Este Mes',
      value: '98',
      icon: CheckCircle2,
      color: 'from-green-600 to-green-700',
      iconColor: 'text-green-100',
      trend: '+12% vs mes anterior',
    },
    {
      title: 'Rechazadas Este Mes',
      value: '6',
      icon: XCircle,
      color: 'from-red-600 to-red-700',
      iconColor: 'text-red-100',
      trend: 'Por incumplimientos',
    },
    {
      title: 'Tiempo Promedio Revision',
      value: '1.8 dias',
      icon: Clock,
      color: 'from-blue-600 to-blue-700',
      iconColor: 'text-blue-100',
      trend: 'Cumplimiento de SLA',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      factura: 'FAC-2026-012',
      proveedor: 'Mantenimiento Integral EU',
      monto: 6750000,
      estado: 'Aprobada',
      fecha: '2026-03-23 14:15',
      accion: 'Control previo aprobado',
    },
    {
      id: 2,
      factura: 'FAC-2026-013',
      proveedor: 'Editorial Academica',
      monto: 3890000,
      estado: 'Aprobada',
      fecha: '2026-03-23 11:30',
      accion: 'Sin hallazgos',
    },
    {
      id: 3,
      factura: 'FAC-2026-014',
      proveedor: 'Insumos Medicos',
      monto: 4520000,
      estado: 'Rechazada',
      fecha: '2026-03-22 16:20',
      accion: 'Documentos incompletos',
    },
  ];

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
          <span>Ultima actualizacion: Hoy, 14 de Abril 2026 - 11:20 AM</span>
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
                    <p className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</p>
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
