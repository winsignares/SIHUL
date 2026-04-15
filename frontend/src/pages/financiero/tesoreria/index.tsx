import { useLocation, useNavigate } from 'react-router-dom';
import TesoreriaHome from './TesoreriaHome';
import MisPendientes from './MisPendientes';
import AlistarPagos from './AlistarPagos';
import EnviarDireccionFinanciera from './EnviarDireccionFinanciera';
import RegistrarPagoAplicado from './RegistrarPagoAplicado';
import GenerarComprobanteEgreso from './GenerarComprobanteEgreso';

export default function TesoreriaDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/pendientes')) return 'pendientes';
    if (path.includes('/alistar')) return 'alistar';
    if (path.includes('/enviar')) return 'enviar';
    if (path.includes('/registrar-pago')) return 'registrar';
    if (path.includes('/comprobante')) return 'comprobante';
    return 'dashboard';
  })();

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
            onGoToPendientes={() => navigate('/financiero/tesoreria/pendientes')}
            onGoToAlistar={() => navigate('/financiero/tesoreria/alistar')}
            onGoToEnviarDireccion={() => navigate('/financiero/tesoreria/enviar')}
            onGoToRegistrarPago={() => navigate('/financiero/tesoreria/registrar-pago')}
            onGoToComprobante={() => navigate('/financiero/tesoreria/comprobante')}
          />
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
