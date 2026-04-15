import { useLocation, useNavigate } from 'react-router-dom';
import RectoriaHome from './RectoriaHome';
import MisPendientes from './MisPendientes';
import AutorizarPagos from './AutorizarPagos';

export default function RectoriaDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/pendientes')) return 'pendientes';
    if (path.includes('/autorizar')) return 'autorizar';
    return 'dashboard';
  })();

  const renderContent = () => {
    switch (activeView) {
      case 'pendientes':
        return <MisPendientes />;
      case 'autorizar':
        return <AutorizarPagos />;
      default:
        return (
          <RectoriaHome
            onGoToPendientes={() => navigate('/financiero/rectoria/pendientes')}
            onGoToAutorizar={() => navigate('/financiero/rectoria/autorizar')}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
