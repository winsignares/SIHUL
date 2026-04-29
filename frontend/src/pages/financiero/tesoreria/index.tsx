import TesoreriaHome from './TesoreriaHome';
import MisPendientes from './MisPendientes';
import AlistarPagos from './AlistarPagos';
import EnviarDireccionFinanciera from './EnviarDireccionFinanciera';
import RegistrarPagoAplicado from './RegistrarPagoAplicado';
import GenerarComprobanteEgreso from './GenerarComprobanteEgreso';
import { useTesoreriaDashboard } from '../../../hooks/financiero/tesoreria';

export default function TesoreriaDashboard() {
  const { activeView, goToPendientes, goToAlistar, goToEnviarDireccion, goToRegistrarPago, goToComprobante } = useTesoreriaDashboard();

  const renderContent = () => {
    switch (activeView) {
      case 'pendientes':
        return <MisPendientes />;
      case 'alistar':
        return <AlistarPagos />;
      case 'enviar':
        return <EnviarDireccionFinanciera />;
      case 'registrar':
        return <RegistrarPagoAplicado />;
      case 'comprobante':
        return <GenerarComprobanteEgreso />;
      default:
        return (
          <TesoreriaHome
            onGoToPendientes={goToPendientes}
            onGoToAlistar={goToAlistar}
            onGoToEnviarDireccion={goToEnviarDireccion}
            onGoToRegistrarPago={goToRegistrarPago}
            onGoToComprobante={goToComprobante}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
