import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Clock, DollarSign, FileCheck2, FileText, ShieldAlert, Users } from 'lucide-react';
import { reportesFinancieroService, type AdminDashboardResponse } from '../../services';
import { useAuth } from '../../../../context/AuthContext';
import { useSondeoVisible } from '../../../../hooks/useSondeoVisible';
import { currency, ACTIVITIES_PER_PAGE, type AdminFinancieroHomeProps } from './adminFinancieroHomeUtils';

/** Estado y datos del panel del administrador financiero. */
export function useAdminFinancieroHome({ onNavigate }: AdminFinancieroHomeProps) {
  const { components } = useAuth();
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
  }, [fetchDashboard]);

  // Refresca cada 60 s, solo con la pestaña visible
  useSondeoVisible(() => fetchDashboard(true), 60000);

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

  const visibleQuickActions = quickActions.filter((action) => {
    if (action.menu === 'usuarios') {
      return components.some((component) => component.nombre === 'Gestion Usuarios Financiero');
    }
    if (action.menu === 'proveedores') {
      return components.some((component) => component.nombre === 'Gestion Proveedores');
    }
    if (action.menu === 'sla') {
      return components.some((component) => component.nombre === 'Parametrizacion SLA');
    }
    return true;
  });



  return {
    components,
    dashboard,
    setDashboard,
    loading,
    setLoading,
    refreshing,
    setRefreshing,
    error,
    setError,
    lastUpdated,
    setLastUpdated,
    activityPage,
    setActivityPage,
    kanbanPage,
    setKanbanPage,
    getErrorMessage,
    fetchDashboard,
    KANBAN_PER_PAGE,
    resumen,
    distribucion,
    alertas,
    actividades,
    totalFacturas,
    totalRiesgo,
    saludOperativa,
    avanceProceso,
    alertasCriticas,
    feedUnificado,
    totalActivityPages,
    pagedFeed,
    totalKanbanPages,
    pagedKanban,
    kpiCards,
    quickActions,
    visibleQuickActions,
    onNavigate,
  };
}
