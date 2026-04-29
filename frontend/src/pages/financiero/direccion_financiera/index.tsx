import DireccionFinancieraHome from './DireccionFinancieraHome';
import MisPendientes from './MisPendientes';
import RevisarPagos from './RevisarPagos';
import EnviarRectoria from './EnviarRectoria';
import ConfirmacionPagos from './ConfirmacionPagos';
import { useDireccionFinancieraDashboard } from '../../../hooks/financiero/direccion_financiera';

export default function DireccionFinancieraDashboard() {
  const { activeView, goToPendientes, goToRevisar, goToEnviar, goToConfirmar } = useDireccionFinancieraDashboard();

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
            onGoToPendientes={goToPendientes}
            onGoToRevisar={goToRevisar}
            onGoToEnviar={goToEnviar}
            onGoToConfirmar={goToConfirmar}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
