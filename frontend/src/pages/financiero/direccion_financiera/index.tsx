import { useLocation, useNavigate } from 'react-router-dom';
import DireccionFinancieraHome from './DireccionFinancieraHome';
import MisPendientes from './MisPendientes';
import RevisarPagos from './RevisarPagos';
import EnviarRectoria from './EnviarRectoria';
import ConfirmacionPagos from './ConfirmacionPagos';

export default function DireccionFinancieraDashboard() {
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

  const renderContent = () => {
    switch (activeView) {
      case 'pendientes':
        return <MisPendientes />;
      case 'revisar':
        return <RevisarPagos />;
      case 'enviar':
        return <EnviarRectoria />;
      case 'confirmar':
        return <ConfirmacionPagos />;
      default:
        return (
          <DireccionFinancieraHome
            onGoToPendientes={() => navigate('/financiero/direccion-financiera/pendientes')}
            onGoToRevisar={() => navigate('/financiero/direccion-financiera/revisar')}
            onGoToEnviar={() => navigate('/financiero/direccion-financiera/enviar')}
            onGoToConfirmar={() => navigate('/financiero/direccion-financiera/confirmar')}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
