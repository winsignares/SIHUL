import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
    dashboardHomeStats,
    dashboardHomeActivities,
    dashboardHomeQuickStats,
    dashboardHomeOccupationDetails,
    dashboardHomeOccupationStats
} from '../../services/dashboard.data';
import { facultadService } from '../../services/facultades/facultadesAPI';
import { programaService } from '../../services/programas/programaAPI';
import { espacioService } from '../../services/espacios/espaciosAPI';
import { asignaturaService } from '../../services/asignaturas/asignaturaAPI';
import { obtenerEstadisticasDashboard } from '../../services/dashboard/dashboardAPI';
import type { DashboardStat } from '../../models/dashboard/types';
import {
    Clock,
    MapPin,
    BookOpen,
    FileText,
    CheckCircle2,
    AlertCircle,
    Bell
} from 'lucide-react';

export function useDashboardHome() {
    const { showNotification } = useTheme();

    // State
    const [showReportModal, setShowReportModal] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportGenerated, setReportGenerated] = useState(false);
    const [showOccupationDetails, setShowOccupationDetails] = useState(false);
    const [showAllActivities, setShowAllActivities] = useState(false);
    const [activities, setActivities] = useState(dashboardHomeActivities);
    const [stats, setStats] = useState<DashboardStat[]>(dashboardHomeStats);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [occupationStats, setOccupationStats] = useState(dashboardHomeOccupationStats);
    const [occupationDetails, setOccupationDetails] = useState(dashboardHomeOccupationDetails);
    const [isLoadingOccupation, setIsLoadingOccupation] = useState(true);
    const [isLoadingActivities, setIsLoadingActivities] = useState(true);

    // Derived state
    const recentActivities = activities.slice(0, 4);

    // Load real data from API
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setIsLoadingStats(true);
                setIsLoadingOccupation(true);
                setIsLoadingActivities(true);

                // Fetch all data in parallel
                const [
                    facultadesResponse, 
                    programasResponse, 
                    espaciosResponse, 
                    asignaturasResponse,
                    dashboardStats
                ] = await Promise.all([
                    facultadService.list(),
                    programaService.listarProgramas(),
                    espacioService.list(),
                    asignaturaService.list(),
                    obtenerEstadisticasDashboard() // Obtener usuario del contexto si está disponible
                ]);

                const facultades = facultadesResponse.facultades || [];
                const programas = programasResponse.programas || [];
                const espacios = espaciosResponse.espacios || [];
                const asignaturas = asignaturasResponse.asignaturas || [];

                // Update stats with real data
                const updatedStats: DashboardStat[] = [
                    {
                        label: 'Total Facultades',
                        value: facultades.length.toString(),
                        change: '+12.5%',
                        icon: dashboardHomeStats[0].icon,
                        gradient: 'from-violet-500 to-violet-600',
                        bgGradient: 'from-violet-500/10 to-violet-600/10',
                        iconBg: 'bg-violet-500',
                        changePositive: true
                    },
                    {
                        label: 'Espacios Activos',
                        value: espacios.length.toString(),
                        change: '+8.2%',
                        icon: dashboardHomeStats[1].icon,
                        gradient: 'from-blue-500 to-blue-600',
                        bgGradient: 'from-blue-500/10 to-blue-600/10',
                        iconBg: 'bg-blue-500',
                        changePositive: true
                    },
                    {
                        label: 'Asignaturas',
                        value: asignaturas.length.toString(),
                        change: '+23.1%',
                        icon: dashboardHomeStats[2].icon,
                        gradient: 'from-emerald-500 to-emerald-600',
                        bgGradient: 'from-emerald-500/10 to-emerald-600/10',
                        iconBg: 'bg-emerald-500',
                        changePositive: true
                    },
                    {
                        label: 'Programas Activos',
                        value: programas.length.toString(),
                        change: '+5.4%',
                        icon: dashboardHomeStats[3].icon,
                        gradient: 'from-amber-500 to-amber-600',
                        bgGradient: 'from-amber-500/10 to-amber-600/10',
                        iconBg: 'bg-amber-500',
                        changePositive: true
                    }
                ];

                setStats(updatedStats);
                setIsLoadingStats(false);

                // Actualizar estadísticas de ocupación
                if (dashboardStats.ocupacionSemanal.length > 0) {
                    setOccupationStats(dashboardStats.ocupacionSemanal);
                }
                if (dashboardStats.ocupacionDetallada.length > 0) {
                    setOccupationDetails(dashboardStats.ocupacionDetallada);
                }
                setIsLoadingOccupation(false);

                // Actualizar actividades recientes con iconos
                if (dashboardStats.actividadesRecientes.length > 0) {
                    const actividadesConIconos = dashboardStats.actividadesRecientes.map(act => {
                        let icon = Clock;
                        if (act.title.toLowerCase().includes('aprobado')) icon = CheckCircle2;
                        else if (act.title.toLowerCase().includes('rechazado')) icon = AlertCircle;
                        else if (act.title.toLowerCase().includes('espacio')) icon = MapPin;
                        else if (act.title.toLowerCase().includes('notificación')) icon = Bell;
                        else if (act.title.toLowerCase().includes('asignatura')) icon = BookOpen;
                        else if (act.title.toLowerCase().includes('reporte')) icon = FileText;
                        
                        return { ...act, icon };
                    });
                    setActivities(actividadesConIconos as any);
                }
                setIsLoadingActivities(false);

            } catch (error) {
                console.error('Error loading dashboard data:', error);
                setIsLoadingStats(false);
                setIsLoadingOccupation(false);
                setIsLoadingActivities(false);
                // Keep default stats if API fails
            }
        };

        loadDashboardData();
    }, []);

    // Handlers
    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        setReportGenerated(false);

        setTimeout(() => {
            setIsGeneratingReport(false);
            setReportGenerated(true);

            setTimeout(() => {
                showNotification({ message: '✅ El reporte ha sido generado exitosamente', type: 'success' });
                setShowReportModal(false);
                setReportGenerated(false);
            }, 1500);
        }, 2000);
    };

    return {
        stats,
        activities,
        recentActivities,
        quickStats: dashboardHomeQuickStats,
        occupationDetails,
        occupationStats,
        state: {
            showReportModal,
            isGeneratingReport,
            reportGenerated,
            showOccupationDetails,
            showAllActivities,
            isLoadingStats,
            isLoadingOccupation,
            isLoadingActivities
        },
        setters: {
            setShowReportModal,
            setShowOccupationDetails,
            setShowAllActivities
        },
        handlers: {
            handleGenerateReport
        }
    };
}
