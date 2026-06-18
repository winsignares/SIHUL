import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../../share/card';
import { FileSearch, CheckCircle2, XCircle, Shield, AlertCircle } from 'lucide-react';
import { facturasService } from '../../../services/financiero';
import type { Factura as APIFactura } from '../../../models/financiero/core.models';
import { Button } from '../../../share/button';
import { useAuth } from '../../../context/AuthContext';

interface AuditoriaHomeProps {
  onGoToControl: () => void;
}

const ACTIVIDADES_POR_PAGINA = 3;

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

export default function AuditoriaHome({ onGoToControl }: AuditoriaHomeProps) {
  const { components } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentActivityPage, setCurrentActivityPage] = useState(1);
  const [statsData, setStatsData] = useState({
    porRevisar: 0,
    criticas: 0,
    aprobadas: 0,
    rechazadas: 0,
  });
  const [facturasControlPrevio, setFacturasControlPrevio] = useState<APIFactura[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [alistadas, aprobadas, rechazadas] = await Promise.all([
          facturasService.getAll({ estado: 'Alistada', ordering: '-fecha_alistamiento', limit: 200 }),
          facturasService.getAll({ estado: 'Aprobada Auditoría', limit: 200 }),
          facturasService.getAll({ estado: 'Rechazada Auditoría', limit: 200 }),
        ]);

        const alistadasList = toList<APIFactura>(alistadas);
        setFacturasControlPrevio(alistadasList);
        setStatsData({
          porRevisar: alistadasList.length,
          criticas: alistadasList.filter((factura) => Number(factura.dias_transcurridos || 0) >= 18).length,
          aprobadas: toList<APIFactura>(aprobadas).length,
          rechazadas: toList<APIFactura>(rechazadas).length,
        });
        setCurrentActivityPage(1);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const stats = useMemo(() => [
    {
      title: 'Facturas para Control Previo',
      value: String(statsData.porRevisar),
      icon: FileSearch,
      color: 'from-orange-600 to-orange-700',
      iconColor: 'text-orange-100',
      trend: 'Estado: Alistada',
    },
    {
      title: 'Casos con SLA Critico',
      value: String(statsData.criticas),
      icon: AlertCircle,
      color: 'from-red-600 to-red-700',
      iconColor: 'text-red-100',
      trend: 'Prioridad inmediata',
    },
    {
      title: 'Aprobadas',
      value: String(statsData.aprobadas),
      icon: CheckCircle2,
      color: 'from-green-600 to-green-700',
      iconColor: 'text-green-100',
      trend: 'Control previo aprobado',
    },
    {
      title: 'Rechazadas',
      value: String(statsData.rechazadas),
      icon: XCircle,
      color: 'from-slate-700 to-slate-800',
      iconColor: 'text-slate-100',
      trend: 'Devueltas a tesoreria',
    },
  ], [statsData]);

  const recentActivity = useMemo(() => (
    [...facturasControlPrevio]
      .sort((a, b) => new Date(b.fecha_alistamiento || b.fecha_recepcion || 0).getTime() - new Date(a.fecha_alistamiento || a.fecha_recepcion || 0).getTime())
      .map((factura, index) => ({
        id: `${factura.id}-${index}`,
        factura: factura.numero_factura || `FAC-${factura.id}`,
        proveedor: factura.proveedor?.razon_social || 'Sin asignar',
        monto: Number(factura.valor_total || 0),
        estado: factura.estado,
        fecha: factura.fecha_alistamiento || factura.fecha_recepcion || '',
        dias: Math.max(0, Number(factura.dias_transcurridos || 0)),
      }))
  ), [facturasControlPrevio]);

  const activityTotalPages = Math.max(1, Math.ceil(recentActivity.length / ACTIVIDADES_POR_PAGINA));
  const currentActivity = recentActivity.slice((currentActivityPage - 1) * ACTIVIDADES_POR_PAGINA, currentActivityPage * ACTIVIDADES_POR_PAGINA);
  const canShowControlPrevio = components.some((component) => component.nombre === 'Control Previo');

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-5 text-white shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-0 text-2xl font-bold">Panel de Auditoria</h1>
            <p className="text-red-100 text-sm">Control previo documental y contable antes de continuar el pago</p>
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

      {canShowControlPrevio && <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        onClick={onGoToControl}
        className="text-left h-full w-full"
      >
        <Card className="w-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <FileSearch className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">Control Previo</h3>
                <p className="text-sm text-slate-600">Revise soportes, valide la causacion y emita el concepto de auditoria.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.button>}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800">Actividad Reciente</h2>
              <p className="text-sm text-slate-600">Facturas que actualmente requieren implementacion de control previo</p>
            </div>

            {currentActivity.length === 0 ? (
              <p className="text-center text-slate-400 py-6">No hay facturas pendientes de control previo.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {currentActivity.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-slate-800 text-sm">{item.factura}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full border whitespace-nowrap bg-yellow-100 text-yellow-700 border-yellow-200">
                              {item.estado}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate">{item.proveedor} - {item.dias} dias en revision previa</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-semibold text-slate-800 text-sm">${item.monto.toLocaleString('es-CO')}</p>
                        <p className="text-xs text-slate-500">{item.fecha}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {recentActivity.length > ACTIVIDADES_POR_PAGINA && (
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-200 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentActivityPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentActivityPage === 1}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs px-2 py-1 h-7"
                    >
                      Ant.
                    </Button>
                    <span className="text-xs text-slate-600">
                      Pagina {currentActivityPage} de {activityTotalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentActivityPage((prev) => Math.min(activityTotalPages, prev + 1))}
                      disabled={currentActivityPage === activityTotalPages}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs px-2 py-1 h-7"
                    >
                      Sig.
                    </Button>
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
