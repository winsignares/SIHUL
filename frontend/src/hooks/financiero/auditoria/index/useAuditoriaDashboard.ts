import { useLocation, useNavigate } from 'react-router-dom';

export function useAuditoriaDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/control')) return 'control';
    return 'dashboard';
  })();

  return {
    activeView,
    goToControl: () => navigate('/financiero/auditoria/control'),
  };
}
