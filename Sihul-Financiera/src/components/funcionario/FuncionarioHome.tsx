import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Receipt, FileSearch, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface FuncionarioHomeProps {
  onNavigate: (menu: string) => void;
}

export default function FuncionarioHome({ onNavigate }: FuncionarioHomeProps) {
  const stats = [
    {
      title: 'Facturas Recibidas Hoy',
      value: '8',
      icon: Receipt,
      color: 'from-blue-600 to-blue-700',
      iconColor: 'text-blue-100',
      trend: '+2 desde ayer'
    },
    {
      title: 'Facturas Pendientes',
      value: '15',
      icon: Clock,
      color: 'from-yellow-600 to-yellow-700',
      iconColor: 'text-yellow-100',
      trend: 'Requieren atención'
    },
    {
      title: 'Procesadas Este Mes',
      value: '124',
      icon: CheckCircle2,
      color: 'from-green-600 to-green-700',
      iconColor: 'text-green-100',
      trend: '+12% vs mes anterior'
    },
    {
      title: 'En Radicación',
      value: '23',
      icon: TrendingUp,
      color: 'from-red-600 to-red-700',
      iconColor: 'text-red-100',
      trend: 'Promedio: 2.3 días'
    }
  ];

  const quickActions = [
    {
      title: 'Registrar Nueva Factura',
      description: 'Iniciar el proceso de registro de una factura recibida del proveedor',
      icon: Receipt,
      color: 'from-red-600 to-red-700',
      action: () => onNavigate('registrar')
    },
    {
      title: 'Consultar Facturas',
      description: 'Ver el estado y hacer seguimiento de las facturas registradas',
      icon: FileSearch,
      color: 'from-blue-600 to-blue-700',
      action: () => onNavigate('consultar')
    }
  ];

  const recentActivity = [
    { id: 1, factura: 'FAC-2026-001', proveedor: 'Papelería Central Ltda.', monto: 2450000, estado: 'Recibida', fecha: '2026-03-23 09:15' },
    { id: 2, factura: 'FAC-2026-002', proveedor: 'Servicios TI Colombia SAS', monto: 8950000, estado: 'Radicada', fecha: '2026-03-23 08:30' },
    { id: 3, factura: 'FAC-2026-003', proveedor: 'Suministros Industriales SA', monto: 3200000, estado: 'Recibida', fecha: '2026-03-22 16:45' },
    { id: 4, factura: 'FAC-2026-004', proveedor: 'Mantenimiento y Obras EU', monto: 12500000, estado: 'Radicada', fecha: '2026-03-22 14:20' }
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Recibida':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Radicada':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Receipt className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1">Panel de Funcionario - Cuentas por Pagar</h1>
            <p className="text-red-100">
              Gestiona el registro y seguimiento de facturas recibidas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-100">
          <Clock className="w-4 h-4" />
          <span>Última actualización: Hoy, 23 de Marzo 2026 - 10:30 AM</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
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

      {/* Quick Actions */}
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

      {/* Recent Activity */}
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
              Últimas facturas registradas en el sistema
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
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800">{item.factura}</p>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getEstadoBadge(item.estado)}`}>
                          {item.estado}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{item.proveedor}</p>
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
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                className="border-red-600 text-red-600 hover:bg-red-50"
                onClick={() => onNavigate('consultar')}
              >
                Ver Todas las Facturas
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}