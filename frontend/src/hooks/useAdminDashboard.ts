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

    // Detectar si es acceso público por la ruta
    const isPublicAccess = location.pathname.startsWith('/public');

    const userName = user?.nombre || propsUserName || (isPublicAccess ? 'Usuario Público' : 'Usuario');
    const userRole = role?.nombre || propsUserRole || (isPublicAccess ? 'Público' : 'Usuario');
    const userFacultyName = user?.facultad?.nombre || '';

    const handleLogout = propsOnLogout || (() => {
        logout();
        navigate('/login');
    });

    // Cuando la ruta cambia, colapsar la sidebar
    useEffect(() => {
        setIsSidebarCollapsed(true);
    }, [location.pathname]);

    const cleanLabel = (name: string) => {
        return name
            .replace(' Supervisor', '')
            .replace(' Docente', '')
            .replace(' Estudiante', '')
            .replace(' Admin', '')
            .trim();
    };

    /**
     * Agrupa los componentes en secciones para el menú
     */
    const groupComponentsBySection = (): MenuSection[] => {
        const sections: MenuSection[] = [];

        // Si es acceso público, no mostrar componentes en el sidebar
        if (isPublicAccess) {
            return [];
        }

        // Sección Principal (Dashboards)
        const dashboardComponents = components.filter(c => c.nombre.toLowerCase().includes('dashboard'));
        if (dashboardComponents.length > 0) {
            sections.push({
                id: 'principal',
                label: 'Principal',
                items: dashboardComponents.map(c => ({
                    id: c.nombre,
                    icon: getIconForComponent(c.nombre),
                    label: cleanLabel(c.nombre),
                    route: getRouteForComponent(c.nombre),
                    code: c.nombre
                }))
            });
        }

        // Sección Gestión de Espacios (para supervisores)
        let espaciosNames = [
            'Apertura y Cierre de Salones',
            'Disponibilidad de Espacios',
            'Estado de Recursos'
        ];

        // Si es admin, quitamos Estado de Recursos del sidebar porque ya está en Centro Institucional
        if (userRole.toLowerCase().includes('admin')) {
            espaciosNames = espaciosNames.filter(n => n !== 'Estado de Recursos');
        }

        // Filtrar y ordenar según el array espaciosNames
        const espaciosComponents = espaciosNames
            .map(name => components.find(c => c.nombre === name))
            .filter((c): c is typeof components[0] => c !== undefined);

        if (espaciosComponents.length > 0) {
            sections.push({
                id: 'espacios',
                label: 'Gestión de Espacios',
                items: espaciosComponents.map(c => {
                    let route = getRouteForComponent(c.nombre);
                    // Fix para Supervisor General y Estado de Recursos
                    if (userRole.toLowerCase().includes('supervisor') && c.nombre === 'Estado de Recursos') {
                        route = '/supervisor/recursos';
                    }
                    return {
                        id: c.nombre,
                        icon: getIconForComponent(c.nombre),
                        label: cleanLabel(c.nombre),
                        route: route,
                        code: c.nombre
                    };
                })
            });
        }

        // Sección Académico (para docentes/estudiantes)
        // Incluye Horarios y Préstamos Docente
        const academicoNames = [
            'Mi Horario',
            'Mi Horario Estudiante',
            'Préstamos Docente'
        ];
        // Filtrar y ordenar para mantener el orden específico: Horario -> Préstamos
        const academicoComponents = academicoNames
            .map(name => components.find(c => c.nombre === name))
            .filter((c): c is typeof components[0] => c !== undefined);

        if (academicoComponents.length > 0) {
            sections.push({
                id: 'academico',
                label: 'Académico',
                items: academicoComponents.map(c => ({
                    id: c.nombre,
                    icon: getIconForComponent(c.nombre),
                    label: cleanLabel(c.nombre),
                    route: getRouteForComponent(c.nombre),
                    code: c.nombre
                }))
            });
        }

        // Sección Gestión Académica (Admin)
        const gestionNames = [
            'Centro Institucional',
            'Centro de Horarios',
            'Préstamos de Espacios',
            'Periodos Académicos',
            'Asignación Automática'
        ];
        const gestionComponents = components.filter(c => gestionNames.includes(c.nombre));
        if (gestionComponents.length > 0) {
            sections.push({
                id: 'gestion',
                label: 'Gestión Académica',
                items: gestionComponents.map(c => ({
                    id: c.nombre,
                    icon: getIconForComponent(c.nombre),
                    label: cleanLabel(c.nombre),
                    route: getRouteForComponent(c.nombre),
                    code: c.nombre
                }))
            });
        }

        // Sección Asistente Virtual - MOVIDO DESPUÉS DE GESTIÓN ACADÉMICA
        const asistenteNames = [
            'Asistentes Virtuales',
            'Asistentes Virtuales Supervisor',
            'Asistentes Virtuales Docente',
            'Asistentes Virtuales Estudiante'
        ];
        const asistenteComponents = components.filter(c => asistenteNames.includes(c.nombre));
        if (asistenteComponents.length > 0) {
            sections.push({
                id: 'asistente',
                label: 'Asistente Virtual',
                items: asistenteComponents.map(c => ({
                    id: c.nombre,
                    icon: getIconForComponent(c.nombre),
                    label: cleanLabel(c.nombre),
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
                    label: cleanLabel(c.nombre),
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
                    label: cleanLabel(c.nombre),
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
        userFacultyName,
        isSidebarCollapsed,
        isSidebarHovered,
        setIsSidebarHovered,
        shouldShowExpanded,
        notificacionesSinLeer,
        menuSections,
        handleLogout,
        location,
        isPublicAccess
    };
}
