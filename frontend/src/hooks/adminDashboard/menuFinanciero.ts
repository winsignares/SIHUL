import { getIconForComponent } from '../../config/componentRoutes';
import type { MenuSection } from './menuTipos';

/** Menú específico para Admin Financiero. */
export const construirMenuAdminFinanciero = (sections: MenuSection[]): MenuSection[] => {
    sections.push({
        id: 'principal',
        label: 'Principal',
        items: [
            {
                id: 'Dashboard Admin Financiero',
                icon: getIconForComponent('Dashboard Admin Financiero'),
                label: 'Dashboard',
                route: '/financiero/admin-financiero/dashboard',
                code: 'Dashboard Admin Financiero'
            }
        ]
    });

    sections.push({
        id: 'gestion-admin-financiero',
        label: 'Administracion Financiera',
        items: [
            {
                id: 'Gestion Usuarios Financiero',
                icon: getIconForComponent('Gestion Usuarios Financiero'),
                label: 'Gestion de Usuarios',
                route: '/financiero/admin-financiero/usuarios',
                code: 'Gestion Usuarios Financiero'
            },
            {
                id: 'Gestion Proveedores',
                icon: getIconForComponent('Gestion Proveedores'),
                label: 'Gestion de Proveedores',
                route: '/financiero/admin-financiero/proveedores',
                code: 'Gestion Proveedores'
            },
            {
                id: 'Parametrizacion SLA',
                icon: getIconForComponent('Parametrizacion SLA'),
                label: 'Parametrizacion SLA',
                route: '/financiero/admin-financiero/sla',
                code: 'Parametrizacion SLA'
            }
        ]
    });

    return sections;
};

/** Menú específico para Rectoría. */
export const construirMenuRectoria = (sections: MenuSection[]): MenuSection[] => {
    sections.push({
        id: 'principal',
        label: 'Principal',
        items: [
            {
                id: 'Dashboard Rectoria',
                icon: getIconForComponent('Dashboard Rectoria'),
                label: 'Dashboard',
                route: '/financiero/rectoria/dashboard',
                code: 'Dashboard Rectoria'
            }
        ]
    });

    sections.push({
        id: 'gestion-rectoria',
        label: 'Rectoria',
        items: [
            {
                id: 'Autorizar Pagos',
                icon: getIconForComponent('Autorizar Pagos'),
                label: 'Autorizar Pagos',
                route: '/financiero/rectoria/autorizar',
                code: 'Autorizar Pagos'
            },
            {
                id: 'Factura Pagada',
                icon: getIconForComponent('Factura Pagada'),
                label: 'Factura Pagada',
                route: '/financiero/tesoreria/comprobante',
                code: 'Factura Pagada'
            }
        ]
    });

    return sections;
};

/** Menú específico para Dirección Financiera / Sindicatura. */
export const construirMenuDireccionFinanciera = (sections: MenuSection[]): MenuSection[] => {
    sections.push({
        id: 'principal',
        label: 'Principal',
        items: [
            {
                id: 'Dashboard Direccion Financiera',
                icon: getIconForComponent('Dashboard Direccion Financiera'),
                label: 'Dashboard',
                route: '/financiero/direccion-financiera/dashboard',
                code: 'Dashboard Direccion Financiera'
            }
        ]
    });

    sections.push({
        id: 'gestion-direccion-financiera',
        label: 'Direccion Financiera',
        items: [
            {
                id: 'Revisar Pagos Direccion Financiera',
                icon: getIconForComponent('Revisar Pagos Direccion Financiera'),
                label: 'Cargue y Revision',
                route: '/financiero/direccion-financiera/revisar',
                code: 'Revisar Pagos Direccion Financiera'
            },
            {
                id: 'Factura Pagada',
                icon: getIconForComponent('Factura Pagada'),
                label: 'Factura Pagada',
                route: '/financiero/tesoreria/comprobante',
                code: 'Factura Pagada'
            }
        ]
    });

    return sections;
};

/** Menú específico para Tesorería Financiera. */
export const construirMenuTesoreria = (sections: MenuSection[]): MenuSection[] => {
    sections.push({
        id: 'principal',
        label: 'Principal',
        items: [
            {
                id: 'Dashboard Tesoreria',
                icon: getIconForComponent('Dashboard Tesoreria'),
                label: 'Dashboard',
                route: '/financiero/tesoreria/dashboard',
                code: 'Dashboard Tesoreria'
            }
        ]
    });

    sections.push({
        id: 'gestion-tesoreria',
        label: 'Gestion de Tesoreria',
        items: [
            {
                id: 'Alistar Pagos',
                icon: getIconForComponent('Alistar Pagos'),
                label: 'Alistar Pagos',
                route: '/financiero/tesoreria/alistar',
                code: 'Alistar Pagos'
            },
            {
                id: 'Enviar Direccion Financiera',
                icon: getIconForComponent('Enviar Direccion Financiera'),
                label: 'Enviar Direccion Financiera',
                route: '/financiero/tesoreria/enviar',
                code: 'Enviar Direccion Financiera'
            },
            {
                id: 'Factura Pagada',
                icon: getIconForComponent('Factura Pagada'),
                label: 'Factura Pagada',
                route: '/financiero/tesoreria/comprobante',
                code: 'Factura Pagada'
            }
        ]
    });

    return sections;
};

