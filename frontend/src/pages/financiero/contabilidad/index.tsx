import ContabilidadHome from './ContabilidadHome';
import MisPendientes from './MisPendientes';
import RadicarFacturas from './RadicarFacturas';
import CausarFacturas from './CausarFacturas';
import { useContabilidadDashboard } from '../../../hooks/financiero/contabilidad';

export default function ContabilidadDashboard() {
  const { activeView, goToPendientes, goToRadicar, goToCausar } = useContabilidadDashboard();

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
            onGoToPendientes={goToPendientes}
            onGoToRadicar={goToRadicar}
            onGoToCausar={goToCausar}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
