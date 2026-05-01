import { useEffect, useMemo, useState } from 'react';
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
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';

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
  const [statsData, setStatsData] = useState({
    porAlistar: 0,
    aprobadasAuditoria: 0,
    porRegistrarPago: 0,
    valorPendiente: 0,
  });
  const [recentFacturas, setRecentFacturas] = useState<APIFactura[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => [
    {
      title: 'Facturas para Alistar',
      value: String(statsData.porAlistar),
      icon: FileCheck,
      color: 'from-blue-600 to-blue-700',
      iconColor: 'text-blue-100',
      trend: 'Estado: Causadas/Detenidas',
    },
    {
      title: 'Aprobadas por Auditoria',
      value: String(statsData.aprobadasAuditoria),
      icon: CheckCircle2,
      color: 'from-purple-600 to-purple-700',
      iconColor: 'text-purple-100',
      trend: 'Listas para enviar',
    },
    {
      title: 'Pagos por Registrar',
      value: String(statsData.porRegistrarPago),
      icon: DollarSign,
      color: 'from-green-600 to-green-700',
      iconColor: 'text-green-100',
      trend: 'Pago aplicado en portal bancario',
    },
    {
      title: 'Valor Total Pendiente',
      value: `$${(statsData.valorPendiente / 1000000).toFixed(1)}M`,
      icon: TrendingUp,
      color: 'from-red-600 to-red-700',
      iconColor: 'text-red-100',
      trend: 'Pendiente de cierre contable',
    },
  ], [statsData]);

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

  const recentActivity = useMemo(() => recentFacturas.map((factura, index) => {
    const fecha = factura.fecha_causacion || factura.fecha_alistamiento || factura.fecha_pago_aplicado || factura.fecha_recepcion || '';
    const accion = factura.numero_transaccion
      ? `Transaccion ${factura.numero_transaccion}`
      : factura.numero_proceso_pago
        ? `Proceso ${factura.numero_proceso_pago}`
        : 'Actualizacion de factura';

    return {
      id: `${factura.id}-${index}`,
      factura: factura.numero_factura || `FAC-${factura.id}`,
      proveedor: factura.proveedor?.razon_social || 'Sin Asignar',
      monto: Number(factura.valor_total || 0),
      estado: factura.estado,
      fecha,
      accion,
    };
  }), [recentFacturas]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [causadas, detenidas, aprobadas, autorizadas, pagosAplicados, recientes] = await Promise.all([
          facturasService.getAll({ estado: 'Causada', limit: 200 }),
          facturasService.getAll({ estado: 'Detenida', limit: 200 }),
          facturasService.getAll({ estado: 'Aprobada Auditoría', limit: 200 }),
          facturasService.getAll({ estado: 'Autorizada', limit: 200 }),
          facturasService.getAll({ estado: 'Pago Aplicado', limit: 200 }),
          facturasService.getAll({ ordering: '-fecha_recepcion', limit: 5 }),
        ]);

        const list = (data: unknown) => Array.isArray((data as { results?: APIFactura[] })?.results)
          ? (data as { results: APIFactura[] }).results
          : (Array.isArray(data) ? data as APIFactura[] : []);

        const porAlistar = list(causadas).length + list(detenidas).length;
        const aprobadasAuditoria = list(aprobadas).length;
        const porRegistrarPago = list(autorizadas).length;

        const valorPendiente = [...list(causadas), ...list(detenidas), ...list(aprobadas), ...list(autorizadas), ...list(pagosAplicados)]
          .reduce((sum, item) => sum + Number(item.valor_total || 0), 0);

        setStatsData({ porAlistar, aprobadasAuditoria, porRegistrarPago, valorPendiente });
        setRecentFacturas(list(recientes));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Alistada':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pago Aplicado':
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
          <span>Ultima actualizacion: {new Date().toLocaleString('es-CO')}</span>
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
                  <p className="text-3xl font-bold text-slate-800 mb-1">{loading ? '...' : stat.value}</p>
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
