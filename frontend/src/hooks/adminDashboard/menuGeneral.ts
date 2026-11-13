import { getRouteForComponent, getIconForComponent } from '../../config/componentRoutes';
import { isSpaceSupervisorRole } from '../../context/spaceSupervisorRole';
import type { useAuth } from '../../context/AuthContext';
import type { MenuSection } from './menuTipos';

type Sesion = ReturnType<typeof useAuth>;

export interface ContextoMenuGeneral {
    components: Sesion['components'];
    role: Sesion['role'];
    normalizedRole: string;
    cleanLabel: (name: string) => string;
}

/** Menú por secciones según los componentes asignados al usuario. */
export const construirMenuGeneral = (
    sections: MenuSection[],
    { components, role, normalizedRole, cleanLabel }: ContextoMenuGeneral
): MenuSection[] => {
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
    if (normalizedRole.includes('admin')) {
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
                // Los supervisores de espacios (casilla del rol) usan su propia vista de Estado de Recursos
                if (isSpaceSupervisorRole(role) && c.nombre === 'Estado de Recursos') {
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
        'Asignación Automática',
        'Asignación de espacios por seccional'
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
    const adminNames = ['Gestión de Usuarios', 'Gestión de Roles', 'Gestión de Componentes'];
    const adminComponents = adminNames
        .map(name => components.find(c => c.nombre === name))
        .filter((c): c is typeof components[0] => c !== undefined);
    if (adminComponents.length > 0) {
        const adminItems = adminComponents.map(c => ({
            id: c.nombre,
            icon: getIconForComponent(c.nombre),
            label: cleanLabel(c.nombre),
            route: getRouteForComponent(c.nombre),
            code: c.nombre
        }));
        
        sections.push({
            id: 'administracion',
            label: 'Administración',
            items: adminItems
        });
    }

    // Sección dinámica para cualquier componente nuevo asignado desde backend
    // que todavía no tenga una categoría fija en frontend.
    const usedComponentNames = new Set(
        sections.flatMap(section => section.items.map(item => item.code))
    );

    // «Gestión de Documentación de Chatbots» abre la misma pantalla que «Gestión de
    // Chatbots»: quien tiene ambas ve una sola entrada en el menú.
    const tieneGestionChatbots = components.some(c => c.nombre === 'Gestión de Chatbots');
    const dynamicComponents = components.filter(c =>
        !usedComponentNames.has(c.nombre)
        && !(tieneGestionChatbots && c.nombre === 'Gestión de Documentación de Chatbots')
    );

    if (dynamicComponents.length > 0) {
        sections.push({
            id: 'modulos-dinamicos',
            label: 'Módulos Asignados',
            items: dynamicComponents.map(c => ({
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
