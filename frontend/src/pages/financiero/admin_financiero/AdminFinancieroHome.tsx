import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FileCheck2,
  FileText,
  FolderKanban,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { reportesFinancieroService, type AdminDashboardResponse } from '../../../services/financiero';

interface AdminFinancieroHomeProps {
  onNavigate: (menu: string) => void;
}

const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const ACTIVITIES_PER_PAGE = 4;

export default function AdminFinancieroHomeReal({ onNavigate }: AdminFinancieroHomeProps) {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [kanbanPage, setKanbanPage] = useState(1);

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
    const interval = window.setInterval(() => void fetchDashboard(true), 60000);
    return () => window.clearInterval(interval);
  }, [fetchDashboard]);

  const KANBAN_PER_PAGE = 5;

  const resumen = dashboard?.resumen;
  const distribucion = useMemo(() => dashboard?.distribucion_estados || [], [dashboard]);
  const alertas = useMemo(() => dashboard?.alertas?.slice(0, 8) || [], [dashboard]);
  const actividades = useMemo(() => dashboard?.actividades?.slice(0, 20) || [], [dashboard]);

  const totalFacturas = useMemo(
    () => resumen?.total_facturas ?? distribucion.reduce((acc, item) => acc + item.cantidad, 0),
    [resumen?.total_facturas, distribucion]
  );
  const totalRiesgo = resumen?.facturas_riesgo ?? 0;
  const saludOperativa = totalFacturas > 0 ? Math.max(0, Math.min(100, ((totalFacturas - totalRiesgo) / totalFacturas) * 100)) : 100;
  const avanceProceso = totalFacturas > 0 ? Math.max(0, Math.min(100, ((resumen?.facturas_en_proceso ?? 0) / totalFacturas) * 100)) : 0;
  const alertasCriticas = resumen?.facturas_vencidas ?? 0;

  // Merge alertas + actividades en un feed unificado
  const feedUnificado = useMemo(() => {
    const alertFeed = alertas.map((a) => ({
      id: `alert-${a.id}`,
      tipo: 'alerta' as const,
      titulo: a.numero_factura,
      subtitulo: `${a.dias_transcurridos} días transcurridos`,
      riesgo: a.indicador_riesgo,
      estado: a.estado,
      valor: a.valor_total,
    }));
    const actFeed = actividades.map((a) => ({
      id: `act-${a.id}`,
      tipo: 'actividad' as const,
      titulo: a.numero_factura || 'Sin factura',
      subtitulo: `${a.usuario_nombre} · ${a.accion} · ${new Date(a.fecha_accion).toLocaleString('es-CO')}`,
      riesgo: null as string | null,
      estado: a.estado_nuevo ?? null,
      valor: null as number | null,
    }));
    return [...alertFeed, ...actFeed];
  }, [actividades, alertas]);

  const totalActivityPages = Math.max(1, Math.ceil(feedUnificado.length / ACTIVITIES_PER_PAGE));

  const pagedFeed = useMemo(() => {
    const start = (activityPage - 1) * ACTIVITIES_PER_PAGE;
    return feedUnificado.slice(start, start + ACTIVITIES_PER_PAGE);
  }, [feedUnificado, activityPage]);

  const totalKanbanPages = Math.max(1, Math.ceil(distribucion.length / KANBAN_PER_PAGE));
  const pagedKanban = useMemo(() => {
    const start = (kanbanPage - 1) * KANBAN_PER_PAGE;
    return distribucion.slice(start, start + KANBAN_PER_PAGE);
  }, [distribucion, kanbanPage, KANBAN_PER_PAGE]);

  useEffect(() => { setKanbanPage(1); }, [distribucion.length]);
  useEffect(() => { setKanbanPage((prev) => Math.min(prev, totalKanbanPages)); }, [totalKanbanPages]);

  useEffect(() => { setActivityPage(1); }, [feedUnificado.length]);
  useEffect(() => { setActivityPage((prev) => Math.min(prev, totalActivityPages)); }, [totalActivityPages]);

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

  const quickActions = [
    { label: 'Usuarios', icon: Users, menu: 'usuarios' },
    { label: 'Proveedores', icon: Building2, menu: 'proveedores' },
    { label: 'SLA', icon: Clock, menu: 'sla' },
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-800 via-red-700 to-red-900 p-6 text-white shadow-xl"
      >
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-red-500/50 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-amber-400/20 blur-2xl" />

        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Panel de Administración Financiera</h1>
            <p className="mt-2 text-sm leading-6 text-red-50/90">
              Monitoreo operativo, alertas y control integral del flujo financiero desde una vista ejecutiva accionable.
            </p>
            <p className="mt-1 text-xs text-red-200/80">
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

          {/* Accesos rápidos en el header */}
          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button
                onClick={() => void fetchDashboard(true)}
                disabled={refreshing}
                className="bg-white/15 border border-white/30 hover:bg-white/25 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-3 2xl:grid-cols-5">
              {quickActions.map((qa) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.menu}
                    onClick={() => onNavigate(qa.menu)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 border border-white/20 px-3 py-3 text-center text-white transition-all hover:bg-white/20"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{qa.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {loading && (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando panel...
          </CardContent>
        </Card>
      )}
      {error && <Card><CardContent className="p-6 text-red-600">{error}</CardContent></Card>}

      {!loading && !error && resumen && (
        <>
          {/* KPI Cards principales */}
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
                          <p className="text-3xl font-black text-slate-900">{card.value}</p>
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

          {/* Panel de seguimiento y actividad reciente */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-slate-900">Panel de seguimiento y trazabilidad</CardTitle>
                    <CardDescription>
                      Consulta el estado general del proceso en el Kanban resumido y revisa al mismo tiempo los movimientos más recientes del módulo.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => void fetchDashboard(true)}
                    variant="outline"
                    disabled={refreshing}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 shrink-0"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                  {/* Panel de seguimiento */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Panel de seguimiento</h3>
                        <p className="text-sm text-slate-500">Identifica rápidamente en qué etapas se concentra hoy el mayor volumen de facturas.</p>
                      </div>
                      {distribucion.length > KANBAN_PER_PAGE && (
                        <Badge variant="outline" className="shrink-0">
                          {kanbanPage} / {totalKanbanPages}
                        </Badge>
                      )}
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-10 text-slate-400">
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Cargando flujo...
                      </div>
                    ) : distribucion.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
                        <FolderKanban className="mx-auto mb-3 h-8 w-8 opacity-30" />
                        Sin movimiento visible en este momento.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid gap-3">
                          {pagedKanban.map((item) => (
                            <div key={item.estado} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{item.estado}</p>
                                <p className="mt-1 text-sm text-slate-500">{item.cantidad} factura(s)</p>
                              </div>
                              <Badge className="bg-red-100 text-red-700 border border-red-200 shrink-0">{item.cantidad}</Badge>
                            </div>
                          ))}
                        </div>

                        {totalKanbanPages > 1 && (
                          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                            <p className="text-sm text-slate-500">
                              {(kanbanPage - 1) * KANBAN_PER_PAGE + 1}–{Math.min(kanbanPage * KANBAN_PER_PAGE, distribucion.length)} de {distribucion.length}
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setKanbanPage((p) => Math.max(1, p - 1))}
                                disabled={kanbanPage === 1}
                                className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Anterior
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setKanbanPage((p) => Math.min(totalKanbanPages, p + 1))}
                                disabled={kanbanPage === totalKanbanPages}
                                className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Siguiente
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actividad reciente + alertas unificadas */}
                  <div className="space-y-4 border-t border-slate-200 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Actividad reciente</h3>
                        <p className="text-sm text-slate-500">Sigue los últimos cambios y alertas de riesgo del flujo financiero.</p>
                      </div>
                      {feedUnificado.length > ACTIVITIES_PER_PAGE && (
                        <Badge variant="outline">
                          Página {activityPage} de {totalActivityPages}
                        </Badge>
                      )}
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-10 text-slate-400">
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Cargando actividad...
                      </div>
                    ) : feedUnificado.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
                        <FileText className="mx-auto mb-3 h-8 w-8 opacity-30" />
                        No hay actividad reciente.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pagedFeed.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.24 + index * 0.05 }}
                            className={`w-full rounded-2xl border p-4 ${
                              item.tipo === 'alerta'
                                ? 'border-amber-200 bg-amber-50/40'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-semibold text-slate-900">{item.titulo}</p>
                                  {item.tipo === 'alerta' ? (
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                                  ) : (
                                    <Eye className="h-4 w-4 shrink-0 text-red-600" />
                                  )}
                                </div>
                                <p className="mt-1 truncate text-sm text-slate-600">{item.subtitulo}</p>
                              </div>
                              {item.valor != null && (
                                <p className="shrink-0 text-sm font-bold text-slate-900">
                                  {currency.format(item.valor)}
                                </p>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.riesgo && (
                                <Badge className={`border ${item.riesgo === 'vencida' || item.riesgo === 'atrasada' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                  {item.riesgo}
                                </Badge>
                              )}
                              {item.estado && (
                                <Badge variant="outline">{item.estado}</Badge>
                              )}
                            </div>
                          </motion.div>
                        ))}

                        {totalActivityPages > 1 && (
                          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                            <p className="text-sm text-slate-500">
                              Mostrando {(activityPage - 1) * ACTIVITIES_PER_PAGE + 1} a {Math.min(activityPage * ACTIVITIES_PER_PAGE, feedUnificado.length)} de {feedUnificado.length}
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                                disabled={activityPage === 1}
                                className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Anterior
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                                disabled={activityPage === totalActivityPages}
                                className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Siguiente
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
