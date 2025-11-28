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
        const dashboardComponents = components.filter(c => c.code.includes('DASHBOARD'));
        if (dashboardComponents.length > 0) {
            sections.push({
                id: 'principal',
                label: 'Principal',
                items: dashboardComponents.map(c => ({
                    id: c.code,
                    icon: getIconForComponent(c.code),
                    label: c.name,
                    route: getRouteForComponent(c.code),
                    code: c.code
                }))
            });
        }

        // Sección Gestión Académica
        const gestionCodes = [
            'CENTRO_INSTITUCIONAL',
            'CENTRO_HORARIOS',
            'PRESTAMOS_ESPACIOS',
            'PRESTAMOS_DOCENTE',
            'PERIODOS_ACADEMICOS',
            'ASIGNACION_AUTOMATICA',
            'ASISTENTES_VIRTUALES',
            'ASISTENTES_VIRTUALES_SUPERVISOR',
            'ASISTENTES_VIRTUALES_DOCENTE',
            'ASISTENTES_VIRTUALES_ESTUDIANTE'
        ];
        const gestionComponents = components.filter(c => gestionCodes.includes(c.code));
        if (gestionComponents.length > 0) {
            sections.push({
                id: 'gestion',
                label: 'Gestión Académica',
                items: gestionComponents.map(c => ({
                    id: c.code,
                    icon: getIconForComponent(c.code),
                    label: c.name,
                    route: getRouteForComponent(c.code),
                    code: c.code
                }))
            });
        }

        // Sección Gestión de Espacios (para supervisores)
        const espaciosCodes = [
            'DISPONIBILIDAD_ESPACIOS',
            'APERTURA_CIERRE_SALONES',
            'ESTADO_RECURSOS'
        ];
        const espaciosComponents = components.filter(c => espaciosCodes.includes(c.code));
        if (espaciosComponents.length > 0) {
            sections.push({
                id: 'espacios',
                label: 'Gestión de Espacios',
                items: espaciosComponents.map(c => ({
                    id: c.code,
                    icon: getIconForComponent(c.code),
                    label: c.name,
                    route: getRouteForComponent(c.code),
                    code: c.code
                }))
            });
        }

        // Sección Académico (para docentes/estudiantes)
        const academicoCodes = [
            'MI_HORARIO',
            'MI_HORARIO_ESTUDIANTE'
        ];
        const academicoComponents = components.filter(c => academicoCodes.includes(c.code));
        if (academicoComponents.length > 0) {
            sections.push({
                id: 'academico',
                label: 'Académico',
                items: academicoComponents.map(c => ({
                    id: c.code,
                    icon: getIconForComponent(c.code),
                    label: c.name,
                    route: getRouteForComponent(c.code),
                    code: c.code
                }))
            });
        }

        // Sección Reportes
        const reportesCodes = ['OCUPACION_SEMANAL', 'REPORTES_GENERALES'];
        const reportesComponents = components.filter(c => reportesCodes.includes(c.code));
        if (reportesComponents.length > 0) {
            sections.push({
                id: 'reportes',
                label: 'Reportes y Análisis',
                items: reportesComponents.map(c => ({
                    id: c.code,
                    icon: getIconForComponent(c.code),
                    label: c.name,
                    route: getRouteForComponent(c.code),
                    code: c.code
                }))
            });
        }

        // Sección Administración
        const adminCodes = ['GESTION_USUARIOS'];
        const adminComponents = components.filter(c => adminCodes.includes(c.code));
        if (adminComponents.length > 0) {
            sections.push({
                id: 'administracion',
                label: 'Administración',
                items: adminComponents.map(c => ({
                    id: c.code,
                    icon: getIconForComponent(c.code),
                    label: c.name,
                    route: getRouteForComponent(c.code),
                    code: c.code
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
