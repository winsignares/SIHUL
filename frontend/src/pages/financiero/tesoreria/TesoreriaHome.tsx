import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../../share/card';
import {
  FileCheck,
  DollarSign,
  TrendingUp,
  Wallet,
  CheckCircle2,
  FileOutput,
} from 'lucide-react';
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';

interface TesoreriaHomeProps {
  onGoToAlistar: () => void;
  onGoToEnviarDireccion: () => void;
  onGoToRegistrarPago: () => void;
  onGoToComprobante: () => void;
}

export default function TesoreriaHome({
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
  const [currentActivityPage, setCurrentActivityPage] = useState(1);

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
      title: 'Factura Pagada',
      description: 'Consulta facturas pagadas y descarga el expediente completo',
      icon: FileOutput,
      color: 'from-emerald-600 to-emerald-700',
      action: onGoToComprobante,
    },
  ];

  const tesoreriaStates = ['Causada', 'Alistada', 'Enviada', 'Pago Aplicado', 'Pagada', 'Devuelta'];
  
  const recentActivity = useMemo(() => {
    const filtered = recentFacturas
      .filter(factura => tesoreriaStates.includes(factura.estado || ''))
      .map((factura, index) => {
        const fecha = factura.fecha_causacion || factura.fecha_alistamiento || factura.fecha_pago_aplicado || factura.fecha_recepcion || '';
        const accion = factura.numero_transaccion
          ? `Transaccion ${factura.numero_transaccion}`
          : factura.numero_proceso_pago
            ? `Proceso ${factura.numero_proceso_pago}`
            : factura.estado || 'Actualizacion de factura';

        return {
          id: `${factura.id}-${index}`,
          factura: factura.numero_factura || `FAC-${factura.id}`,
          proveedor: factura.proveedor?.razon_social || 'Sin Asignar',
          monto: Number(factura.valor_total || 0),
          estado: factura.estado,
          fecha,
          accion,
        };
      });
    return filtered;
  }, [recentFacturas]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [causadas, detenidas, aprobadas, autorizadas, recientes] = await Promise.all([
          facturasService.getAll({ estado: 'Causada', limit: 200 }),
          facturasService.getAll({ estado: 'Detenida', limit: 200 }),
          facturasService.getAll({ estado: 'Aprobada Auditoría', limit: 200 }),
          facturasService.getAll({ estado: 'Autorizada', limit: 200 }),
          facturasService.getAll({ ordering: '-fecha_recepcion', limit: 50 }),
        ]);

        const list = (data: unknown) => Array.isArray((data as { results?: APIFactura[] })?.results)
          ? (data as { results: APIFactura[] }).results
          : (Array.isArray(data) ? data as APIFactura[] : []);

        const porAlistar = list(causadas).length + list(detenidas).length;
        const aprobadasAuditoria = list(aprobadas).length;
        const porRegistrarPago = list(autorizadas).length;

        const valorPendiente = [...list(causadas), ...list(detenidas), ...list(aprobadas), ...list(autorizadas)]
          .reduce((sum, item) => sum + Number(item.valor_total || 0), 0);

        setStatsData({ porAlistar, aprobadasAuditoria, porRegistrarPago, valorPendiente });
        setRecentFacturas(list(recientes));
        setCurrentActivityPage(1);
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
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-5 text-white shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-0 text-2xl font-bold">Panel de Tesoreria</h1>
            <p className="text-red-100 text-sm">Gestiona alistamiento, envio, registro de pagos y expedientes pagados</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-hidden h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-4xl font-bold text-slate-800 mb-2">{loading ? '...' : stat.value}</p>
                      <p className="text-sm font-semibold text-slate-700 mb-1">{stat.title}</p>
                      <p className="text-xs text-slate-500">{stat.trend}</p>
                    </div>
                    <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <Icon className={`w-8 h-8 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + index * 0.06 }}
              onClick={action.action}
              className="text-left h-full"
            >
              <Card className="w-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group bg-gradient-to-br hover:scale-105 transform h-full overflow-hidden">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 mb-2 text-base group-hover:text-red-600 transition-colors">{action.title}</h3>
                    <p className="text-sm text-slate-600 leading-snug line-clamp-2">{action.description}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 group-hover:border-slate-300 transition-colors">
                    <span className="text-xs font-semibold text-red-600 group-hover:text-red-700">Acceder →</span>
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
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800">Actividad Reciente</h2>
              <p className="text-sm text-slate-600">Últimas acciones de tesorería</p>
            </div>
            {recentActivity.length === 0 ? (
              <p className="text-center text-slate-400 py-6">No hay actividad reciente en tesorería</p>
            ) : (
              <>
                <div className="space-y-2">
                  {recentActivity.slice((currentActivityPage - 1) * 3, currentActivityPage * 3).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.65 + index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-slate-800 text-sm">{item.factura}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${getEstadoBadge(item.estado)}`}>
                              {item.estado}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate">{item.proveedor} - {item.accion}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-semibold text-slate-800 text-sm">${item.monto.toLocaleString('es-CO')}</p>
                        <p className="text-xs text-slate-500">{item.fecha}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {recentActivity.length > 3 && (
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-200 mt-4">
                    <button
                      onClick={() => setCurrentActivityPage(prev => Math.max(1, prev - 1))}
                      disabled={currentActivityPage === 1}
                      className="text-xs px-2 py-1 h-7 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ant.
                    </button>
                    <span className="text-xs text-slate-600">
                      Página {currentActivityPage} de {Math.ceil(recentActivity.length / 3)}
                    </span>
                    <button
                      onClick={() => setCurrentActivityPage(prev => Math.min(Math.ceil(recentActivity.length / 3), prev + 1))}
                      disabled={currentActivityPage === Math.ceil(recentActivity.length / 3)}
                      className="text-xs px-2 py-1 h-7 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sig.
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
