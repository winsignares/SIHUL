import {
    LayoutDashboard,
    Building2,
    Clock,
    Clock3,
    Calculator,
    FileCheck,
    HandCoins,
    Landmark,
    Calendar,
    Bot,
    BarChart3,
    FileText,
    FilePlus2,
    Receipt,
    Search,
    Send,
    CircleCheckBig,
    ListChecks,
    Crown,
    FileSearch,
    Wallet,
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
    'Asignación de espacios por seccional': '/asignacion-espacios-seccional',

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

    // Módulo Financiero
    'Dashboard Financiero': '/financiero/funcionario/dashboard',
    'Gestión de Facturas': '/financiero/funcionario/dashboard',
    'Registrar Factura': '/financiero/funcionario/registrar',
    'Consultar Facturas': '/financiero/funcionario/consultar',
    'Mis Pendientes': '/financiero/funcionario/pendientes',
    'Dashboard Contabilidad': '/financiero/contabilidad/dashboard',
    'Mis Pendientes Contabilidad': '/financiero/contabilidad/pendientes',
    'Radicar Facturas': '/financiero/contabilidad/radicar',
    'Causar Facturas': '/financiero/contabilidad/causar',
    'Dashboard Tesoreria': '/financiero/tesoreria/dashboard',
    'Mis Pendientes Tesoreria': '/financiero/tesoreria/pendientes',
    'Alistar Pagos': '/financiero/tesoreria/alistar',
    'Enviar Direccion Financiera': '/financiero/tesoreria/enviar',
    'Registrar Pago Aplicado': '/financiero/tesoreria/registrar-pago',
    'Generar Comprobante Egreso': '/financiero/tesoreria/comprobante',
    'Dashboard Auditoria': '/financiero/auditoria/dashboard',
    'Mis Pendientes Auditoria': '/financiero/auditoria/pendientes',
    'Control Previo': '/financiero/auditoria/control',
    'Dashboard Direccion Financiera': '/financiero/direccion-financiera/dashboard',
    'Mis Pendientes Direccion Financiera': '/financiero/direccion-financiera/pendientes',
    'Revisar Pagos Direccion Financiera': '/financiero/direccion-financiera/revisar',
    'Enviar a Rectoria': '/financiero/direccion-financiera/enviar',
    'Confirmacion Pagos Direccion Financiera': '/financiero/direccion-financiera/confirmar',
    'Control de Pago Bancario Direccion Financiera': '/financiero/direccion-financiera/confirmar',
    'Dashboard Rectoria': '/financiero/rectoria/dashboard',
    'Mis Pendientes Rectoria': '/financiero/rectoria/pendientes',
    'Autorizar Pagos': '/financiero/rectoria/autorizar',
    'Autorizar Pago': '/financiero/rectoria/autorizar',
    'Dashboard Admin Financiero': '/financiero/admin-financiero/dashboard',
    'Gestion Usuarios Financiero': '/financiero/admin-financiero/usuarios',
    'Gestion de Usuarios Financiero': '/financiero/admin-financiero/usuarios',
    'Gestion Proveedores': '/financiero/admin-financiero/proveedores',
    'Gestion de Proveedores': '/financiero/admin-financiero/proveedores',
    'Centro Contable': '/financiero/contabilidad/centro-contable',
    'Parametrizacion SLA': '/financiero/admin-financiero/sla',
    'Reportes Consolidados Financiero': '/financiero/admin-financiero/reportes',
    'Reportes Consolidados': '/financiero/admin-financiero/reportes',
    'Configuracion Sistema Financiero': '/financiero/admin-financiero/configuracion',
    'Configuracion del Sistema Financiero': '/financiero/admin-financiero/configuracion',
    'Dashboard Proveedor': '/financiero/proveedor/dashboard',
    'Enviar Factura Proveedor': '/financiero/proveedor/enviar',
    'Mis Facturas Proveedor': '/financiero/proveedor/mis-facturas',
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
    'Asignación de espacios por seccional': MapPin,
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

    // Módulo Financiero
    'Dashboard Financiero': LayoutDashboard,
    'Gestión de Facturas': Receipt,
    'Registrar Factura': FilePlus2,
    'Consultar Facturas': Search,
    'Mis Pendientes': Clock3,
    'Dashboard Contabilidad': LayoutDashboard,
    'Mis Pendientes Contabilidad': Clock3,
    'Radicar Facturas': FileCheck,
    'Causar Facturas': Calculator,
    'Dashboard Tesoreria': LayoutDashboard,
    'Mis Pendientes Tesoreria': Clock3,
    'Alistar Pagos': ListChecks,
    'Enviar Direccion Financiera': Send,
    'Registrar Pago Aplicado': CircleCheckBig,
    'Generar Comprobante Egreso': FileText,
    'Dashboard Auditoria': LayoutDashboard,
    'Mis Pendientes Auditoria': Clock3,
    'Control Previo': ShieldCheck,
    'Dashboard Direccion Financiera': LayoutDashboard,
    'Mis Pendientes Direccion Financiera': Clock3,
    'Revisar Pagos Direccion Financiera': ListChecks,
    'Enviar a Rectoria': Send,
    'Confirmacion Pagos Direccion Financiera': CircleCheckBig,
    'Control de Pago Bancario Direccion Financiera': CircleCheckBig,
    'Dashboard Rectoria': Crown,
    'Mis Pendientes Rectoria': Clock3,
    'Autorizar Pagos': CircleCheckBig,
    'Autorizar Pago': CircleCheckBig,
    'Dashboard Admin Financiero': LayoutDashboard,
    'Gestion Usuarios Financiero': Shield,
    'Gestion de Usuarios Financiero': Shield,
    'Gestion Proveedores': Building2,
    'Gestion de Proveedores': Building2,
    'Centro Contable': Landmark,
    'Parametrizacion SLA': Clock,
    'Reportes Consolidados Financiero': BarChart3,
    'Reportes Consolidados': BarChart3,
    'Configuracion Sistema Financiero': Wrench,
    'Configuracion del Sistema Financiero': Wrench,
    'Dashboard Proveedor': LayoutDashboard,
    'Enviar Factura Proveedor': Send,
    'Mis Facturas Proveedor': FileText,
};

