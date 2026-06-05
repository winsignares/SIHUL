import { useLocation, useNavigate } from 'react-router-dom';

export function useFuncionarioDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/registrar')) return 'registrar';
    if (path.includes('/consultar')) return 'consultar';
    if (path.includes('/pendientes')) return 'pendientes';
    return 'dashboard';
  })();

  return {
    activeView,
    goToRegistrar: () => navigate('/financiero/funcionario/registrar'),
    goToConsultar: () => navigate('/financiero/funcionario/consultar'),
  };
}
