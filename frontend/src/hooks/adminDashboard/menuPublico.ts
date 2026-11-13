import { getIconForComponent } from '../../config/componentRoutes';
import type { MenuSection } from './menuTipos';

/** Menú del acceso público. */
export const construirMenuPublico = (): MenuSection[] => {
    const publicMenu: MenuSection[] = [
        {
            id: 'principal',
            label: 'Principal',
            items: [
                {
                    id: 'dashboard',
                    icon: getIconForComponent('Dashboard'),
                    label: 'Dashboard',
                    route: '/public/dashboard',
                    code: 'dashboard'
                }
            ]
        },
        {
            id: 'horarios',
            label: 'Horarios',
            items: [
                {
                    id: 'consulta-horario',
                    icon: getIconForComponent('Mi Horario'),
                    label: 'Consulta de Horario',
                    route: '/public/consulta-horario',
                    code: 'consulta-horario'
                },
                {
                    id: 'disponibilidad-espacios',
                    icon: getIconForComponent('Disponibilidad de Espacios'),
                    label: 'Disponibilidad de Espacios',
                    route: '/public/disponibilidad-espacios',
                    code: 'disponibilidad-espacios'
                }
            ]
        },
        {
            id: 'prestamos',
            label: 'Préstamos',
            items: [
                {
                    id: 'prestamo',
                    icon: getIconForComponent('Préstamos de Espacios'),
                    label: 'Solicitud de Préstamo',
                    route: '/public/prestamo',
                    code: 'prestamo'
                }
            ]
        },
        {
            id: 'asistente',
            label: 'Asistente Virtual',
            items: [
                {
                    id: 'asistente-virtual',
                    icon: getIconForComponent('Asistentes Virtuales'),
                    label: 'Asistente Virtual',
                    route: '/public/asistente-virtual',
                    code: 'asistente-virtual'
                }
            ]
        }
    ];
    return publicMenu;
};
