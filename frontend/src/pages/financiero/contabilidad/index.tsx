import { useLocation, useNavigate } from 'react-router-dom';
import ContabilidadHome from './ContabilidadHome';
import MisPendientes from './MisPendientes';
import RadicarFacturas from './RadicarFacturas';
import CausarFacturas from './CausarFacturas';

export default function ContabilidadDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/pendientes')) return 'pendientes';
    if (path.includes('/radicar')) return 'radicar';
    if (path.includes('/causar')) return 'causar';
    return 'dashboard';
  })();

  const renderContent = () => {
    switch (activeView) {
      case 'pendientes':
        return <MisPendientes />;
      case 'radicar':
        return <RadicarFacturas />;
      case 'causar':
        return <CausarFacturas />;
      default:
        return (
          <ContabilidadHome
            onGoToPendientes={() => navigate('/financiero/contabilidad/pendientes')}
            onGoToRadicar={() => navigate('/financiero/contabilidad/radicar')}
            onGoToCausar={() => navigate('/financiero/contabilidad/causar')}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
