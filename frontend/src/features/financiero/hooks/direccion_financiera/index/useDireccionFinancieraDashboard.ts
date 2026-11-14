import { useLocation, useNavigate } from 'react-router-dom';

export function useDireccionFinancieraDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/pendientes')) return 'pendientes';
    if (path.includes('/revisar')) return 'revisar';
    if (path.includes('/enviar')) return 'enviar';
    if (path.includes('/confirmar')) return 'confirmar';
    return 'dashboard';
  })();

  return {
    activeView,
    goToPendientes: () => navigate('/financiero/direccion-financiera/pendientes'),
    goToRevisar: () => navigate('/financiero/direccion-financiera/revisar'),
    goToEnviar: () => navigate('/financiero/direccion-financiera/enviar'),
    goToConfirmar: () => navigate('/financiero/direccion-financiera/confirmar'),
  };
}
