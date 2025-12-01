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
import { ocupacionSemanalService } from '../../services/reporte/ocupacionSemanalAPI';
import { periodoService, type PeriodoAcademico } from '../../services/periodos/periodoAPI';
import type { EspacioOcupacion } from '../../models/index';
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
    const [topEspaciosOcupados, setTopEspaciosOcupados] = useState<EspacioOcupacion[]>([]);
    const [periodoActivo, setPeriodoActivo] = useState<PeriodoAcademico | null>(null);
    const [isLoadingPeriodo, setIsLoadingPeriodo] = useState(true);

    // Derived state
    const recentActivities = activities.slice(0, 4);

    // Load real data from API
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setIsLoadingStats(true);
                setIsLoadingOccupation(true);
                setIsLoadingActivities(true);
                setIsLoadingPeriodo(true);

                // Fetch all data in parallel
                const [
                    facultadesResponse, 
                    programasResponse, 
                    espaciosResponse, 
                    asignaturasResponse,
                    dashboardStats,
                    ocupacionSemanalResponse,
                    periodosResponse
                ] = await Promise.all([
                    facultadService.list(),
                    programaService.listarProgramas(),
                    espacioService.list(),
                    asignaturaService.list(),
                    obtenerEstadisticasDashboard(),
                    ocupacionSemanalService.getOcupacionSemanal(undefined, 0),
                    periodoService.listarPeriodos()
                ]);

                const facultades = facultadesResponse.facultades || [];
                const programas = programasResponse.programas || [];
                const espacios = espaciosResponse.espacios || [];
                const asignaturas = asignaturasResponse.asignaturas || [];

                // Obtener período activo
                const periodos = periodosResponse.periodos || [];
                const periodoActual = periodos.find(p => p.activo) || periodos[0] || null;
                setPeriodoActivo(periodoActual);
                setIsLoadingPeriodo(false);

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

                // Procesar espacios más ocupados
                if (ocupacionSemanalResponse?.ocupacion) {
                    const espaciosMapeados: EspacioOcupacion[] = ocupacionSemanalResponse.ocupacion.map((espacio: any) => ({
                        id: espacio.id.toString(),
                        nombre: espacio.nombre,
                        tipo: espacio.tipo,
                        capacidad: espacio.capacidad,
                        horasOcupadas: espacio.horasOcupadasSemana,
                        horasDisponibles: espacio.horasDisponibles,
                        porcentajeOcupacion: espacio.porcentajeOcupacion,
                        edificio: espacio.edificio,
                        jornada: {
                            manana: Math.round(espacio.porcentajeManana),
                            tarde: Math.round(espacio.porcentajeTarde),
                            noche: Math.round(espacio.porcentajeNoche)
                        }
                    }));
                    
                    // Ordenar por porcentaje de ocupación y tomar los top 10
                    const topEspacios = espaciosMapeados
                        .sort((a, b) => b.porcentajeOcupacion - a.porcentajeOcupacion)
                        .slice(0, 10);
                    
                    setTopEspaciosOcupados(topEspacios);
                }

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
                setIsLoadingPeriodo(false);
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
        topEspaciosOcupados,
        periodoActivo,
        state: {
            showReportModal,
            isGeneratingReport,
            reportGenerated,
            showOccupationDetails,
            showAllActivities,
            isLoadingStats,
            isLoadingOccupation,
            isLoadingActivities,
            isLoadingPeriodo
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
