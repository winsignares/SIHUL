import { useLocation, useNavigate } from 'react-router-dom';

export function useProveedorDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/enviar')) return 'enviar';
    if (path.includes('/mis-facturas')) return 'mis-facturas';
    return 'dashboard';
  })();

  return {
    activeView,
    goToEnviar: () => navigate('/financiero/proveedor/enviar'),
    goToMisFacturas: () => navigate('/financiero/proveedor/mis-facturas'),
  };
}
