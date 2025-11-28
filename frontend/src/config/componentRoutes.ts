import {
    LayoutDashboard,
    Building2,
    Clock,
    HandCoins,
    Calendar,
    Bot,
    BarChart3,
    FileText,
    Shield,
    Zap,
    MapPin,
    DoorOpen,
    Wrench,
    type LucideIcon
} from 'lucide-react';

/**
 * Mapeo de códigos de componentes a rutas del frontend
 */
export const COMPONENT_ROUTES: Record<string, string> = {
    // Admin - Planeación
    'ADMIN_DASHBOARD': '/admin/dashboard',
    'CENTRO_INSTITUCIONAL': '/admin/centro-institucional',
    'CENTRO_HORARIOS': '/admin/centro-horarios',
    'PRESTAMOS_ESPACIOS': '/admin/prestamos',
    'PERIODOS_ACADEMICOS': '/admin/periodos',
    'ASISTENTES_VIRTUALES': '/admin/asistente-virtual',
    'OCUPACION_SEMANAL': '/admin/ocupacion',
    'REPORTES_GENERALES': '/admin/reportes',
    'GESTION_USUARIOS': '/admin/usuarios',
    'ASIGNACION_AUTOMATICA': '/admin/asignacion',

    // Supervisor General
    'SUPERVISOR_DASHBOARD': '/supervisor/dashboard',
    'DISPONIBILIDAD_ESPACIOS': '/supervisor/espacios',
    'APERTURA_CIERRE_SALONES': '/supervisor/prestamos',
    'ESTADO_RECURSOS': '/supervisor/recursos',
    'ASISTENTES_VIRTUALES_SUPERVISOR': '/supervisor/asistente-virtual',

    // Docente
    'DOCENTE_DASHBOARD': '/docente/dashboard',
    'MI_HORARIO': '/docente/horario',
    'PRESTAMOS_DOCENTE': '/docente/prestamos',
    'ASISTENTES_VIRTUALES_DOCENTE': '/docente/asistente-virtual',

    // Estudiante
    'ESTUDIANTE_DASHBOARD': '/estudiante/dashboard',
    'MI_HORARIO_ESTUDIANTE': '/estudiante/mi-horario',
    'ASISTENTES_VIRTUALES_ESTUDIANTE': '/estudiante/asistente-virtual',

    // Compartidos
    'NOTIFICACIONES': '/notificaciones',
    'AJUSTES': '/ajustes',
};

/**
 * Mapeo de códigos de componentes a íconos de Lucide
 */
export const COMPONENT_ICONS: Record<string, LucideIcon> = {
    // Dashboards
    'ADMIN_DASHBOARD': LayoutDashboard,
    'SUPERVISOR_DASHBOARD': LayoutDashboard,
    'DOCENTE_DASHBOARD': LayoutDashboard,
    'ESTUDIANTE_DASHBOARD': LayoutDashboard,

    // Gestión Académica
    'CENTRO_INSTITUCIONAL': Building2,
    'CENTRO_HORARIOS': Clock,
    'PRESTAMOS_ESPACIOS': HandCoins,
    'PRESTAMOS_DOCENTE': HandCoins,
    'PERIODOS_ACADEMICOS': Calendar,
    'ASISTENTES_VIRTUALES': Bot,
    'ASISTENTES_VIRTUALES_SUPERVISOR': Bot,
    'ASISTENTES_VIRTUALES_DOCENTE': Bot,
    'ASISTENTES_VIRTUALES_ESTUDIANTE': Bot,
    'ASIGNACION_AUTOMATICA': Zap,

    // Reportes
    'OCUPACION_SEMANAL': BarChart3,
    'REPORTES_GENERALES': FileText,

    // Administración
    'GESTION_USUARIOS': Shield,

    // Supervisor
    'DISPONIBILIDAD_ESPACIOS': MapPin,
    'APERTURA_CIERRE_SALONES': DoorOpen,
    'ESTADO_RECURSOS': Wrench,

    // Horarios
    'MI_HORARIO': Clock,
    'MI_HORARIO_ESTUDIANTE': Clock,
};

/**
 * Obtiene la ruta del frontend para un código de componente
 */
export function getRouteForComponent(code: string): string {
    const route = COMPONENT_ROUTES[code];

    if (!route) {
        console.warn(`[componentRoutes] No route found for component: ${code}`);
        return '/';
    }

    return route;
}

/**
 * Obtiene el ícono para un código de componente
 */
export function getIconForComponent(code: string): LucideIcon {
    const icon = COMPONENT_ICONS[code];

    if (!icon) {
        console.warn(`[componentRoutes] No icon found for component: ${code}, using default`);
        return LayoutDashboard;
    }

    return icon;
}
