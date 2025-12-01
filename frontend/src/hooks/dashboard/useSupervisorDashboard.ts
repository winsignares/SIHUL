import { useEffect, useState } from 'react';
import {
    supervisorDashboardService
} from '../../services/dashboard/supervisorDashboardAPI';
import type {
    SupervisorDashboardMetrics,
    MetricasRecursos
} from '../../services/dashboard/supervisorDashboardAPI';
import {
    supervisorMetrics,
    supervisorQuickActions,
    supervisorActivityLogs
} from '../../services/dashboard.data';
import type { DashboardStat } from '../../models/dashboard/types';
import {
    Building2,
    CheckCircle2,
    Clock,
    DoorOpen,
    AlertCircle
} from 'lucide-react';

export function useSupervisorDashboard() {
    const [metricsCards, setMetricsCards] = useState<DashboardStat[]>(supervisorMetrics);
    const [recursosCards, setRecursosCards] = useState<{ operativos: DashboardStat; mantenimiento: DashboardStat } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardMetrics();
    }, []);

    const loadDashboardMetrics = async () => {
        try {
            setLoading(true);
            setError(null);

            // Obtener métricas de espacios
            const metrics = await supervisorDashboardService.getMetricas();

            // Mapear los datos reales a las cards de espacios
            const updatedCards: DashboardStat[] = [
                {
                    label: 'Espacios Totales',
                    value: metrics.espaciosTotales.toString(),
                    icon: Building2,
                    color: 'from-blue-500 to-blue-600',
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-600',
                    trend: `+${calculateTrend(
                        metrics.espaciosTotales,
                        parseInt(supervisorMetrics[0].value as string) || 0
                    )}%`,
                    trendUp: true
                },
                {
                    label: 'Espacios Disponibles',
                    value: metrics.espaciosDisponibles.toString(),
                    icon: CheckCircle2,
                    color: 'from-green-500 to-green-600',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-600',
                    trend: `${metrics.porcentajeDisponibles}%`,
                    trendUp: true
                },
                {
                    label: 'Espacios Ocupados',
                    value: metrics.espaciosOcupados.toString(),
                    icon: Clock,
                    color: 'from-orange-500 to-orange-600',
                    bgColor: 'bg-orange-100',
                    textColor: 'text-orange-600',
                    trend: `${metrics.porcentajeOcupados}%`,
                    trendUp: false
                },
                {
                    label: 'Salones Abiertos',
                    value: metrics.salonesAbiertos.toString(),
                    icon: DoorOpen,
                    color: 'from-purple-500 to-purple-600',
                    bgColor: 'bg-purple-100',
                    textColor: 'text-purple-600',
                    trend:
                        metrics.salonesAbiertos > 0
                            ? `+${metrics.salonesAbiertos}`
                            : '0',
                    trendUp: metrics.salonesAbiertos > 0
                }
            ];

            setMetricsCards(updatedCards);

            // Obtener métricas de recursos
            try {
                const recursosMetricas = await supervisorDashboardService.getMetricasRecursos();
                
                const recursosEnMantenimiento = recursosMetricas.recursosTotales - recursosMetricas.recursosOperativos;
                
                const recursosCardsData = {
                    operativos: {
                        label: 'Recursos Operativos',
                        value: recursosMetricas.recursosOperativos.toString(),
                        icon: CheckCircle2,
                        color: 'from-green-500 to-green-600',
                        bgColor: 'bg-green-100',
                        textColor: 'text-green-600',
                        trend: `${recursosMetricas.porcentajeOperativos}% del total`,
                        trendUp: true
                    } as DashboardStat,
                    mantenimiento: {
                        label: 'Recursos en Mantenimiento',
                        value: recursosEnMantenimiento.toString(),
                        icon: AlertCircle,
                        color: 'from-orange-500 to-orange-600',
                        bgColor: 'bg-orange-100',
                        textColor: 'text-orange-600',
                        trend: `${Math.round((recursosEnMantenimiento / recursosMetricas.recursosTotales) * 100)}% del total`,
                        trendUp: false
                    } as DashboardStat
                };
                
                setRecursosCards(recursosCardsData);
            } catch (err) {
                console.warn('No se pudo obtener métricas de recursos:', err);
                setRecursosCards(null);
            }
        } catch (err) {
            console.error('Error cargando métricas del dashboard:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error al cargar las métricas'
            );
            // Mantener los valores por defecto en caso de error
            setMetricsCards(supervisorMetrics);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Calcula la tendencia como porcentaje de cambio
     */
    const calculateTrend = (current: number, previous: number): number => {
        if (previous === 0) return 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    return {
        metricsCards,
        recursosCards,
        quickActions: supervisorQuickActions,
        activityLogs: supervisorActivityLogs,
        loading,
        error,
        refetch: loadDashboardMetrics
    };
}
