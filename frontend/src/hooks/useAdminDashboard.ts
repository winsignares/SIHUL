import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolveCanonicalFinancialRole } from '../context/financialRoleUtils';
import { construirMenuPublico } from './adminDashboard/menuPublico';
import {
    construirMenuAdminFinanciero,
    construirMenuRectoria,
    construirMenuDireccionFinanciera,
    construirMenuTesoreria,
    construirMenuAuditoria,
    construirMenuFuncionario,
    construirMenuProveedor,
    construirMenuContabilidad,
} from './adminDashboard/menuFinanciero';
import { construirMenuGeneral } from './adminDashboard/menuGeneral';
import type { MenuSection } from './adminDashboard/menuTipos';

export function useAdminDashboard(propsUserName?: string, propsUserRole?: string, propsOnLogout?: () => void) {
    const { user, role, components, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarCollapsed] = useState(true);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [notificacionesSinLeer] = useState(3);

    const shouldShowExpanded = !isSidebarCollapsed || isSidebarHovered;

    // Detectar si es acceso público por la ruta
    const isPublicAccess = location.pathname.startsWith('/public');

    const userName = user?.nombre || propsUserName || (isPublicAccess ? 'Usuario Público' : 'Usuario');
    const userRole = role?.nombre || propsUserRole || (isPublicAccess ? 'Público' : 'Usuario');
    const userFacultyName = user?.facultad?.nombre || '';
    const normalizedRole = userRole
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .trim();
    const canonicalFinancialRole = resolveCanonicalFinancialRole({
        roleName: userRole,
        userName,
        components,
    });

    const handleLogout = propsOnLogout || (() => {
        logout();
        navigate('/login');
    });

    const cleanLabel = (name: string) => {
        return name
            .replace(' Supervisor', '')
            .replace(' Docente', '')
            .replace(' Estudiante', '')
            .replace(' Admin', '')
            .trim();
    };

    const isDireccionFinancieraProfile = canonicalFinancialRole === 'direccion_financiera';
    const isRectoriaProfile = canonicalFinancialRole === 'rectoria';
    const isAdminFinancieroProfile = canonicalFinancialRole === 'admin_financiero';

    /**
     * Agrupa los componentes en secciones para el menú
     */
    const groupComponentsBySection = (): MenuSection[] => {
        const sections: MenuSection[] = [];

        // Si es acceso público, mostrar menú público
        if (isPublicAccess) {
            return construirMenuPublico();
        }

        // Menu especifico para Admin Financiero
        if (isAdminFinancieroProfile) {
            return construirMenuAdminFinanciero(sections);
        }

        // Menu especifico para Rectoria
        if (isRectoriaProfile) {
            return construirMenuRectoria(sections);
        }

        // Menu especifico para Direccion Financiera / Sindicatura
        if (isDireccionFinancieraProfile) {
            return construirMenuDireccionFinanciera(sections);
        }

        // Menu especifico para Tesoreria Financiera
        if (canonicalFinancialRole === 'tesoreria') {
            return construirMenuTesoreria(sections);
        }

        // Menu especifico para Auditoria Financiera
        if (canonicalFinancialRole === 'auditoria') {
            return construirMenuAuditoria(sections);
        }

        // Menú específico para Funcionario Financiero (siempre consistente)
        if (canonicalFinancialRole === 'funcionario') {
            return construirMenuFuncionario(sections);
        }

        // Menú específico para Proveedor
        if (canonicalFinancialRole === 'proveedor') {
            return construirMenuProveedor(sections);
        }

        // Menú específico para Contabilidad Financiera (siempre consistente)
        if (canonicalFinancialRole === 'contabilidad') {
            return construirMenuContabilidad(sections);
        }

        return construirMenuGeneral(sections, { components, role, normalizedRole, cleanLabel });
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

