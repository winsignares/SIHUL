import { useLocation, useNavigate } from 'react-router-dom';

export function useTesoreriaDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/pendientes')) return 'pendientes';
    if (path.includes('/alistar')) return 'alistar';
    if (path.includes('/enviar')) return 'enviar';
    if (path.includes('/registrar-pago')) return 'registrar';
    if (path.includes('/comprobante')) return 'comprobante';
    return 'dashboard';
  })();

  return {
    activeView,
    goToPendientes: () => navigate('/financiero/tesoreria/pendientes'),
    goToAlistar: () => navigate('/financiero/tesoreria/alistar'),
    goToEnviarDireccion: () => navigate('/financiero/tesoreria/enviar'),
    goToRegistrarPago: () => navigate('/financiero/tesoreria/registrar-pago'),
    goToComprobante: () => navigate('/financiero/tesoreria/comprobante'),
  };
}
