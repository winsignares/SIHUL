import { motion } from 'framer-motion';
import { Card, CardContent } from '../../../share/card';
import {
  FileCheck,
  DollarSign,
  Clock,
  TrendingUp,
  Wallet,
  CheckCircle2,
  FileOutput,
} from 'lucide-react';

interface TesoreriaHomeProps {
  onGoToPendientes: () => void;
  onGoToAlistar: () => void;
  onGoToEnviarDireccion: () => void;
  onGoToRegistrarPago: () => void;
  onGoToComprobante: () => void;
}

export default function TesoreriaHome({
  onGoToPendientes,
  onGoToAlistar,
  onGoToEnviarDireccion,
  onGoToRegistrarPago,
  onGoToComprobante,
}: TesoreriaHomeProps) {
  const stats = [
    {
      title: 'Facturas para Alistar',
      value: '18',
      icon: FileCheck,
      color: 'from-blue-600 to-blue-700',
      iconColor: 'text-blue-100',
      trend: 'Estado: Causadas',
    },
    {
      title: 'Aprobadas por Auditoria',
      value: '9',
      icon: CheckCircle2,
      color: 'from-purple-600 to-purple-700',
      iconColor: 'text-purple-100',
      trend: 'Listas para enviar',
    },
    {
      title: 'Pagos por Registrar',
      value: '6',
      icon: DollarSign,
      color: 'from-green-600 to-green-700',
      iconColor: 'text-green-100',
      trend: 'Pago aplicado en portal bancario',
    },
    {
      title: 'Valor Total Pendiente',
      value: '$42.5M',
      icon: TrendingUp,
      color: 'from-red-600 to-red-700',
      iconColor: 'text-red-100',
      trend: 'Pendiente de cierre contable',
    },
  ];

  const quickActions = [
    {
      title: 'Mis Pendientes',
      description: 'Visualiza cola de alistamiento, envios y comprobantes por vencer',
      icon: Clock,
      color: 'from-slate-700 to-slate-800',
      action: onGoToPendientes,
    },
    {
      title: 'Alistar Pagos',
      description: 'Genera proceso de pago y archivo plano para el aplicativo financiero',
      icon: FileCheck,
      color: 'from-blue-600 to-blue-700',
      action: onGoToAlistar,
    },
    {
      title: 'Enviar Direccion Financiera',
      description: 'Remite facturas aprobadas por auditoria para cargue formal',
      icon: CheckCircle2,
      color: 'from-purple-600 to-purple-700',
      action: onGoToEnviarDireccion,
    },
    {
      title: 'Registrar Pago Aplicado',
      description: 'Registra en SIHUL pagos que ya se ejecutaron en el portal bancario',
      icon: DollarSign,
      color: 'from-green-600 to-green-700',
      action: onGoToRegistrarPago,
    },
    {
      title: 'Comprobante de Egreso',
      description: 'Cierra el ciclo financiero con la generacion del comprobante final',
      icon: FileOutput,
      color: 'from-emerald-600 to-emerald-700',
      action: onGoToComprobante,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      factura: 'FAC-2026-005',
      proveedor: 'Editorial Universitaria',
      monto: 5670000,
      estado: 'Pago aplicado',
      fecha: '2026-03-23 14:30',
      accion: 'Registro de transaccion TRX-8901',
    },
    {
      id: 2,
      factura: 'FAC-2026-012',
      proveedor: 'Mantenimiento Integral EU',
      monto: 6750000,
      estado: 'Alistada',
      fecha: '2026-03-23 11:20',
      accion: 'Proceso PP-2026-245 generado',
    },
    {
      id: 3,
      factura: 'FAC-2026-007',
      proveedor: 'Suministros de Oficina',
      monto: 1850000,
      estado: 'Enviada',
      fecha: '2026-03-22 16:45',
      accion: 'Enviada a Direccion Financiera (RF06)',
    },
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Alistada':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pago aplicado':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Enviada':
        return 'bg-purple-100 text-purple-700 border-purple-200';
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
            <Wallet className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-3xl font-bold">Panel de Tesoreria</h1>
            <p className="text-red-100">Gestiona alistamiento, envio, registro de pagos y cierre con comprobante</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-100">
          <Clock className="w-4 h-4" />
          <span>Ultima actualizacion: Hoy, 14 de Abril 2026 - 10:35 AM</span>
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
              transition={{ delay: index * 0.08 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</p>
                  <p className="text-sm text-slate-600 mb-2">{stat.title}</p>
                  <p className="text-xs text-slate-500">{stat.trend}</p>
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
            <motion.button
              key={action.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + index * 0.06 }}
              onClick={action.action}
              className="text-left"
            >
              <Card className="w-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">{action.title}</h3>
                      <p className="text-sm text-slate-600">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-800">Actividad Reciente</h2>
            {recentActivity.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + index * 0.05 }}
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
                  <p className="font-bold text-slate-800">${item.monto.toLocaleString('es-CO')}</p>
                  <p className="text-xs text-slate-500">{item.fecha}</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
