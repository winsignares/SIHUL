import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AuthService } from '../lib/auth';

interface DashboardWrapperProps {
  children: (props: {
    userName: string;
    onLogout: () => void;
    userRole?: string;
    activeRoute: string;
    navigateTo: (route: string) => void;
  }) => React.ReactNode;
  userRoleProp?: boolean;
}

export default function DashboardWrapper({ children, userRoleProp }: DashboardWrapperProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = AuthService.getSession();

  const handleLogout = () => {
    console.log('👋 Cerrando sesión...');
    AuthService.logout();
    navigate('/login', { replace: true });
  };

  const navigateTo = (route: string) => {
    navigate(route);
  };

  // Extraer la ruta activa (última parte del path)
  const activeRoute = location.pathname.split('/').pop() || 'home';

  if (!currentUser) {
    return null;
  }

  const props = {
    userName: currentUser.nombre,
    onLogout: handleLogout,
    ...(userRoleProp && { userRole: currentUser.rol }),
    activeRoute,
    navigateTo
  };

  return (
    <>
      {children(props)}
    </>
  );
}