function normalizeComponentName(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

function isFinancialComponentName(name: string): boolean {
    const normalized = normalizeComponentName(name);

    if (
        normalized.includes('factur') ||
        normalized.includes('financier')
    ) {
        return true;
    }

    return (
        normalized === 'mis pendientes' ||
        normalized.includes('pendientes')
    );
}

function isContabilidadLikeComponent(name: string): boolean {
    const normalized = normalizeComponentName(name);
    return (
        normalized.includes('contabilidad') ||
        normalized.includes('causar') ||
        normalized.includes('radicar') ||
        normalized.includes('cuentas por pagar') ||
        normalized.includes('revision pago') ||
        normalized.includes('confirmacion pago') ||
        normalized.includes('enviar a rectoria')
    );
}

function isTesoreriaLikeComponent(name: string): boolean {
    const normalized = normalizeComponentName(name);
    return (
        normalized.includes('tesoreria') ||
        normalized.includes('alistar pago') ||
        normalized.includes('proceso pago') ||
        normalized.includes('registrar pago') ||
        normalized.includes('pago aplicado') ||
        normalized.includes('comprobante egreso')
    );
}

function isDireccionFinancieraLikeComponent(name: string): boolean {
    const normalized = normalizeComponentName(name);
    return (
        normalized.includes('direccion financiera') ||
        normalized.includes('sindicatura') ||
        normalized.includes('revisar pago') ||
        normalized.includes('enviar a rectoria') ||
        normalized.includes('confirmacion pago') ||
        normalized.includes('control de pago bancario')
    );
}

function isAuditoriaLikeComponent(name: string): boolean {
    const normalized = normalizeComponentName(name);
    return (
        normalized.includes('auditor') ||
        normalized.includes('control previo') ||
        normalized.includes('revisar pago') ||
        normalized.includes('revision de pago')
    );
}

function isRectoriaLikeComponent(name: string): boolean {
    const normalized = normalizeComponentName(name);
    return (
        normalized.includes('rectoria') ||
        normalized.includes('rector') ||
        normalized.includes('autorizar pago')
    );
}

function isAdminFinancieroLikeComponent(name: string): boolean {
    const normalized = normalizeComponentName(name);
    return (
        normalized.includes('admin financiero') ||
        normalized.includes('gestion proveedores') ||
        normalized.includes('centro contable') ||
        normalized.includes('parametrizacion sla') ||
        normalized.includes('reportes consolidados') ||
        normalized.includes('configuracion sistema financiero')
    );
}

const NORMALIZED_COMPONENT_ROUTES: Record<string, string> = Object.fromEntries(
    Object.entries(COMPONENT_ROUTES).map(([key, route]) => [normalizeComponentName(key), route])
);

const NORMALIZED_COMPONENT_ICONS: Record<string, LucideIcon> = Object.fromEntries(
    Object.entries(COMPONENT_ICONS).map(([key, icon]) => [normalizeComponentName(key), icon])
);

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
    const route = COMPONENT_ROUTES[name] || NORMALIZED_COMPONENT_ROUTES[normalizeComponentName(name)];

    if (!route && isAdminFinancieroLikeComponent(name)) {
        return '/financiero/admin-financiero/dashboard';
    }

    if (!route && isRectoriaLikeComponent(name)) {
        return '/financiero/rectoria/dashboard';
    }

    if (!route && isDireccionFinancieraLikeComponent(name)) {
        return '/financiero/direccion-financiera/dashboard';
    }

    if (!route && isAuditoriaLikeComponent(name)) {
        return '/financiero/auditoria/dashboard';
    }

    if (!route && isTesoreriaLikeComponent(name)) {
        return '/financiero/tesoreria/dashboard';
    }

    if (!route && isContabilidadLikeComponent(name)) {
        return '/financiero/contabilidad/dashboard';
    }

    if (!route && isFinancialComponentName(name)) {
        return '/financiero/funcionario/dashboard';
    }

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
    const icon = COMPONENT_ICONS[name] || NORMALIZED_COMPONENT_ICONS[normalizeComponentName(name)];
    const normalized = normalizeComponentName(name);

    if (!icon) {
        if (normalized.includes('dashboard')) return LayoutDashboard;
        if (normalized.includes('mis pendientes')) return Clock3;
        if (normalized.includes('consultar')) return FileSearch;
        if (normalized.includes('radicar')) return FileCheck;
        if (normalized.includes('causar')) return Calculator;
        if (normalized.includes('tesoreria')) return Wallet;
        if (normalized.includes('alistar pago')) return ListChecks;
        if (normalized.includes('registrar pago')) return CircleCheckBig;
        if (normalized.includes('comprobante')) return FileText;
        if (normalized.includes('auditor')) return ShieldCheck;
        if (normalized.includes('control previo')) return ShieldCheck;
        if (normalized.includes('enviar a rectoria')) return Send;
        if (normalized.includes('rectoria') || normalized.includes('rector')) return Crown;
        if (normalized.includes('autorizar pago')) return CircleCheckBig;
        if (normalized.includes('admin financiero')) return LayoutDashboard;
        if (normalized.includes('proveedores')) return Building2;
        if (normalized.includes('centro contable')) return Landmark;
        if (normalized.includes('parametrizacion sla')) return Clock;
        if (normalized.includes('reportes consolidados')) return BarChart3;
        if (normalized.includes('configuracion sistema financiero')) return Wrench;
        if (normalized.includes('confirmacion') || normalized.includes('confirmar')) return CircleCheckBig;
        if (normalized.includes('revision') || normalized.includes('revisar')) return ListChecks;
    }

    if (!icon && isFinancialComponentName(name)) {
        return HandCoins;
    }

    if (!icon) {
        console.warn(`[componentRoutes] No icon found for component: ${name}, using default`);
        return LayoutDashboard;
    }

    return icon;
}
