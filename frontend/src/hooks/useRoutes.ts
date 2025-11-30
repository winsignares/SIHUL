import { useUser } from '../context/UserContext';
import { useMemo, useCallback } from 'react';
import { normalizeRole } from '../context/roleUtils';

export type Role = 'admin' | 'supervisor_general' | 'docente' | 'estudiante';

export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  roles: Role[];
  exact?: boolean;
}

// Rutas agrupadas por rol
export const routesByRole: Record<Role, Array<{ path: string; component: string }>> = {
  admin: [
    { path: '/admin/dashboard', component: 'DashboardHome' },
    { path: '/admin/centro-institucional', component: 'FacultadesPrograms' },
    { path: '/admin/centro-horarios', component: 'CentroHorarios' },
    { path: '/admin/prestamos', component: 'PrestamosEspacios' },
    { path: '/admin/periodos', component: 'PeriodosAcademicos' },
    { path: '/admin/asistente-virtual', component: 'AsistentesVirtuales' },
    { path: '/admin/ocupacion', component: 'OcupacionSemanal' },
    { path: '/admin/reportes', component: 'Reportes' },
    { path: '/admin/usuarios', component: 'GestionUsuarios' },
    { path: '/notificaciones', component: 'Notificaciones' },
    { path: '/ajustes', component: 'Ajustes' }
  ],
  supervisor_general: [
    { path: '/supervisor/dashboard', component: 'SupervisorGeneralHome' },
    { path: '/supervisor/apertura-cierre', component: 'SupervisorGeneralHome' },
    { path: '/supervisor/cronograma', component: 'SupervisorGeneralHome' },
    { path: '/notificaciones', component: 'Notificaciones' },
    { path: '/ajustes', component: 'Ajustes' }
  ],
  docente: [
    { path: '/docente/dashboard', component: 'ConsultorDocenteHome' },
    { path: '/docente/horario', component: 'MiHorario' },
    { path: '/docente/prestamos', component: 'PrestamosEspacios' },
    { path: '/docente/solicitudes', component: 'ConsultorDocenteHome' },
    { path: '/notificaciones', component: 'Notificaciones' },
    { path: '/ajustes', component: 'Ajustes' }
  ],
  estudiante: [
    { path: '/estudiante/dashboard', component: 'ConsultorEstudianteHome' },
    { path: '/estudiante/mi-horario', component: 'MiHorario' },
    { path: '/notificaciones', component: 'Notificaciones' },
    { path: '/ajustes', component: 'Ajustes' }
  ]
};

export function useRoutes() {
  const { usuario } = useUser();
  const currentRole = normalizeRole(usuario?.rol as any) as Role | undefined;

  // Devuelve la ruta home por rol
  // Devuelve la ruta home por rol
  const getHomeRouteByRole = useCallback((roleCode: string): string => {
    console.log('[useRoutes] getHomeRouteByRole llamado con:', roleCode);

    // Manejar roles del backend directamente
    if (roleCode === 'ADMIN_PLANEACION') {
      return '/admin/dashboard';
    }

    if (roleCode.startsWith('PLANEACION_')) {
      // Roles como PLANEACION_INGENIERIA, PLANEACION_DERECHO, etc.
      return '/admin/dashboard';
    }

    if (roleCode === 'SUPERVISOR_GENERAL') {
      return '/supervisor/dashboard';
    }

    if (roleCode === 'DOCENTE') {
      return '/docente/dashboard';
    }

    if (roleCode === 'ESTUDIANTE') {
      return '/estudiante/dashboard';
    }

    // Fallback: intentar normalizar roles antiguos
    const normalized = normalizeRole(roleCode) as Role | undefined;
    switch (normalized) {
      case 'admin':
        return '/admin/dashboard';
      case 'supervisor_general':
        return '/supervisor/dashboard';
      case 'docente':
        return '/docente/dashboard';
      case 'estudiante':
        return '/estudiante/dashboard';
      default:
        console.warn('[useRoutes] Role desconocido:', roleCode, 'retornando /login');
        return '/login';
    }
  }, []);

  // Verifica si el rol puede acceder a una ruta
  function canAccessRoute(path: string, role?: Role): boolean {
    if (!role) return false;
    return routesByRole[role].some(r => r.path === path);
  }

  // Devuelve las rutas protegidas para el rol actual
  const protectedRoutes = useMemo(() => {
    if (!currentRole) return [];
    return routesByRole[currentRole];
  }, [currentRole]);

  return {
    currentRole,
    getHomeRouteByRole,
    canAccessRoute,
    protectedRoutes
  };
}
