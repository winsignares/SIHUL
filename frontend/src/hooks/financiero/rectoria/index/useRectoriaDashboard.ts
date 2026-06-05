import { useLocation, useNavigate } from 'react-router-dom';

export function useRectoriaDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/pendientes')) return 'pendientes';
    if (path.includes('/autorizar')) return 'autorizar';
    return 'dashboard';
  })();

  return {
    activeView,
    goToPendientes: () => navigate('/financiero/rectoria/pendientes'),
    goToAutorizar: () => navigate('/financiero/rectoria/autorizar'),
  };
}
