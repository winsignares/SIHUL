import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Importa los componentes reales según existan
import DashboardHome from '../pages/dashboard/DashboardHome';
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
import AsignacionAutomatica from '../pages/gestionAcademica/AsignacionAutomatica';

// Componente Layout que usa AdminDashboard como base
function AppLayout() {
  return <AdminDashboard><Outlet /></AdminDashboard>;
}

// Componente para proteger rutas por componentes del backend
function ProtectedRoute({
  children,
  requiredComponent
}: {
  children: React.ReactNode;
  requiredComponent?: string; // Código del componente requerido
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

  // Si no está logueado, solo puede ver Login
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Obtener el primer componente dashboard para redirección inicial
  const dashboardComponent = components.find(c => c.code.includes('DASHBOARD'));
  const homeRoute = dashboardComponent ?
    (dashboardComponent.code === 'ADMIN_DASHBOARD' ? '/admin/dashboard' :
      dashboardComponent.code === 'SUPERVISOR_DASHBOARD' ? '/supervisor/dashboard' :
        dashboardComponent.code === 'DOCENTE_DASHBOARD' ? '/docente/dashboard' :
          dashboardComponent.code === 'ESTUDIANTE_DASHBOARD' ? '/estudiante/dashboard' :
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
          <ProtectedRoute requiredComponent="ADMIN_DASHBOARD">
            <DashboardHome />
          </ProtectedRoute>
        } />

        <Route path="admin/centro-institucional" element={
          <ProtectedRoute requiredComponent="CENTRO_INSTITUCIONAL">
            <FacultadesPrograms />
          </ProtectedRoute>
        } />

        <Route path="admin/centro-horarios" element={
          <ProtectedRoute requiredComponent="CENTRO_HORARIOS">
            <CentroHorarios />
          </ProtectedRoute>
        } />

        <Route path="admin/asignacion" element={
          <ProtectedRoute requiredComponent="ASIGNACION_AUTOMATICA">
            <AsignacionAutomatica />
          </ProtectedRoute>
        } />

        <Route path="admin/prestamos" element={
          <ProtectedRoute requiredComponent="PRESTAMOS_ESPACIOS">
            <PrestamosEspacios />
          </ProtectedRoute>
        } />

        <Route path="admin/periodos" element={
          <ProtectedRoute requiredComponent="PERIODOS_ACADEMICOS">
            <PeriodosAcademicos />
          </ProtectedRoute>
        } />

        <Route path="admin/asistente-virtual" element={
          <ProtectedRoute requiredComponent="ASISTENTES_VIRTUALES">
            <AsistentesVirtuales />
          </ProtectedRoute>
        } />

        <Route path="admin/ocupacion" element={
          <ProtectedRoute requiredComponent="OCUPACION_SEMANAL">
            <OcupacionSemanal />
          </ProtectedRoute>
        } />

        <Route path="admin/reportes" element={
          <ProtectedRoute requiredComponent="REPORTES_GENERALES">
            <Reportes />
          </ProtectedRoute>
        } />

        <Route path="admin/usuarios" element={
          <ProtectedRoute requiredComponent="GESTION_USUARIOS">
            <GestionUsuarios />
          </ProtectedRoute>
        } />

        {/* Rutas de Supervisor General */}
        <Route path="supervisor/dashboard" element={
          <ProtectedRoute requiredComponent="SUPERVISOR_DASHBOARD">
            <SupervisorGeneralHome />
          </ProtectedRoute>
        } />

        <Route path="supervisor/espacios" element={
          <ProtectedRoute requiredComponent="DISPONIBILIDAD_ESPACIOS">
            <ConsultaEspacios />
          </ProtectedRoute>
        } />

        <Route path="supervisor/prestamos" element={
          <ProtectedRoute requiredComponent="APERTURA_CIERRE_SALONES">
            <SupervisorSalonHome />
          </ProtectedRoute>
        } />

        <Route path="supervisor/recursos" element={
          <ProtectedRoute requiredComponent="ESTADO_RECURSOS">
            <EstadoRecursos />
          </ProtectedRoute>
        } />

        <Route path="supervisor/asistente-virtual" element={
          <ProtectedRoute requiredComponent="ASISTENTES_VIRTUALES_SUPERVISOR">
            <AsistentesVirtuales />
          </ProtectedRoute>
        } />

        {/* Rutas de Consultor Docente */}
        <Route path="docente/dashboard" element={
          <ProtectedRoute requiredComponent="DOCENTE_DASHBOARD">
            <ConsultorDocenteHome />
          </ProtectedRoute>
        } />

        <Route path="docente/horario" element={
          <ProtectedRoute requiredComponent="MI_HORARIO">
            <MiHorario />
          </ProtectedRoute>
        } />

        <Route path="docente/prestamos" element={
          <ProtectedRoute requiredComponent="PRESTAMOS_DOCENTE">
            <DocentePrestamos />
          </ProtectedRoute>
        } />

        <Route path="docente/asistente-virtual" element={
          <ProtectedRoute requiredComponent="ASISTENTES_VIRTUALES_DOCENTE">
            <AsistentesVirtuales />
          </ProtectedRoute>
        } />

        {/* Rutas de Consultor Estudiante */}
        <Route path="estudiante/dashboard" element={
          <ProtectedRoute requiredComponent="ESTUDIANTE_DASHBOARD">
            <ConsultorEstudianteHome />
          </ProtectedRoute>
        } />

        <Route path="estudiante/mi-horario" element={
          <ProtectedRoute requiredComponent="MI_HORARIO_ESTUDIANTE">
            <MiHorario />
          </ProtectedRoute>
        } />

        <Route path="estudiante/asistente-virtual" element={
          <ProtectedRoute requiredComponent="ASISTENTES_VIRTUALES_ESTUDIANTE">
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