import ContabilidadHome from './ContabilidadHome';
import MisPendientes from './MisPendientes';
import RadicarFacturas from './RadicarFacturas';
import CausarFacturas from './CausarFacturas';
import CentroContable from './CentroContable';
import { useContabilidadDashboard } from '../../../hooks/financiero/contabilidad';

export default function ContabilidadDashboard() {
  const { activeView, goToPendientes, goToRadicar, goToCausar, goToCentroContable } = useContabilidadDashboard();

  const renderContent = () => {
    switch (activeView) {
      case 'pendientes':
        return <MisPendientes />;
      case 'radicar':
        return <RadicarFacturas />;
      case 'causar':
        return <CausarFacturas />;
      case 'centro-contable':
        return <CentroContable />;
      default:
        return (
          <ContabilidadHome
            onGoToPendientes={goToPendientes}
            onGoToRadicar={goToRadicar}
            onGoToCausar={goToCausar}
            onGoToFacturaPagada={goToCentroContable}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
