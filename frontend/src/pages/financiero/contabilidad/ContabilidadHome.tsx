import { motion } from 'framer-motion';
import { Card, CardContent } from '../../../share/card';
import { Button } from '../../../share/button';
import {
  FileCheck,
  Calculator,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface ContabilidadHomeProps {
  onGoToPendientes: () => void;
  onGoToRadicar: () => void;
  onGoToCausar: () => void;
}

export default function ContabilidadHome({
  onGoToPendientes,
  onGoToRadicar,
  onGoToCausar,
}: ContabilidadHomeProps) {
  const stats = [
    {
      title: 'Facturas para Radicar',
      value: '12',
      icon: FileCheck,
      color: 'from-blue-600 to-blue-700',
      iconColor: 'text-blue-100',
      trend: 'Estado: Recibidas',
    },
    {
      title: 'Pendientes de Causación',
      value: '18',
      icon: Calculator,
      color: 'from-green-600 to-green-700',
      iconColor: 'text-green-100',
      trend: 'Estado: Radicadas',
    },
    {
      title: 'Causadas Este Mes',
      value: '156',
      icon: CheckCircle2,
      color: 'from-purple-600 to-purple-700',
      iconColor: 'text-purple-100',
      trend: '+15% vs mes anterior',
    },
    {
      title: 'Promedio de Procesamiento',
      value: '2.1 días',
      icon: TrendingUp,
      color: 'from-red-600 to-red-700',
      iconColor: 'text-red-100',
      trend: 'Mejora del 10%',
    },
  ];

  const quickActions = [
    {
      title: 'Radicar Facturas',
      description: 'Formalizar la entrada de documentos al sistema institucional',
      icon: FileCheck,
      color: 'from-blue-600 to-blue-700',
      action: onGoToRadicar,
    },
    {
      title: 'Causar Facturas',
      description: 'Registrar el reconocimiento contable de las obligaciones',
      icon: Calculator,
      color: 'from-green-600 to-green-700',
      action: onGoToCausar,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      factura: 'FAC-2026-005',
      proveedor: 'Editorial Universitaria',
      monto: 5670000,
      estado: 'Causada',
      fecha: '2026-03-23 10:45',
      accion: 'Causación aprobada',
    },
    {
      id: 2,
      factura: 'FAC-2026-006',
      proveedor: 'Servicios de Aseo Total',
      monto: 4200000,
      estado: 'Radicada',
      fecha: '2026-03-23 09:30',
      accion: 'Radicado: RAD-2026-089',
    },
    {
      id: 3,
      factura: 'FAC-2026-007',
      proveedor: 'Suministros de Oficina',
      monto: 1850000,
      estado: 'Causada',
      fecha: '2026-03-22 16:15',
      accion: 'Causación completada',
    },
    {
      id: 4,
      factura: 'FAC-2026-008',
      proveedor: 'Tecnología Educativa SAS',
      monto: 9200000,
      estado: 'Devuelta',
      fecha: '2026-03-22 14:30',
      accion: 'Devuelta por soportes incompletos',
    },
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Radicada':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Causada':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Devuelta':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Calculator className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-3xl font-bold">
              Panel de Contabilidad
            </h1>
            <p className="text-red-100">
              Gestiona la radicación y causación de cuentas por pagar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-100">
          <Clock className="w-4 h-4" />
          <span>Última actualización: Hoy, 13 de Abril 2026 - 11:15 AM</span>
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
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}
                    >
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-800 mb-1">
                      {stat.value}
                    </p>
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
              onClick={action.action}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-slate-600">{action.description}</p>
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
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-bold text-slate-800">Actividad Reciente</h2>
              </div>
              <p className="text-sm text-slate-600">
                Últimas acciones realizadas en el área de contabilidad
              </p>
            </div>
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
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800">{item.factura}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getEstadoBadge(
                            item.estado
                          )}`}
                        >
                          {item.estado}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {item.proveedor} - {item.accion}
                      </p>
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

      {/* Mis Pendientes Quick Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <Button
          onClick={onGoToPendientes}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg h-auto rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <Clock className="w-5 h-5 mr-2" />
          Ver Mis Pendientes
        </Button>
      </motion.div>
    </div>
  );
}
