import { useUser } from '../context/UserContext';
import { useMemo, useCallback } from 'react';
import { normalizeRole } from '../context/roleUtils';

export type Role = 'admin' | 'supervisor_general' | 'consultor_docente' | 'consultor_estudiante';

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
  consultor_docente: [
    { path: '/docente/dashboard', component: 'ConsultorDocenteHome' },
    { path: '/docente/horario', component: 'MiHorario' },
    { path: '/docente/prestamos', component: 'PrestamosEspacios' },
    { path: '/docente/solicitudes', component: 'ConsultorDocenteHome' },
    { path: '/notificaciones', component: 'Notificaciones' },
    { path: '/ajustes', component: 'Ajustes' }
  ],
  consultor_estudiante: [
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
  const getHomeRouteByRole = useCallback((role: Role | string): string => {
    const normalized = normalizeRole(role as any) as Role | undefined;
    console.log('getHomeRouteByRole llamado con role:', role, 'normalizado:', normalized);
    switch (normalized) {
      case 'admin':
        console.log('Retornando /admin/dashboard para admin');
        return '/admin/dashboard';
      case 'supervisor_general':
        console.log('Retornando /supervisor/dashboard para supervisor_general');
        return '/supervisor/dashboard';
      case 'consultor_docente':
        console.log('Retornando /docente/dashboard para consultor_docente');
        return '/docente/dashboard';
      case 'consultor_estudiante':
        console.log('Retornando /estudiante/dashboard para consultor_estudiante');
        return '/estudiante/dashboard';
      default:
        console.log('Role desconocido:', role, 'retornando /login');
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
