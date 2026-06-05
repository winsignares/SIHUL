import AdminFinancieroHome from './AdminFinancieroHome';
import GestionUsuarios from './GestionUsuarios';
import GestionProveedores from './GestionProveedores';
import ParametrizacionSLA from './ParametrizacionSLA';
import ReportesConsolidados from './ReportesConsolidados';
import Configuracion from './Configuracion';
import { useAdminFinancieroDashboard } from '../../../hooks/financiero/admin_financiero';

export default function AdminFinancieroDashboard() {
  const { activeView, onNavigate } = useAdminFinancieroDashboard();

  const renderContent = () => {
    switch (activeView) {
      case 'usuarios':
        return <GestionUsuarios />;
      case 'proveedores':
        return <GestionProveedores />;
      case 'sla':
        return <ParametrizacionSLA />;
      case 'reportes':
        return <ReportesConsolidados />;
      case 'configuracion':
        return <Configuracion />;
      default:
        return <AdminFinancieroHome onNavigate={onNavigate} />;
    }
  };

  return <div className="p-6">{renderContent()}</div>;
}
