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
    'Disponibilidad de Espacios': MapPin,
    'Apertura y Cierre de Salones': DoorOpen,
    'Mi Horario': Clock,
    'Mi Horario Estudiante': Clock,
};

/**
 * Obtiene la ruta del frontend para un nombre de componente
 */
export function getRouteForComponent(name: string): string {
    const route = COMPONENT_ROUTES[name];

    if (!route) {
        console.warn(`[componentRoutes] No route found for component: ${name}`);
        return '/';
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
