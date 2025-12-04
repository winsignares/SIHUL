import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Importa los componentes reales según existan
import DashboardHome from '../pages/dashboard/DashboardHome';
import PublicDashboard from '../pages/dashboard/PublicDashboard';
import PublicConsultaHorario from '../pages/horarios/PublicConsultaHorario';
import PublicPrestamo from '../pages/prestamos/PublicPrestamo';
import FacultadesPrograms from '../pages/gestionAcademica/FacultadesPrograms';
import ConsultaEspacios from '../pages/espacios/ConsultaEspacios';
import CentroHorarios from '../pages/gestionAcademica/CentroHorarios';
import PrestamosEspacios from '../pages/espacios/PrestamosEspacios';
import PeriodosAcademicos from '../pages/gestionAcademica/PeriodosAcademicos';
import AsistentesVirtuales from '../pages/chatbot/AsistentesVirtuales';
import OcupacionSemanal from '../pages/reporte/OcupacionSemanal';
import Reportes from '../pages/reporte/Reportes';
import GestionUsuarios from '../pages/gestionAcademica/GestionUsuarios';
import EstadoRecursos from '../pages/gestionAcademica/EstadoRecursos';
import Notificaciones from '../pages/users/Notificaciones';
import Ajustes from '../pages/users/Ajustes';
import SupervisorGeneralHome from '../pages/dashboard/SupervisorGeneralHome';
import SupervisorSalonHome from '../pages/espacios/SupervisorSalonHome';
import ConsultorDocenteHome from '../pages/dashboard/ConsultorDocenteHome';
import MiHorario from '../pages/horarios/MiHorario';
import ConsultorEstudianteHome from '../pages/dashboard/ConsultorEstudianteHome';
import Login from '../pages/users/Login';
import AdminDashboard from '../layouts/AdminDashboard';
import DocentePrestamos from '../pages/prestamos/DocentePrestamos';
import EnConstruccion from '../pages/shared/EnConstruccion';
import SolicitudesEspacio from '../pages/gestionAcademica/SolicitudesEspacio';

// Componente Layout que usa AdminDashboard como base
function AppLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return <AdminDashboard onLogout={handleLogout}><Outlet /></AdminDashboard>;
}

// Componente Layout para rutas públicas (sin componentes)
function PublicLayout() {
  const navigate = useNavigate();
  
  const handlePublicLogout = () => {
    // Solo limpiar localStorage sin llamar al backend
    localStorage.clear();
    navigate('/login');
  };
  
  return <AdminDashboard onLogout={handlePublicLogout}><Outlet /></AdminDashboard>;
}

