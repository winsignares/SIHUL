import { Navigate, Outlet } from 'react-router-dom';
import { AuthService } from '../lib/auth';
import type { Usuario } from '../lib/models';

interface ProtectedRouteProps {
  allowedRoles?: Usuario['rol'][];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const currentUser = AuthService.getSession();

  // Si no hay usuario autenticado, redirigir al login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Si hay roles específicos requeridos, verificar que el usuario tenga uno de ellos
  if (allowedRoles && !allowedRoles.includes(currentUser.rol)) {
    // Redirigir al dashboard correspondiente según el rol del usuario
    const roleDashboards: Record<Usuario['rol'], string> = {
      admin: '/admin',
      autorizado: '/audiovisual',
      consultor: '/consultor',
      consultorDocente: '/docente',
      consultorEstudiante: '/estudiante'
    };
    
    return <Navigate to={roleDashboards[currentUser.rol]} replace />;
  }

  // Si todo está bien, renderizar el componente hijo
  return <Outlet />;
}
