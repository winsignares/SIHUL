import { useLocation, useNavigate } from 'react-router-dom';
import AdminFinancieroHome from './AdminFinancieroHome';
import GestionUsuarios from './GestionUsuarios';
import GestionProveedores from './GestionProveedores';
import ParametrizacionSLA from './ParametrizacionSLA';
import ReportesConsolidados from './ReportesConsolidados';
import Configuracion from './Configuracion';

export default function AdminFinancieroDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeView = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/usuarios')) return 'usuarios';
    if (path.includes('/proveedores')) return 'proveedores';
    if (path.includes('/sla')) return 'sla';
    if (path.includes('/reportes')) return 'reportes';
    if (path.includes('/configuracion')) return 'configuracion';
    return 'dashboard';
  })();

  const onNavigate = (menu: string) => {
    const routes: Record<string, string> = {
      home: '/financiero/admin-financiero/dashboard',
      usuarios: '/financiero/admin-financiero/usuarios',
      proveedores: '/financiero/admin-financiero/proveedores',
      'parametrizacion-sla': '/financiero/admin-financiero/sla',
      reportes: '/financiero/admin-financiero/reportes',
      configuracion: '/financiero/admin-financiero/configuracion',
    };

    navigate(routes[menu] || '/financiero/admin-financiero/dashboard');
  };

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
