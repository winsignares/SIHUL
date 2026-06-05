import RectoriaHome from './RectoriaHome';
import MisPendientes from './MisPendientes';
import AutorizarPagos from './AutorizarPagos';
import { useRectoriaDashboard } from '../../../hooks/financiero/rectoria';

export default function RectoriaDashboard() {
  const { activeView, goToPendientes, goToAutorizar } = useRectoriaDashboard();

  const renderContent = () => {
    switch (activeView) {
      case 'pendientes':
        return <MisPendientes />;
      case 'autorizar':
        return <AutorizarPagos />;
      default:
        return (
          <RectoriaHome
            onGoToPendientes={goToPendientes}
            onGoToAutorizar={goToAutorizar}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
