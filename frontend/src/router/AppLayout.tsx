import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCacheEnVivo } from '../hooks/useCacheEnVivo';
import AdminDashboard from '../layouts/AdminDashboard';

// Componente Layout que usa AdminDashboard como base
export function AppLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Con la sesión abierta, los cambios de otras personas vacían la caché local (ver useCacheEnVivo).
  useCacheEnVivo();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return <AdminDashboard onLogout={handleLogout}><Outlet /></AdminDashboard>;
}