/** Menú específico para Auditoría Financiera. */
export const construirMenuAuditoria = (sections: MenuSection[]): MenuSection[] => {
    sections.push({
        id: 'principal',
        label: 'Principal',
        items: [
            {
                id: 'Dashboard Auditoria',
                icon: getIconForComponent('Dashboard Auditoria'),
                label: 'Dashboard',
                route: '/financiero/auditoria/dashboard',
                code: 'Dashboard Auditoria'
            }
        ]
    });

    sections.push({
        id: 'control-interno',
        label: 'Control Interno',
        items: [
            {
                id: 'Control Previo',
                icon: getIconForComponent('Control Previo'),
                label: 'Control Previo',
                route: '/financiero/auditoria/control',
                code: 'Control Previo'
            },
            {
                id: 'Factura Pagada',
                icon: getIconForComponent('Factura Pagada'),
                label: 'Factura Pagada',
                route: '/financiero/tesoreria/comprobante',
                code: 'Factura Pagada'
            }
        ]
    });

    return sections;
};

/** Menú específico para Funcionario Financiero. */
export const construirMenuFuncionario = (sections: MenuSection[]): MenuSection[] => {
    sections.push({
        id: 'principal',
        label: 'Principal',
        items: [
            {
                id: 'Dashboard Financiero',
                icon: getIconForComponent('Dashboard Financiero'),
                label: 'Dashboard',
                route: '/financiero/funcionario/dashboard',
                code: 'Dashboard Financiero'
            }
        ]
    });

    sections.push({
        id: 'gestion-financiera',
        label: 'Gestión Financiera',
        items: [
            {
                id: 'Mis Pendientes',
                icon: getIconForComponent('Mis Pendientes'),
                label: 'Mis Pendientes',
                route: '/financiero/funcionario/pendientes',
                code: 'Mis Pendientes'
            },
            {
                id: 'Consultar Facturas',
                icon: getIconForComponent('Consultar Facturas'),
                label: 'Consultar Facturas',
                route: '/financiero/funcionario/consultar',
                code: 'Consultar Facturas'
            },
            {
                id: 'Factura Pagada',
                icon: getIconForComponent('Factura Pagada'),
                label: 'Factura Pagada',
                route: '/financiero/tesoreria/comprobante',
                code: 'Factura Pagada'
            }
        ]
    });

    return sections;
};

/** Menú específico para Proveedor. */
export const construirMenuProveedor = (sections: MenuSection[]): MenuSection[] => {
    sections.push({
        id: 'principal',
        label: 'Principal',
        items: [
            {
                id: 'Dashboard Proveedor',
                icon: getIconForComponent('Dashboard Proveedor'),
                label: 'Dashboard',
                route: '/financiero/proveedor/dashboard',
                code: 'Dashboard Proveedor'
            }
        ]
    });

    sections.push({
        id: 'gestion-proveedor',
        label: 'Mis Facturas',
        items: [
            {
                id: 'Enviar Factura Proveedor',
                icon: getIconForComponent('Enviar Factura Proveedor'),
                label: 'Enviar Factura',
                route: '/financiero/proveedor/enviar',
                code: 'Enviar Factura Proveedor'
            },
            {
                id: 'Mis Facturas Proveedor',
                icon: getIconForComponent('Mis Facturas Proveedor'),
                label: 'Mis Facturas',
                route: '/financiero/proveedor/mis-facturas',
                code: 'Mis Facturas Proveedor'
            }
        ]
    });

    return sections;
};

/** Menú específico para Contabilidad Financiera. */
export const construirMenuContabilidad = (sections: MenuSection[]): MenuSection[] => {
    sections.push({
        id: 'principal',
        label: 'Principal',
        items: [
            {
                id: 'Dashboard Contabilidad',
                icon: getIconForComponent('Contabilidad'),
                label: 'Dashboard',
                route: '/financiero/contabilidad/dashboard',
                code: 'Dashboard Contabilidad'
            }
        ]
    });

    sections.push({
        id: 'gestion-contable',
        label: 'Gestión Contable',
        items: [
            {
                id: 'Mis Pendientes Contabilidad',
                icon: getIconForComponent('Mis Pendientes'),
                label: 'Mis Pendientes',
                route: '/financiero/contabilidad/pendientes',
                code: 'Mis Pendientes Contabilidad'
            },
            {
                id: 'Radicar Facturas',
                icon: getIconForComponent('Radicar Facturas'),
                label: 'Radicar Facturas',
                route: '/financiero/contabilidad/radicar',
                code: 'Radicar Facturas'
            },
        {
                id: 'Factura Pagada',
                icon: getIconForComponent('Factura Pagada'),
                label: 'Factura Pagada',
                route: '/financiero/tesoreria/comprobante',
                code: 'Factura Pagada'
            }
        ]
    });

    return sections;
};
