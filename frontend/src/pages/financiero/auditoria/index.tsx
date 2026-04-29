import AuditoriaHome from './AuditoriaHome';
import MisPendientes from './MisPendientes';
import ControlPrevio from './ControlPrevio';
import { useAuditoriaDashboard } from '../../../hooks/financiero/auditoria';

export default function AuditoriaDashboard() {
  const { activeView, goToPendientes, goToControl } = useAuditoriaDashboard();

  const renderContent = () => {
    switch (activeView) {
      case 'pendientes':
        return <MisPendientes />;
      case 'control':
        return <ControlPrevio />;
      default:
        return (
          <AuditoriaHome
            onGoToPendientes={goToPendientes}
            onGoToControl={goToControl}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
