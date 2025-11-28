import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRouteForComponent, getIconForComponent } from '../config/componentRoutes';

export type MenuOption = 'home' | 'facultades' | 'espacios' | 'asignacion' | 'centrohorarios' | 'periodos' | 'reportes' | 'prestamos' | 'recursos' | 'ocupacion' | 'notificaciones' | 'ajustes' | 'chat' | 'usuarios' | 'asistentes' | 'mihorario';

interface MenuItem {
    id: string;
    icon: any;
    label: string;
    route: string;
    code: string;
}

interface MenuSection {
    id: string;
    label: string;
    items: MenuItem[];
}

export function useAdminDashboard(propsUserName?: string, propsUserRole?: string, propsOnLogout?: () => void) {
    const { user, role, components, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [notificacionesSinLeer] = useState(3);

    const shouldShowExpanded = !isSidebarCollapsed || isSidebarHovered;

    const userName = user?.nombre || propsUserName || 'Usuario';
    const userRole = role?.nombre || propsUserRole || 'Usuario';

    const handleLogout = propsOnLogout || (() => {
        logout();
        navigate('/login');
    });

    // Cuando la ruta cambia, colapsar la sidebar
    useEffect(() => {
        setIsSidebarCollapsed(true);
    }, [location.pathname]);

    /**
     * Agrupa los componentes en secciones para el menú
     */
    const groupComponentsBySection = (): MenuSection[] => {
        const sections: MenuSection[] = [];

        // Sección Principal (Dashboards)
        const dashboardComponents = components.filter(c => c.nombre.toLowerCase().includes('dashboard'));
        if (dashboardComponents.length > 0) {
            sections.push({
                id: 'principal',
                label: 'Principal',
                items: dashboardComponents.map(c => ({
                    id: c.nombre,
                    icon: getIconForComponent(c.nombre),
                    label: c.nombre,
                    route: getRouteForComponent(c.nombre),
                    code: c.nombre
                }))
            });
        }

        // Sección Gestión Académica
        const gestionNames = [
            'Centro Institucional',
            'Centro de Horarios',
            'Préstamos de Espacios',
            'Préstamos Docente',
            'Periodos Académicos',
            'Asignación Automática',
            'Asistentes Virtuales',
            'Asistentes Virtuales Supervisor',
            'Asistentes Virtuales Docente',
            'Asistentes Virtuales Estudiante'
        ];
        const gestionComponents = components.filter(c => gestionNames.includes(c.nombre));
        if (gestionComponents.length > 0) {
            sections.push({
                id: 'gestion',
                label: 'Gestión Académica',
                items: gestionComponents.map(c => ({
                    id: c.nombre,
                    icon: getIconForComponent(c.nombre),
                    label: c.nombre,
                    route: getRouteForComponent(c.nombre),
                    code: c.nombre
                }))
            });
        }

        // Sección Gestión de Espacios (para supervisores)
        const espaciosNames = [
            'Disponibilidad de Espacios',
            'Apertura y Cierre de Salones',
            'Estado de Recursos'
        ];
        const espaciosComponents = components.filter(c => espaciosNames.includes(c.nombre));
        if (espaciosComponents.length > 0) {
            sections.push({
                id: 'espacios',
                label: 'Gestión de Espacios',
                items: espaciosComponents.map(c => ({
                    id: c.nombre,
                    icon: getIconForComponent(c.nombre),
                    label: c.nombre,
                    route: getRouteForComponent(c.nombre),
                    code: c.nombre
                }))
            });
        }

        // Sección Académico (para docentes/estudiantes)
        const academicoNames = [
            'Mi Horario',
            'Mi Horario Estudiante'
        ];
        const academicoComponents = components.filter(c => academicoNames.includes(c.nombre));
        if (academicoComponents.length > 0) {
            sections.push({
                id: 'academico',
                label: 'Académico',
                items: academicoComponents.map(c => ({
                    id: c.nombre,
                    icon: getIconForComponent(c.nombre),
                    label: c.nombre,
                    route: getRouteForComponent(c.nombre),
                    code: c.nombre
                }))
            });
        }

        // Sección Reportes
        const reportesNames = ['Ocupación Semanal', 'Reportes Generales'];
        const reportesComponents = components.filter(c => reportesNames.includes(c.nombre));
        if (reportesComponents.length > 0) {
            sections.push({
                id: 'reportes',
                label: 'Reportes y Análisis',
                items: reportesComponents.map(c => ({
                    id: c.nombre,
                    icon: getIconForComponent(c.nombre),
                    label: c.nombre,
                    route: getRouteForComponent(c.nombre),
                    code: c.nombre
                }))
            });
        }

        // Sección Administración
        const adminNames = ['Gestión de Usuarios'];
        const adminComponents = components.filter(c => adminNames.includes(c.nombre));
        if (adminComponents.length > 0) {
            sections.push({
                id: 'administracion',
                label: 'Administración',
                items: adminComponents.map(c => ({
                    id: c.nombre,
                    icon: getIconForComponent(c.nombre),
                    label: c.nombre,
                    route: getRouteForComponent(c.nombre),
                    code: c.nombre
                }))
            });
        }

        return sections;
    };

    const menuSections = groupComponentsBySection();

    return {
        user,
        role,
        userName,
        userRole,
        isSidebarCollapsed,
        isSidebarHovered,
        setIsSidebarHovered,
        shouldShowExpanded,
        notificacionesSinLeer,
        menuSections,
        handleLogout,
        location
    };
}
