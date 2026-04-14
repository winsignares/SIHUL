import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { FileCheck, DollarSign, Clock, TrendingUp, Wallet, CheckCircle2 } from 'lucide-react';

interface TesoreriaHomeProps {
  onNavigate: (menu: string) => void;
}

export default function TesoreriaHome({ onNavigate }: TesoreriaHomeProps) {
  const stats = [
    {
      title: 'Facturas para Alistar',
      value: '18',
      icon: FileCheck,
      color: 'from-blue-600 to-blue-700',
      iconColor: 'text-blue-100',
      trend: 'Estado: Causadas'
    },
    {
      title: 'Listas para Pagar',
      value: '9',
      icon: DollarSign,
      color: 'from-green-600 to-green-700',
      iconColor: 'text-green-100',
      trend: 'Estado: Autorizadas'
    },
    {
      title: 'Pagadas Este Mes',
      value: '124',
      icon: CheckCircle2,
      color: 'from-purple-600 to-purple-700',
      iconColor: 'text-purple-100',
      trend: '+18% vs mes anterior'
    },
    {
      title: 'Valor Total Pendiente',
      value: '$42.5M',
      icon: TrendingUp,
      color: 'from-red-600 to-red-700',
      iconColor: 'text-red-100',
      trend: 'Por ejecutar'
    }
  ];

  const quickActions = [
    {
      title: 'Alistar Pagos',
      description: 'Preparar comprobantes de egreso y validar disponibilidad presupuestal',
      icon: FileCheck,
      color: 'from-blue-600 to-blue-700',
      action: () => onNavigate('alistar')
    },
    {
      title: 'Ejecutar Pagos',
      description: 'Registrar el pago efectivo a proveedores autorizados',
      icon: DollarSign,
      color: 'from-green-600 to-green-700',
      action: () => onNavigate('ejecutar')
    }
  ];

  const recentActivity = [
    { id: 1, factura: 'FAC-2026-005', proveedor: 'Editorial Universitaria', monto: 5670000, estado: 'Pagada', fecha: '2026-03-23 14:30', accion: 'Pago ejecutado - Trans: TRX-8901' },
    { id: 2, factura: 'FAC-2026-012', proveedor: 'Mantenimiento Integral EU', monto: 6750000, estado: 'Alistada', fecha: '2026-03-23 11:20', accion: 'Comprobante generado: CE-2026-245' },
    { id: 3, factura: 'FAC-2026-007', proveedor: 'Suministros de Oficina', monto: 1850000, estado: 'Pagada', fecha: '2026-03-22 16:45', accion: 'Pago ejecutado - Trans: TRX-8890' },
    { id: 4, factura: 'FAC-2026-013', proveedor: 'Editorial Académica', monto: 3890000, estado: 'Alistada', fecha: '2026-03-22 10:15', accion: 'Alistamiento completado' }
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Alistada':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pagada':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Wallet className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1">Panel de Tesorería</h1>
            <p className="text-red-100">
              Gestiona el alistamiento y ejecución de pagos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-100">
          <Clock className="w-4 h-4" />
          <span>Última actualización: Hoy, 23 de Marzo 2026 - 14:45 PM</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
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
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden"
                onClick={action.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Clock className="w-5 h-5 text-red-600" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas acciones realizadas en el área de tesorería
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800">{item.factura}</p>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getEstadoBadge(item.estado)}`}>
                          {item.estado}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{item.proveedor} - {item.accion}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">
                      ${item.monto.toLocaleString('es-CO')}
                    </p>
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
