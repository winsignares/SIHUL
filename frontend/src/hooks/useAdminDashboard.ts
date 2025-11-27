import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { db } from './database';
import {
    LayoutDashboard,
    Building2,
    Calendar,
    Clock,
    MapPin,
    FileText,
    HandCoins,
    BarChart3,
    Shield,
    Zap,
    Bot,
    Wrench
} from 'lucide-react';

export type MenuOption = 'home' | 'facultades' | 'espacios' | 'asignacion' | 'centrohorarios' | 'periodos' | 'reportes' | 'prestamos' | 'recursos' | 'ocupacion' | 'notificaciones' | 'ajustes' | 'chat' | 'usuarios' | 'asistentes' | 'mihorario';

export function useAdminDashboard(propsUserName?: string, propsUserRole?: string, propsOnLogout?: () => void) {
    const { usuario, setUsuario } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState<MenuOption>('home');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [notificacionesSinLeer, setNotificacionesSinLeer] = useState(3);

    const shouldShowExpanded = !isSidebarCollapsed || isSidebarHovered;

    // Determinar el rol del usuario
    const userRole = usuario?.rol || propsUserRole || 'admin';
    const role = userRole;
    const userName = usuario?.nombre || propsUserName || 'Usuario';

    const handleLogout = propsOnLogout || (() => {
        // Limpiar sesión en contexto y en la db local sin recargar la página
        setUsuario(null);
        try {
            db.cerrarSesion();
        } catch (e) {
            console.warn('No se pudo limpiar la sesión local:', e);
        }
        navigate('/login');
    });

    // Sincronizar activeMenu con la ruta actual
    useEffect(() => {
        const pathToMenu: Record<string, MenuOption> = {
            '/admin/dashboard': 'home',
            '/admin/asignacion': 'asignacion',
            '/admin/centro-institucional': 'facultades',
            '/admin/centro-horarios': 'centrohorarios',
            '/admin/prestamos': 'prestamos',
            '/admin/periodos': 'periodos',
            '/admin/asistente-virtual': 'asistentes',
            '/supervisor/asistente-virtual': 'asistentes',
            '/docente/asistente-virtual': 'asistentes',
            '/estudiante/asistente-virtual': 'asistentes',
            '/admin/ocupacion': 'ocupacion',
            '/admin/reportes': 'reportes',
            '/admin/usuarios': 'usuarios',
            '/admin/espacios': 'espacios',
            '/admin/recursos': 'recursos',
            '/supervisor/dashboard': 'home',
            '/supervisor/espacios': 'espacios',
            '/supervisor/prestamos': 'prestamos',
            '/supervisor/recursos': 'recursos',
            '/docente/dashboard': 'home',
            '/docente/horario': 'mihorario',
            '/docente/prestamos': 'prestamos',
            '/estudiante/dashboard': 'home',
            '/estudiante/mi-horario': 'mihorario',
            '/notificaciones': 'notificaciones',
            '/ajustes': 'ajustes'
        };
        // Buscar la mejor coincidencia por prefijo (soporta barras finales o parámetros)
        const keys = Object.keys(pathToMenu).sort((a, b) => b.length - a.length);
        let found: MenuOption | undefined;
        for (const k of keys) {
            if (location.pathname === k || location.pathname.startsWith(k + '/') || location.pathname.startsWith(k)) {
                found = pathToMenu[k];
                break;
            }
        }
        const menu = found || 'home';
        setActiveMenu(menu);
    }, [location.pathname]);

    // Cuando la ruta cambia (el usuario hizo click en un Link), colapsar la sidebar
    useEffect(() => {
        setIsSidebarCollapsed(true);
    }, [location.pathname]);

    // Menús por rol
    const menuByRole: Record<string, Array<{ id: string; label: string; items: { id: string; icon: any; label: string; action: string }[] }>> = {
        admin: [
            {
                id: 'principal',
                label: 'Principal',
                items: [{ id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }]
            },
            {
                id: 'gestion',
                label: 'Gestión Académica',
                items: [
                    { id: 'facultades', icon: Building2, label: 'Centro Institucional', action: 'facultades' },
                    { id: 'prestamos', icon: HandCoins, label: 'Préstamos de Espacios', action: 'prestamos' },
                    { id: 'asignacion', icon: Zap, label: 'Asignación Automática', action: 'asignacion' },
                    { id: 'centrohorarios', icon: Clock, label: 'Centro Horarios', action: 'centrohorarios' },
                    { id: 'periodos', icon: Calendar, label: 'Períodos Académicos', action: 'periodos' },
                    { id: 'asistentes', icon: Bot, label: 'Asistentes Virtuales', action: 'asistentes' }
                ]
            },
            {
                id: 'reportes',
                label: 'Reportes y Análisis',
                items: [
                    { id: 'ocupacion', icon: BarChart3, label: 'Ocupación Semanal', action: 'ocupacion' },
                    { id: 'reportes', icon: FileText, label: 'Reportes Generales', action: 'reportes' }
                ]
            },
            {
                id: 'administracion',
                label: 'Administración',
                items: [{ id: 'usuarios', icon: Shield, label: 'Gestión de Usuarios', action: 'usuarios' }]
            }
        ],
        autorizado: [
            {
                id: 'principal',
                label: 'Principal',
                items: [{ id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }]
            },
            {
                id: 'gestion',
                label: 'Gestión de Espacios',
                items: [
                    { id: 'prestamos', icon: HandCoins, label: 'Préstamos de Espacios', action: 'prestamos' },
                    { id: 'centrohorarios', icon: Clock, label: 'Centro Horarios', action: 'centrohorarios' }
                ]
            },
            {
                id: 'reportes',
                label: 'Reportes y Análisis',
                items: [{ id: 'ocupacion', icon: BarChart3, label: 'Ocupación Semanal', action: 'ocupacion' }]
            }
        ],
        consultor: [
            {
                id: 'principal',
                label: 'Principal',
                items: [{ id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }]
            },
            {
                id: 'academico',
                label: 'Académico',
                items: [
                    { id: 'mihorario', icon: Clock, label: 'Mi Horario', action: 'mihorario' }
                ]
            }
        ],
        'supervisor_general': [
            {
                id: 'principal',
                label: 'Principal',
                items: [{ id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }]
            },
            {
                id: 'gestion',
                label: 'Gestión de Espacios',
                items: [
                    { id: 'espacios', icon: MapPin, label: 'Disponibilidad de Espacios', action: 'espacios' },
                    { id: 'prestamos', icon: HandCoins, label: 'Apertura y Cierre de Salones', action: 'prestamos' },
                    { id: 'recursos', icon: Wrench, label: 'Estado de Recursos', action: 'recursos' },
                    { id: 'asistentes', icon: Bot, label: 'Asistente Virtual', action: 'asistentes' }
                ]
            }
        ],
        'consultor_docente': [
            {
                id: 'principal',
                label: 'Principal',
                items: [{ id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }]
            },
            {
                id: 'academico',
                label: 'Académico',
                items: [
                    { id: 'mihorario', icon: Clock, label: 'Mi Horario', action: 'mihorario' },
                    { id: 'prestamos', icon: HandCoins, label: 'Préstamos de Espacios', action: 'prestamos' },
                    { id: 'asistentes', icon: Bot, label: 'Asistente Virtual', action: 'asistentes' }
                ]
            }
        ],
        'consultor_estudiante': [
            {
                id: 'principal',
                label: 'Principal',
                items: [{ id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }]
            },
            {
                id: 'academico',
                label: 'Académico',
                items: [
                    { id: 'mihorario', icon: Clock, label: 'Mi Horario', action: 'mihorario' },
                    { id: 'asistentes', icon: Bot, label: 'Asistente Virtual', action: 'asistentes' }
                ]
            }
        ]
    };

    const menuSections = menuByRole[role] || menuByRole['admin'];

    const menuToPath = (menu: MenuOption): string => {
        const mapping: Record<MenuOption, string> = {
            home: userRole === 'admin' ? '/admin/dashboard' : userRole === 'supervisor_general' ? '/supervisor/dashboard' : userRole === 'consultor_docente' ? '/docente/dashboard' : '/estudiante/dashboard',
            facultades: '/admin/centro-institucional',
            espacios: userRole === 'supervisor_general' ? '/supervisor/espacios' : '/admin/espacios',
            asignacion: '/admin/asignacion',
            centrohorarios: '/admin/centro-horarios',
            periodos: '/admin/periodos',
            reportes: '/admin/reportes',
            prestamos: userRole === 'admin' ? '/admin/prestamos' : userRole === 'supervisor_general' ? '/supervisor/prestamos' : '/docente/prestamos',
            recursos: userRole === 'supervisor_general' ? '/supervisor/recursos' : '/admin/recursos',
            ocupacion: '/admin/ocupacion',
            notificaciones: '/notificaciones',
            ajustes: '/ajustes',
            chat: '/admin/chat',
            usuarios: '/admin/usuarios',
            asistentes: userRole === 'admin' ? '/admin/asistente-virtual' : userRole === 'supervisor_general' ? '/supervisor/asistente-virtual' : userRole === 'consultor_docente' ? '/docente/asistente-virtual' : '/estudiante/asistente-virtual',
            mihorario: userRole === 'consultor_docente' ? '/docente/horario' : '/estudiante/mi-horario'
        };
        return mapping[menu] || '/';
    };

    return {
        usuario,
        userRole,
        userName,
        activeMenu,
        isSidebarCollapsed,
        isSidebarHovered,
        setIsSidebarHovered,
        shouldShowExpanded,
        notificacionesSinLeer,
        setNotificacionesSinLeer,
        menuSections,
        menuToPath,
        handleLogout,
        location
    };
}