// Componente para proteger rutas por componentes del backend
function ProtectedRoute({
  children,
  requiredComponent
}: {
  children: React.ReactNode;
  requiredComponent?: string; // Nombre del componente requerido
}) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si no requiere componente específico, permitir acceso
  if (!requiredComponent) {
    return <>{children}</>;
  }

  // Verificar si el usuario tiene el componente
  if (!hasPermission(requiredComponent)) {
    console.warn('[ProtectedRoute] Acceso denegado a componente:', requiredComponent);
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
        <p className="text-sm text-gray-500 mt-2">Componente requerido: {requiredComponent}</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AppRouter() {
  const { isAuthenticated, components } = useAuth();

  // Si no está logueado, solo puede ver Login y rutas públicas
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/public" element={<PublicLayout />}>
          <Route index element={<Navigate to="/public/dashboard" replace />} />
          <Route path="dashboard" element={<PublicDashboard />} />
          <Route path="consulta-horario" element={<PublicConsultaHorario />} />
          <Route path="disponibilidad-espacios" element={<ConsultaEspacios />} />
          <Route path="prestamo" element={<PublicPrestamo />} />
          <Route path="asistente-virtual" element={<AsistentesVirtuales />} />
          <Route path="espacios" element={<Navigate to="/public/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/public/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Obtener el primer componente dashboard para redirección inicial
  const dashboardComponent = components.find(c => c.nombre.toLowerCase().includes('dashboard'));
  const homeRoute = dashboardComponent ?
    (dashboardComponent.nombre === 'Dashboard' ? '/admin/dashboard' :
      dashboardComponent.nombre === 'Dashboard Supervisor' ? '/supervisor/dashboard' :
        dashboardComponent.nombre === 'Dashboard Docente' ? '/docente/dashboard' :
          dashboardComponent.nombre === 'Dashboard Estudiante' ? '/estudiante/dashboard' :
            '/admin/dashboard') : '/admin/dashboard';

  // Rutas protegidas con layout compartido
  return (
    <Routes>
      {/* Todas las rutas protegidas usan el layout compartido */}
      <Route path="/" element={<AppLayout />}>
        {/* Ruta raíz - redirige al home del rol */}
        <Route index element={<Navigate to={homeRoute} replace />} />

        {/* Rutas de Admin - Planeación */}
        <Route path="admin/dashboard" element={
          <ProtectedRoute requiredComponent="Dashboard">
            <DashboardHome />
          </ProtectedRoute>
        } />

        <Route path="admin/centro-institucional" element={
          <ProtectedRoute requiredComponent="Centro Institucional">
            <FacultadesPrograms />
          </ProtectedRoute>
        } />

        <Route path="admin/centro-horarios" element={
          <ProtectedRoute requiredComponent="Centro de Horarios">
            <CentroHorarios />
          </ProtectedRoute>
        } />

        <Route path="admin/asignacion" element={
          <ProtectedRoute requiredComponent="Asignación Automática">
            <EnConstruccion />
          </ProtectedRoute>
        } />

        <Route path="admin/prestamos" element={
          <ProtectedRoute requiredComponent="Préstamos de Espacios">
            <PrestamosEspacios />
          </ProtectedRoute>
        } />

        <Route path="admin/periodos" element={
          <ProtectedRoute requiredComponent="Periodos Académicos">
            <PeriodosAcademicos />
          </ProtectedRoute>
        } />

        <Route path="admin/asistente-virtual" element={
          <ProtectedRoute requiredComponent="Asistentes Virtuales">
            <AsistentesVirtuales />
          </ProtectedRoute>
        } />

        <Route path="admin/ocupacion" element={
          <ProtectedRoute requiredComponent="Ocupación Semanal">
            <OcupacionSemanal />
          </ProtectedRoute>
        } />

        <Route path="admin/reportes" element={
          <ProtectedRoute requiredComponent="Reportes Generales">
            <Reportes />
          </ProtectedRoute>
        } />

        <Route path="admin/usuarios" element={
          <ProtectedRoute requiredComponent="Gestión de Usuarios">
            <GestionUsuarios />
          </ProtectedRoute>
        } />

        <Route path="admin/estado-recursos" element={
          <ProtectedRoute requiredComponent="Estado de Recursos">
            <EstadoRecursos />
          </ProtectedRoute>
        } />

        <Route path="admin/solicitudes-espacio" element={
          <ProtectedRoute>
            <SolicitudesEspacio />
          </ProtectedRoute>
        } />

        {/* Rutas de Supervisor General */}
        <Route path="supervisor/dashboard" element={
          <ProtectedRoute requiredComponent="Dashboard Supervisor">
            <SupervisorGeneralHome />
          </ProtectedRoute>
        } />

        <Route path="supervisor/espacios" element={
          <ProtectedRoute requiredComponent="Disponibilidad de Espacios">
            <ConsultaEspacios />
          </ProtectedRoute>
        } />

        <Route path="supervisor/prestamos" element={
          <ProtectedRoute requiredComponent="Apertura y Cierre de Salones">
            <SupervisorSalonHome />
          </ProtectedRoute>
        } />

        <Route path="supervisor/recursos" element={
          <ProtectedRoute requiredComponent="Estado de Recursos">
            <EstadoRecursos />
          </ProtectedRoute>
        } />

        <Route path="supervisor/asistente-virtual" element={
          <ProtectedRoute requiredComponent="Asistentes Virtuales Supervisor">
            <AsistentesVirtuales />
          </ProtectedRoute>
        } />

        {/* Rutas de Consultor Docente */}
        <Route path="docente/dashboard" element={
          <ProtectedRoute requiredComponent="Dashboard Docente">
            <ConsultorDocenteHome />
          </ProtectedRoute>
        } />

        <Route path="docente/horario" element={
          <ProtectedRoute requiredComponent="Mi Horario">
            <MiHorario />
          </ProtectedRoute>
        } />

        <Route path="docente/prestamos" element={
          <ProtectedRoute requiredComponent="Préstamos Docente">
            <DocentePrestamos />
          </ProtectedRoute>
        } />

        <Route path="docente/asistente-virtual" element={
          <ProtectedRoute requiredComponent="Asistentes Virtuales Docente">
            <AsistentesVirtuales />
          </ProtectedRoute>
        } />

        {/* Rutas de Consultor Estudiante */}
        <Route path="estudiante/dashboard" element={
          <ProtectedRoute requiredComponent="Dashboard Estudiante">
            <ConsultorEstudianteHome />
          </ProtectedRoute>
        } />

        <Route path="estudiante/mi-horario" element={
          <ProtectedRoute requiredComponent="Mi Horario Estudiante">
            <MiHorario />
          </ProtectedRoute>
        } />

        <Route path="estudiante/asistente-virtual" element={
          <ProtectedRoute requiredComponent="Asistentes Virtuales Estudiante">
            <AsistentesVirtuales />
          </ProtectedRoute>
        } />

        {/* Rutas compartidas - no requieren componente específico */}
        <Route path="notificaciones" element={
          <ProtectedRoute>
            <Notificaciones />
          </ProtectedRoute>
        } />

        <Route path="ajustes" element={
          <ProtectedRoute>
            <Ajustes />
          </ProtectedRoute>
        } />

        {/* Ruta por defecto dentro del layout - redirige al home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Login fuera del layout */}
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}