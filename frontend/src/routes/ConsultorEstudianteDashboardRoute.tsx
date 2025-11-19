import { useNavigate } from 'react-router-dom';
import { AuthService } from '../lib/auth';
import ConsultorEstudianteDashboard from '../components/ConsultorEstudianteDashboard.tsx';

export default function ConsultorEstudianteDashboardRoute() {
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
    <ConsultorEstudianteDashboard 
      userName={currentUser.nombre}
      onLogout={handleLogout}
    />
  );
}
