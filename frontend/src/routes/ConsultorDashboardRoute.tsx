import { useNavigate } from 'react-router-dom';
import { AuthService } from '../lib/auth';
import ConsultorDashboard from '../components/ConsultorDashboard';

export default function ConsultorDashboardRoute() {
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
    <ConsultorDashboard 
      userName={currentUser.nombre}
      onLogout={handleLogout}
    />
  );
}
