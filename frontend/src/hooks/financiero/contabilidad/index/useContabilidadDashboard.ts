import { useLocation, useNavigate } from 'react-router-dom';

export function useContabilidadDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/pendientes')) return 'pendientes';
    if (path.includes('/radicar')) return 'radicar';
    if (path.includes('/causar')) return 'causar';
    return 'dashboard';
  })();

  return {
    activeView,
    goToPendientes: () => navigate('/financiero/contabilidad/pendientes'),
    goToRadicar: () => navigate('/financiero/contabilidad/radicar'),
    goToCausar: () => navigate('/financiero/contabilidad/causar'),
  };
}
