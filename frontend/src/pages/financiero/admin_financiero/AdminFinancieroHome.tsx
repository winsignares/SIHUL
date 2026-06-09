import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import { AlertTriangle, ArrowRight, BarChart3, Building2, Clock, DollarSign, FileCheck2, FileText, Layers3, RefreshCw, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import { reportesFinancieroService, type AdminDashboardResponse } from '../../../services/financiero';

interface AdminFinancieroHomeProps {
  onNavigate: (menu: string) => void;
}

const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function AdminFinancieroHomeReal({ onNavigate }: AdminFinancieroHomeProps) {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getErrorMessage = (e: unknown) => (e instanceof Error ? e.message : 'No se pudo cargar el dashboard de administración financiera.');

  const fetchDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);
    try {
      const data = await reportesFinancieroService.getDashboardAdmin();
      setDashboard(data);
      setLastUpdated(new Date());
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      if (showRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
    const interval = window.setInterval(() => {
      void fetchDashboard(true);
    }, 60000);

    return () => window.clearInterval(interval);
  }, [fetchDashboard]);

  const resumen = dashboard?.resumen;
  const distribucion = useMemo(() => dashboard?.distribucion_estados?.slice(0, 8) || [], [dashboard]);
  const alertas = useMemo(() => dashboard?.alertas?.slice(0, 8) || [], [dashboard]);
  const actividades = useMemo(() => dashboard?.actividades?.slice(0, 6) || [], [dashboard]);
  const totalFacturas = useMemo(
    () => resumen?.total_facturas ?? distribucion.reduce((acc, item) => acc + item.cantidad, 0),
    [resumen?.total_facturas, distribucion]
  );
  const totalRiesgo = resumen?.facturas_riesgo ?? 0;
  const saludOperativa = totalFacturas > 0 ? Math.max(0, Math.min(100, ((totalFacturas - totalRiesgo) / totalFacturas) * 100)) : 100;
  const avanceProceso = totalFacturas > 0 ? Math.max(0, Math.min(100, ((resumen?.facturas_en_proceso ?? 0) / totalFacturas) * 100)) : 0;
  const alertasCriticas = resumen?.facturas_vencidas ?? 0;

  const kpiCards = useMemo(
    () => [
      {
        title: 'Facturas en Proceso',
        value: resumen?.facturas_en_proceso ?? 0,
        icon: FileText,
        subtitle: `${avanceProceso.toFixed(0)}% del total del flujo`,
        progress: avanceProceso,
        iconClass: 'text-orange-700',
        bgClass: 'from-amber-50 via-orange-50 to-red-50 border-orange-200',
        progressClass: 'bg-gradient-to-r from-orange-500 to-red-500',
        onClick: () => onNavigate('reportes'),
      },
      {
        title: 'Facturas con Riesgo',
        value: resumen?.facturas_riesgo ?? 0,
        icon: ShieldAlert,
        subtitle: `${alertasCriticas} críticas vencidas`,
        progress: totalFacturas > 0 ? Math.min(100, ((resumen?.facturas_riesgo ?? 0) / totalFacturas) * 100) : 0,
        iconClass: 'text-red-700',
        bgClass: 'from-red-50 via-rose-50 to-orange-50 border-rose-200',
        progressClass: 'bg-gradient-to-r from-red-500 to-rose-500',
        onClick: () => onNavigate('reportes'),
      },
      {
        title: 'Monto en Trámite',
        value: currency.format(resumen?.monto_total_tramite ?? 0),
        icon: DollarSign,
        subtitle: 'Valor pendiente por procesar',
        progress: saludOperativa,
        iconClass: 'text-emerald-700',
        bgClass: 'from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200',
        progressClass: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        onClick: () => onNavigate('reportes'),
      },
      {
        title: 'Pagos Aplicados (Mes)',
        value: resumen?.pagos_aplicados_mes ?? 0,
        icon: FileCheck2,
        subtitle: 'Pagos cerrados en el periodo',
        progress: totalFacturas > 0 ? Math.min(100, ((resumen?.pagos_aplicados_mes ?? 0) / totalFacturas) * 100) : 0,
        iconClass: 'text-blue-700',
        bgClass: 'from-blue-50 via-indigo-50 to-sky-50 border-blue-200',
        progressClass: 'bg-gradient-to-r from-blue-500 to-indigo-500',
        onClick: () => onNavigate('reportes'),
      },
    ],
    [alertasCriticas, avanceProceso, onNavigate, resumen, saludOperativa, totalFacturas]
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-700 to-red-800 p-6 text-white shadow-xl"
      >
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-red-500/50 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-amber-400/20 blur-2xl" />
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración Financiera</h1>
            <p className="text-red-100 text-sm mt-1">Monitoreo operativo, alertas y control integral del flujo financiero desde una vista ejecutiva más corta y accionable.</p>
            <p className="text-red-200/90 text-xs mt-2">
              {lastUpdated ? `Última actualización: ${lastUpdated.toLocaleString('es-CO')}` : 'Sincronizando información...'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                Salud operativa: {saludOperativa.toFixed(0)}%
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">En proceso: {resumen?.facturas_en_proceso ?? 0}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Riesgo: {resumen?.facturas_riesgo ?? 0}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void fetchDashboard(true)} disabled={refreshing} className="bg-white/15 border border-white/30 hover:bg-white/25 text-white">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
            <Button onClick={() => onNavigate('reportes')} className="bg-white text-red-700 hover:bg-red-50">
              <TrendingUp className="w-4 h-4 mr-2" />
              Ver reportes
            </Button>
          </div>
        </div>
      </motion.div>

      {loading && <Card><CardContent className="p-6 text-slate-600">Cargando panel...</CardContent></Card>}
      {error && <Card><CardContent className="p-6 text-red-600">{error}</CardContent></Card>}

      {!loading && !error && resumen && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  whileHover={{ y: -5, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                >
                  <Card onClick={card.onClick} className={`cursor-pointer bg-gradient-to-br ${card.bgClass} hover:shadow-lg transition-all`}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600">{card.title}</p>
                          <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                        </div>
                        <div className="rounded-xl bg-white/70 p-2 shadow-sm">
                          <Icon className={`w-6 h-6 ${card.iconClass}`} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600">{card.subtitle}</p>
                        <div className="h-1.5 rounded-full bg-white/80 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, card.progress))}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-1.5 ${card.progressClass}`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-4">
                <p className="text-xs text-slate-600">Usuarios financieros activos</p>
                <p className="text-xl font-bold text-slate-900">{resumen.usuarios_activos}</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 hover:shadow-sm transition-shadow" onClick={() => onNavigate('proveedores')}>
              <CardContent className="p-4">
                <p className="text-xs text-slate-600">Proveedores activos</p>
                <p className="text-xl font-bold text-slate-900">{resumen.proveedores_activos ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 hover:shadow-sm transition-shadow" onClick={() => onNavigate('reportes')}>
              <CardContent className="p-4">
                <p className="text-xs text-slate-600">Facturas registradas</p>
                <p className="text-xl font-bold text-slate-900">{totalFacturas}</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 hover:shadow-sm transition-shadow" onClick={() => onNavigate('sla')}>
              <CardContent className="p-4">
                <p className="text-xs text-slate-600">Tiempo promedio</p>
                <p className="text-xl font-bold text-slate-900">{resumen.tiempo_promedio_dias} días</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="border-red-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-red-600" />Distribución por Estado</CardTitle>
                <CardDescription>Estado actual del flujo financiero</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {distribucion.length === 0 && (
                  <p className="text-sm text-slate-500">Aún no hay facturas para construir la distribución de estados.</p>
                )}
                {distribucion.map((item) => {
                  const porcentaje = Math.min(100, (item.cantidad / Math.max(1, totalFacturas)) * 100);
                  return (
                    <div key={item.estado} className="space-y-1 rounded-lg bg-slate-50/80 p-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.estado}</span>
                        <span className="font-semibold">{item.cantidad} ({porcentaje.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 rounded bg-slate-200 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${porcentaje}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-amber-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-600" />Alertas de Riesgo</CardTitle>
                <CardDescription>Facturas con atención prioritaria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {alertas.length === 0 && <p className="text-sm text-slate-500">Sin alertas activas. El flujo está estable en este momento.</p>}
                {alertas.map((alerta) => (
                  <motion.div key={alerta.id} whileHover={{ x: 3 }} className="border rounded-lg p-3 flex justify-between gap-2 bg-amber-50/40">
                    <div>
                      <p className="font-medium text-sm">{alerta.numero_factura}</p>
                      <p className="text-xs text-slate-500">{alerta.estado} · {alerta.dias_transcurridos} días</p>
                    </div>
                    <Badge className={alerta.indicador_riesgo === 'vencida' || alerta.indicador_riesgo === 'atrasada' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                      {alerta.indicador_riesgo}
                    </Badge>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-indigo-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layers3 className="w-5 h-5 text-indigo-600" />Actividad Reciente del Flujo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {actividades.length === 0 && <p className="text-sm text-slate-500">Sin actividad reciente registrada en historial.</p>}
              {actividades.map((a) => (
                <motion.div key={a.id} whileHover={{ y: -2 }} className="border rounded-lg p-3 bg-indigo-50/30">
                  <p className="text-sm font-medium">{a.usuario_nombre} · {a.accion}</p>
                  <p className="text-xs text-slate-500">{a.numero_factura || 'Sin factura'} · {new Date(a.fecha_accion).toLocaleString('es-CO')}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-700 via-red-700 to-red-600 p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between text-white">
              <p className="text-sm font-semibold">Accesos rápidos</p>
              <p className="text-xs text-red-100">Navega directo a los módulos principales</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={() => onNavigate('usuarios')}
                className="justify-between bg-red-600/70 hover:bg-red-500 text-white border border-white/20"
              >
                <span className="flex items-center gap-2"><Users className="w-4 h-4" />Gestión de usuarios</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => onNavigate('proveedores')}
                className="justify-between bg-red-600/70 hover:bg-red-500 text-white border border-white/20"
              >
                <span className="flex items-center gap-2"><Building2 className="w-4 h-4" />Gestión de proveedores</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => onNavigate('sla')}
                className="justify-between bg-red-600/70 hover:bg-red-500 text-white border border-white/20"
              >
                <span className="flex items-center gap-2"><Clock className="w-4 h-4" />Parametrización SLA</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
