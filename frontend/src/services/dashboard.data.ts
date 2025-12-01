import {
    Building2,
    MapPin,
    Clock,
    BookOpen,
    Activity as ActivityIcon,
    Users,
    CheckCircle2,
    TrendingUp,
    FileText,
    BarChart3,
    HandCoins,
    DoorOpen,
    Layers,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import type { DashboardStat, Activity, QuickAction, UpcomingEvent, OccupancyData } from '../models/dashboard/types';

// DashboardHome Data
export const dashboardHomeStats: DashboardStat[] = [
    {
        label: 'Total Facultades',
        value: '8',
        change: '+12.5%',
        icon: Building2,
        gradient: 'from-violet-500 to-violet-600',
        bgGradient: 'from-violet-500/10 to-violet-600/10',
        iconBg: 'bg-violet-500',
        changePositive: true
    },
    {
        label: 'Espacios Activos',
        value: '156',
        change: '+8.2%',
        icon: MapPin,
        gradient: 'from-blue-500 to-blue-600',
        bgGradient: 'from-blue-500/10 to-blue-600/10',
        iconBg: 'bg-blue-500',
        changePositive: true
    },
    {
        label: 'Horarios Creados',
        value: '342',
        change: '+23.1%',
        icon: Clock,
        gradient: 'from-emerald-500 to-emerald-600',
        bgGradient: 'from-emerald-500/10 to-emerald-600/10',
        iconBg: 'bg-emerald-500',
        changePositive: true
    },
    {
        label: 'Programas Activos',
        value: '24',
        change: '+5.4%',
        icon: BookOpen,
        gradient: 'from-amber-500 to-amber-600',
        bgGradient: 'from-amber-500/10 to-amber-600/10',
        iconBg: 'bg-amber-500',
        changePositive: true
    }
];

export const dashboardHomeActivities: Activity[] = [
    {
        id: '1',
        title: 'Nuevo Horario Creado',
        description: 'Ingeniería de Sistemas - Grupo A',
        time: 'Hace 5 minutos',
        status: 'pending',
        icon: Clock,
        color: 'bg-blue-500',
        date: '2025-11-01 10:00'
    },
    {
        id: '2',
        title: 'Espacio Actualizado',
        description: 'Laboratorio 301 - Edificio C',
        time: 'Hace 15 minutos',
        status: 'pending',
        icon: MapPin,
        color: 'bg-emerald-500',
        date: '2025-11-01 09:45'
    },
    {
        id: '3',
        title: 'Programa Activado',
        description: 'Administración de Empresas 2025-1',
        time: 'Hace 1 hora',
        status: 'completed',
        icon: BookOpen,
        color: 'bg-violet-500',
        date: '2025-11-01 09:00'
    },
    {
        id: '4',
        title: 'Conflicto Detectado',
        description: 'Aula 205 - Jueves 10:00 AM',
        time: 'Hace 2 horas',
        status: 'pending',
        icon: ActivityIcon,
        color: 'bg-amber-500',
        date: '2025-11-01 08:00'
    },
    {
        id: '5',
        title: 'Usuario Creado',
        description: 'Nuevo docente registrado',
        time: 'Hace 3 horas',
        status: 'completed',
        icon: Users,
        color: 'bg-indigo-500',
        date: '2025-11-01 07:00'
    },
    {
        id: '6',
        title: 'Préstamo Aprobado',
        description: 'Sala 101 - Reunión administrativa',
        time: 'Hace 4 horas',
        status: 'completed',
        icon: CheckCircle2,
        color: 'bg-green-500',
        date: '2025-11-01 06:00'
    }
];

export const dashboardHomeQuickStats = [
    { label: 'Tasa de Ocupación', value: '85%', icon: TrendingUp, trend: 'up' },
    { label: 'Conflictos Resueltos', value: '23', icon: CheckCircle2, trend: 'up' },
    { label: 'Espacios Disponibles', value: '12', icon: CheckCircle, trend: 'neutral' } // Changed Circle to CheckCircle for now as Circle is not imported or standard lucide
];

export const dashboardHomeOccupationDetails: OccupancyData[] = [
    {
        day: 'Lunes',
        franjas: [
            { hora: '07:00 - 09:00', ocupacion: 65, color: 'bg-blue-500' },
            { hora: '09:00 - 11:00', ocupacion: 92, color: 'bg-red-600' },
            { hora: '11:00 - 13:00', ocupacion: 88, color: 'bg-red-600' },
            { hora: '13:00 - 15:00', ocupacion: 70, color: 'bg-blue-500' },
            { hora: '15:00 - 17:00', ocupacion: 82, color: 'bg-red-600' },
            { hora: '17:00 - 19:00', ocupacion: 45, color: 'bg-emerald-500' }
        ]
    },
    {
        day: 'Martes',
        franjas: [
            { hora: '07:00 - 09:00', ocupacion: 70, color: 'bg-blue-500' },
            { hora: '09:00 - 11:00', ocupacion: 95, color: 'bg-red-600' },
            { hora: '11:00 - 13:00', ocupacion: 90, color: 'bg-red-600' },
            { hora: '13:00 - 15:00', ocupacion: 75, color: 'bg-blue-500' },
            { hora: '15:00 - 17:00', ocupacion: 85, color: 'bg-red-600' },
            { hora: '17:00 - 19:00', ocupacion: 50, color: 'bg-emerald-500' }
        ]
    },
    {
        day: 'Miércoles',
        franjas: [
            { hora: '07:00 - 09:00', ocupacion: 68, color: 'bg-blue-500' },
            { hora: '09:00 - 11:00', ocupacion: 88, color: 'bg-red-600' },
            { hora: '11:00 - 13:00', ocupacion: 92, color: 'bg-red-600' },
            { hora: '13:00 - 15:00', ocupacion: 72, color: 'bg-blue-500' },
            { hora: '15:00 - 17:00', ocupacion: 80, color: 'bg-blue-500' },
            { hora: '17:00 - 19:00', ocupacion: 48, color: 'bg-emerald-500' }
        ]
    }
];

export const dashboardHomeOccupationStats: OccupancyData[] = [
    { day: 'Lunes', value: 85, color: 'bg-red-600' },
    { day: 'Martes', value: 92, color: 'bg-blue-600' },
    { day: 'Miércoles', value: 88, color: 'bg-violet-600' },
    { day: 'Jueves', value: 78, color: 'bg-emerald-600' },
    { day: 'Viernes', value: 65, color: 'bg-amber-600' },
    { day: 'Sábado', value: 45, color: 'bg-slate-600' }
];

// ConsultorDashboard Data
export const consultorStats: DashboardStat[] = [
    {
        label: 'Espacios Disponibles',
        value: '28',
        change: '+5 desde ayer',
        icon: MapPin,
        gradient: 'from-blue-500 to-blue-600',
        bgGradient: 'from-blue-500/10 to-blue-600/10',
        iconBg: 'bg-blue-500',
        changePositive: true
    },
    {
        label: 'Horarios Consultados',
        value: '156',
        change: '+12 esta semana',
        icon: Clock,
        gradient: 'from-emerald-500 to-emerald-600',
        bgGradient: 'from-emerald-500/10 to-emerald-600/10',
        iconBg: 'bg-emerald-500',
        changePositive: true
    },
    {
        label: 'Reportes Generados',
        value: '24',
        change: '+8 este mes',
        icon: FileText,
        gradient: 'from-amber-500 to-amber-600',
        bgGradient: 'from-amber-500/10 to-amber-600/10',
        iconBg: 'bg-amber-500',
        changePositive: true
    },
    {
        label: 'Ocupación Promedio',
        value: '82%',
        change: 'Óptimo',
        icon: BarChart3,
        gradient: 'from-violet-500 to-violet-600',
        bgGradient: 'from-violet-500/10 to-violet-600/10',
        iconBg: 'bg-violet-500',
        changePositive: true
    }
];

export const consultorQuickActions: QuickAction[] = [
    {
        title: 'Consultar Horarios',
        description: 'Ver horarios disponibles',
        icon: Clock,
        color: 'from-emerald-500 to-emerald-600',
        action: 'horarios'
    },
    {
        title: 'Ver Disponibilidad',
        description: 'Espacios disponibles ahora',
        icon: MapPin,
        color: 'from-blue-500 to-blue-600',
        action: 'espacios'
    },
    {
        title: 'Generar Reporte',
        description: 'Crear nuevo reporte',
        icon: FileText,
        color: 'from-amber-500 to-amber-600',
        action: 'reportes'
    },
    {
        title: 'Ver Ocupación',
        description: 'Estadísticas de uso',
        icon: BarChart3,
        color: 'from-violet-500 to-violet-600',
        action: 'ocupacion'
    }
];

export const consultorRecentActivities: Activity[] = [
    {
        title: 'Consulta de Horario',
        description: 'Ingeniería de Sistemas - Grupo A',
        time: 'Hace 5 minutos',
        status: 'completed',
        icon: Clock,
        color: 'bg-emerald-500'
    },
    {
        title: 'Reporte Generado',
        description: 'Ocupación Semanal - Periodo 2025-1',
        time: 'Hace 15 minutos',
        status: 'completed',
        icon: FileText,
        color: 'bg-amber-500'
    },
    {
        title: 'Espacio Consultado',
        description: 'Laboratorio 301 - Edificio C',
        time: 'Hace 1 hora',
        status: 'completed',
        icon: MapPin,
        color: 'bg-blue-500'
    },
    {
        title: 'Préstamo Solicitado',
        description: 'Auditorio Central - 15 de Octubre',
        time: 'Hace 2 horas',
        status: 'pending',
        icon: HandCoins,
        color: 'bg-violet-500'
    }
];

export const consultorUpcomingEvents: UpcomingEvent[] = [
    {
        date: '22 Oct',
        title: 'Mantenimiento Programado',
        location: 'Laboratorio 301',
        time: '14:00 - 17:00',
        type: 'maintenance'
    },
    {
        date: '23 Oct',
        title: 'Evento Académico',
        location: 'Auditorio Central',
        time: '09:00 - 12:00',
        type: 'event'
    },
    {
        date: '24 Oct',
        title: 'Reserva Aprobada',
        location: 'Sala de Juntas 2',
        time: '10:00 - 11:30',
        type: 'approved'
    }
];

export const consultorOccupancyData: OccupancyData[] = [
    { day: 'Lun', percentage: 85, classes: 68 },
    { day: 'Mar', percentage: 92, classes: 72 },
    { day: 'Mié', percentage: 78, classes: 65 },
    { day: 'Jue', percentage: 70, classes: 58 },
    { day: 'Vie', percentage: 55, classes: 45 }
];

// SupervisorGeneral Data
export const supervisorMetrics: DashboardStat[] = [
    {
        label: 'Espacios Totales',
        value: '156',
        icon: Building2,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        trend: '+5%',
        trendUp: true
    },
    {
        label: 'Espacios Disponibles',
        value: '98',
        icon: CheckCircle2,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        trend: '63%',
        trendUp: true
    },
    {
        label: 'Espacios Ocupados',
        value: '58',
        icon: Clock,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        trend: '37%',
        trendUp: false
    },
    {
        label: 'Salones Abiertos',
        value: '45',
        icon: DoorOpen,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        trend: '+12',
        trendUp: true
    }
];

export const supervisorQuickActions: QuickAction[] = [
    {
        title: 'Disponibilidad de Espacios',
        description: 'Ver cronograma de ocupación de espacios',
        icon: Calendar,
        action: 'cronograma',
        color: 'from-blue-600 to-blue-700',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600'
    },
    {
        title: 'Apertura y Cierre de Salones',
        description: 'Gestionar el estado de los salones',
        icon: DoorOpen,
        action: 'apertura-cierre',
        color: 'from-purple-600 to-purple-700',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600'
    },
    {
        title: 'Estado de Recursos',
        description: 'Consultar inventario y estado de recursos',
        icon: Layers,
        action: 'estado-recursos',
        color: 'from-orange-600 to-orange-700',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600'
    }
];

export const supervisorActivityLogs: Activity[] = [
    { title: 'Salón A-101 abierto', time: 'Hace 5 minutos', tipo: 'apertura', description: '', icon: DoorOpen },
    { title: 'Proyector en B-203 reportado en mantenimiento', time: 'Hace 15 minutos', tipo: 'mantenimiento', description: '', icon: AlertCircle },
    { title: 'Salón C-305 cerrado', time: 'Hace 30 minutos', tipo: 'cierre', description: '', icon: DoorOpen },
    { title: 'Auditorio Principal reservado', time: 'Hace 1 hora', tipo: 'reserva', description: '', icon: Calendar }
];

// Audiovisual Data
export const audiovisualStats: DashboardStat[] = [
    {
        label: 'Solicitudes Pendientes',
        value: '5',
        change: '+2 hoy',
        icon: Clock,
        gradient: 'from-amber-500 to-amber-600',
        changePositive: false
    },
    {
        label: 'Aprobadas Hoy',
        value: '8',
        change: '+3 esta semana',
        icon: CheckCircle,
        gradient: 'from-emerald-500 to-emerald-600',
        changePositive: true
    },
    {
        label: 'Rechazadas Hoy',
        value: '2',
        change: '-1 vs ayer',
        icon: XCircle,
        gradient: 'from-red-500 to-red-600',
        changePositive: true
    },
    {
        label: 'Préstamos Activos',
        value: '12',
        change: 'En curso',
        icon: Calendar,
        gradient: 'from-blue-500 to-blue-600',
        changePositive: true
    }
];

export const audiovisualRequests: Activity[] = [
    { id: '1', solicitante: 'María González', espacio: 'Auditorio Central', fecha: '2025-11-05', hora: '14:00', estado: 'pendiente', title: '', description: '', time: '', icon: Clock },
    { id: '2', solicitante: 'Carlos Ruiz', espacio: 'Laboratorio 301', fecha: '2025-11-04', hora: '18:00', estado: 'pendiente', title: '', description: '', time: '', icon: Clock },
    { id: '3', solicitante: 'Ana Martínez', espacio: 'Sala de Juntas 1', fecha: '2025-11-03', hora: '09:00', estado: 'aprobado', title: '', description: '', time: '', icon: Clock },
    { id: '4', solicitante: 'Pedro López', espacio: 'Aula 205', fecha: '2025-11-02', hora: '16:00', estado: 'aprobado', title: '', description: '', time: '', icon: Clock },
    { id: '5', solicitante: 'Juan Pérez', espacio: 'Auditorio Central', fecha: '2025-11-01', hora: '08:00', estado: 'rechazado', title: '', description: '', time: '', icon: Clock }
];

export const audiovisualUpcomingLoans: UpcomingEvent[] = [
    { espacio: 'Auditorio Central', fecha: '2025-11-05', hora: '10:00', solicitante: 'Depto. Sistemas', title: '', date: '', time: '' },
    { espacio: 'Lab 301', fecha: '2025-11-05', hora: '15:00', solicitante: 'Prof. García', title: '', date: '', time: '' },
    { espacio: 'Sala Juntas 2', fecha: '2025-11-06', hora: '09:00', solicitante: 'Decanatura', title: '', date: '', time: '' }
];

export const consultorDocenteStats: DashboardStat[] = [
    { label: 'Asignaturas', value: '3 materias', icon: BookOpen, color: 'blue' },
    { label: 'Horas Semanales', value: '18 horas', icon: Clock, color: 'green' },
    { label: 'Grupos', value: '5 grupos', icon: Users, color: 'purple' }
];

export const consultorEstudianteStats: DashboardStat[] = [
    { label: 'Semestre Actual', value: '2025-1', icon: BookOpen, color: 'blue' },
    { label: 'Horas Semanales', value: '24 horas', icon: Clock, color: 'green' },
    { label: 'Asignaturas', value: '6 materias', icon: Calendar, color: 'purple' }
];
