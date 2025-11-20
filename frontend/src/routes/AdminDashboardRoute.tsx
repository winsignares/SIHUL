import { useNavigate } from 'react-router-dom';
import { AuthService } from '../lib/auth';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminDashboardRoute() {
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
    <AdminDashboard 
      userName={currentUser.nombre}
      onLogout={handleLogout}
      userRole={currentUser.rol as 'admin' | 'autorizado'}
    />
  );
}
