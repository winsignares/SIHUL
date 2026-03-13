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
    ShieldCheck,
    type LucideIcon
} from 'lucide-react';

/**
 * Mapeo de códigos de componentes a rutas del frontend
 */
export const COMPONENT_ROUTES: Record<string, string> = {
    // Admin - Planeación
    'Dashboard': '/admin/dashboard',
    'Facultades': '/admin/facultades',
    'Programas': '/admin/programas',
    'Periodos': '/admin/periodos',
    'Grupos': '/admin/grupos',
    'Asignaturas': '/admin/asignaturas',
    'Espacios': '/admin/espacios',
    'Horarios': '/admin/horarios',
    'Préstamos': '/admin/prestamos',
    'Ocupación Semanal': '/admin/ocupacion',
    'Reportes': '/admin/reportes',
    'Usuarios': '/admin/usuarios',
    'Notificaciones': '/notificaciones',
    'Chat': '/chat',
    'Ajustes': '/ajustes',
    'Recursos': '/admin/recursos',
    'Mensajería': '/mensajeria',
    'Cronograma': '/admin/cronograma',
    'Apertura y Cierre': '/admin/apertura-cierre',
    'Estado de Recursos': '/admin/estado-recursos',

    // Mapeos adicionales para nombres compuestos o específicos
    'Centro Institucional': '/admin/centro-institucional',
    'Centro de Horarios': '/admin/centro-horarios',
    'Préstamos de Espacios': '/admin/prestamos',
    'Periodos Académicos': '/admin/periodos',
    'Asistentes Virtuales': '/admin/asistente-virtual',
    'Reportes Generales': '/admin/reportes',
    'Gestión de Usuarios': '/admin/usuarios',
    'Gestión de Roles': '/admin/roles',
    'Gestión de Componentes': '/admin/componentes-roles',
    'Componentes y Roles': '/admin/componentes-roles',
    'Asignación Automática': '/admin/asignacion',

    // Supervisor General
    'Dashboard Supervisor': '/supervisor/dashboard',
    'Disponibilidad de Espacios': '/supervisor/espacios',
    'Apertura y Cierre de Salones': '/supervisor/prestamos',
    'Asistentes Virtuales Supervisor': '/supervisor/asistente-virtual',

    // Docente
    'Dashboard Docente': '/docente/dashboard',
    'Mi Horario': '/docente/horario',
    'Préstamos Docente': '/docente/prestamos',
    'Asistentes Virtuales Docente': '/docente/asistente-virtual',

    // Estudiante
    'Dashboard Estudiante': '/estudiante/dashboard',
    'Mi Horario Estudiante': '/estudiante/mi-horario',
    'Asistentes Virtuales Estudiante': '/estudiante/asistente-virtual',
};

/**
 * Mapeo de códigos de componentes a íconos de Lucide
 */
export const COMPONENT_ICONS: Record<string, LucideIcon> = {
    // Dashboards
    'Dashboard': LayoutDashboard,
    'Dashboard Admin': LayoutDashboard,
    'Dashboard Supervisor': LayoutDashboard,
    'Dashboard Docente': LayoutDashboard,
    'Dashboard Estudiante': LayoutDashboard,

    // Gestión Académica
    'Facultades': Building2,
    'Programas': Building2,
    'Periodos': Calendar,
    'Grupos': Building2,
    'Asignaturas': Building2,
    'Espacios': MapPin,
    'Horarios': Clock,
    'Préstamos': HandCoins,
    'Ocupación': BarChart3,
    'Reportes': FileText,
    'Usuarios': Shield,
    'Notificaciones': Zap,
    'Chat': Bot,
    'Ajustes': Wrench,
    'Recursos': Wrench,
    'Mensajería': Bot,
    'Cronograma': Calendar,
    'Apertura y Cierre': DoorOpen,
    'Estado de Recursos': Wrench,

    // Mapeos adicionales
    'Centro Institucional': Building2,
    'Centro de Horarios': Clock,
    'Préstamos de Espacios': HandCoins,
    'Préstamos Docente': HandCoins,
    'Periodos Académicos': Calendar,
    'Asistentes Virtuales': Bot,
    'Asistentes Virtuales Supervisor': Bot,
    'Asistentes Virtuales Docente': Bot,
    'Asistentes Virtuales Estudiante': Bot,
    'Asignación Automática': Zap,
    'Ocupación Semanal': BarChart3,
    'Reportes Generales': FileText,
    'Gestión de Usuarios': Shield,
    'Gestión de Roles': Shield,
    'Gestión de Componentes': ShieldCheck,
    'Componentes y Roles': ShieldCheck,
    'Disponibilidad de Espacios': MapPin,
    'Apertura y Cierre de Salones': DoorOpen,
    'Mi Horario': Clock,
    'Mi Horario Estudiante': Clock,
};

/**
 * Convierte nombre de componente en slug de URL estable.
 */
export function toComponentSlug(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Ruta dinámica para componentes no mapeados manualmente.
 */
export function getDynamicRouteForComponent(name: string): string {
    return `/componentes/${toComponentSlug(name)}`;
}

/**
 * Obtiene la ruta del frontend para un nombre de componente
 */
export function getRouteForComponent(name: string): string {
    const route = COMPONENT_ROUTES[name];

    if (!route) {
        const dynamicRoute = getDynamicRouteForComponent(name);
        console.info(`[componentRoutes] Dynamic route used for component: ${name} -> ${dynamicRoute}`);
        return dynamicRoute;
    }

    return route;
}

/**
 * Obtiene el ícono para un nombre de componente
 */
export function getIconForComponent(name: string): LucideIcon {
    const icon = COMPONENT_ICONS[name];

    if (!icon) {
        console.warn(`[componentRoutes] No icon found for component: ${name}, using default`);
        return LayoutDashboard;
    }

    return icon;
}
