import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../layouts/AdminDashboard';

// Componente Layout que usa AdminDashboard como base
export function AppLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return <AdminDashboard onLogout={handleLogout}><Outlet /></AdminDashboard>;
}
