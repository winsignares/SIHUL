import AuditoriaHome from './AuditoriaHome';
import ControlPrevio from './ControlPrevio';
import { useAuditoriaDashboard } from '../../../hooks/financiero/auditoria';

export default function AuditoriaDashboard() {
  const { activeView, goToControl } = useAuditoriaDashboard();

  const renderContent = () => {
    switch (activeView) {
      case 'control':
        return <ControlPrevio />;
      default:
        return <AuditoriaHome onGoToControl={goToControl} />;
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
