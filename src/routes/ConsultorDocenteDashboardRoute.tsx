import { useNavigate } from 'react-router-dom';
import { AuthService } from '../lib/auth';
import ConsultorDocenteDashboard from '../components/ConsultorDocenteDashboard.tsx';

export default function ConsultorDocenteDashboardRoute() {
  const navigate = useNavigate();
  const currentUser = AuthService.getSession();

  const handleLogout = () => {
    console.log('👋 Cerrando sesión...');
    AuthService.logout();
    navigate('/login', { replace: true });
  };

  if (!currentUser) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <ConsultorDocenteDashboard 
      userName={currentUser.nombre}
      onLogout={handleLogout}
    />
  );
}
