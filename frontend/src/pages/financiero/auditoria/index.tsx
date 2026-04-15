import { useLocation, useNavigate } from 'react-router-dom';
import AuditoriaHome from './AuditoriaHome';
import MisPendientes from './MisPendientes';
import ControlPrevio from './ControlPrevio';

export default function AuditoriaDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/pendientes')) return 'pendientes';
    if (path.includes('/control')) return 'control';
    return 'dashboard';
  })();

  const renderContent = () => {
    switch (activeView) {
      case 'pendientes':
        return <MisPendientes />;
      case 'control':
        return <ControlPrevio />;
      default:
        return (
          <AuditoriaHome
            onGoToPendientes={() => navigate('/financiero/auditoria/pendientes')}
            onGoToControl={() => navigate('/financiero/auditoria/control')}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
