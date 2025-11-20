import { useNavigate } from 'react-router-dom';
import { AuthService } from '../lib/auth';
import AudiovisualDashboard from '../components/AudiovisualDashboard';

export default function AudiovisualDashboardRoute() {
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
    <AudiovisualDashboard 
      userName={currentUser.nombre}
      onLogout={handleLogout}
    />
  );
}
