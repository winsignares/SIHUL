import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useRoutes } from '../hooks/useRoutes';
import { useUser } from '../context/UserContext';
// Importa los componentes reales según existan
import DashboardHome from '../pages/dashboard/DashboardHome';
import FacultadesPrograms from '../pages/gestionAcademica/FacultadesPrograms';
import EspaciosFisicos from '../pages/gestionAcademica/EspaciosFisicos';
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

// Componente para proteger rutas por rol
function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[] 
}) {
  const { usuario } = useUser();
  const { currentRole } = useRoutes();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!currentRole || !allowedRoles.includes(currentRole)) {
    console.log('ProtectedRoute: ACCESO DENEGADO. currentRole:', currentRole, 'allowedRoles:', allowedRoles, 'usuario:', usuario);
    // Mostrar mensaje de no autorizado
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
        <p className="text-sm text-gray-500 mt-2">Rol actual: {currentRole}</p>
      </div>
    );
  }

  console.log('ProtectedRoute: ACCESO PERMITIDO. currentRole:', currentRole, 'allowedRoles:', allowedRoles);
  return <>{children}</>;
}

export default function AppRouter() {
  const { usuario } = useUser();
  const { currentRole, getHomeRouteByRole } = useRoutes();
  const navigate = useNavigate();

  // Si no está logueado, solo puede ver Login
  if (!usuario) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Rutas protegidas con layout compartido
  return (
    <Routes>
      {/* Todas las rutas protegidas usan el layout compartido */}
      <Route path="/" element={<AppLayout />}>
        {/* Ruta raíz - redirige al home del rol */}
        <Route index element={<Navigate to={getHomeRouteByRole(currentRole || 'admin')} replace />} />

        {/* Rutas de Admin */}
        <Route path="admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardHome onNavigate={(action: string) => {
              if (action === 'horarios') {
                navigate('/admin/centro-horarios');
              } else if (action === 'crear-horario') {
                // Navegar a Centro Horarios indicando modo crear mediante query param
                navigate('/admin/centro-horarios?mode=crear');
              } else if (action === 'espacios') {
                navigate('/admin/espacios');
              } else if (action === 'facultades') {
                navigate('/admin/centro-institucional');
              } else if (action === 'reportes') {
                navigate('/admin/reportes');
              } else if (action === 'asistentes') {
                navigate('/admin/asistente-virtual');
              } else {
                navigate('/admin/dashboard');
              }
            }} />
          </ProtectedRoute>
        } />
        <Route path="admin/centro-institucional" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <FacultadesPrograms />
          </ProtectedRoute>
        } />
        <Route path="admin/centro-horarios" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CentroHorarios />
          </ProtectedRoute>
        } />
        <Route path="admin/asignacion" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AsignacionAutomatica />
          </ProtectedRoute>
        } />
        <Route path="admin/prestamos" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PrestamosEspacios />
          </ProtectedRoute>
        } />
        <Route path="admin/periodos" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PeriodosAcademicos />
          </ProtectedRoute>
        } />
        <Route path="admin/asistente-virtual" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AsistentesVirtuales />
          </ProtectedRoute>
        } />
        <Route path="admin/ocupacion" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <OcupacionSemanal />
          </ProtectedRoute>
        } />
        <Route path="admin/reportes" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Reportes />
          </ProtectedRoute>
        } />
        <Route path="admin/usuarios" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <GestionUsuarios />
          </ProtectedRoute>
        } />

        {/* Rutas de Supervisor General */}
        <Route path="supervisor/dashboard" element={
          <ProtectedRoute allowedRoles={['supervisor_general']}>
            <SupervisorGeneralHome onNavigate={(action: string) => {
              if (action === 'cronograma') {
                navigate('/supervisor/espacios');
              } else if (action === 'apertura-cierre') {
                navigate('/supervisor/prestamos');
              } else if (action === 'estado-recursos') {
                navigate('/supervisor/recursos');
              } else if (action === 'asistentes') {
                navigate('/supervisor/asistente-virtual');
              } else {
                navigate('/supervisor/dashboard');
              }
            }} />
          </ProtectedRoute>
        } />
        <Route path="supervisor/espacios" element={
          <ProtectedRoute allowedRoles={['supervisor_general']}>
            <ConsultaEspacios />
          </ProtectedRoute>
        } />
        <Route path="supervisor/prestamos" element={
          <ProtectedRoute allowedRoles={['supervisor_general']}>
            <SupervisorSalonHome />
          </ProtectedRoute>
        } />
        <Route path="supervisor/recursos" element={
          <ProtectedRoute allowedRoles={['supervisor_general']}>
            <EstadoRecursos />
          </ProtectedRoute>
        } />
        <Route path="supervisor/asistente-virtual" element={
          <ProtectedRoute allowedRoles={['supervisor_general']}>
            <AsistentesVirtuales />
          </ProtectedRoute>
        } />

        {/* Rutas de Consultor Docente */}
        <Route path="docente/dashboard" element={
          <ProtectedRoute allowedRoles={['consultor_docente']}>
            <ConsultorDocenteHome onNavigate={(action: string) => {
              if (action === 'horario') {
                navigate('/docente/horario');
              } else if (action === 'prestamos') {
                navigate('/docente/prestamos');
              } else if (action === 'asistentes') {
                navigate('/docente/asistente-virtual');
              } else {
                navigate('/docente/dashboard');
              }
            }} />
          </ProtectedRoute>
        } />
        <Route path="docente/horario" element={
          <ProtectedRoute allowedRoles={['consultor_docente']}>
            <MiHorario />
          </ProtectedRoute>
        } />
        <Route path="docente/prestamos" element={
          <ProtectedRoute allowedRoles={['consultor_docente']}>
            <DocentePrestamos />
          </ProtectedRoute>
        } />
        <Route path="docente/asistente-virtual" element={
          <ProtectedRoute allowedRoles={['consultor_docente']}>
            <AsistentesVirtuales />
          </ProtectedRoute>
        } />

        {/* Rutas de Consultor Estudiante */}
        <Route path="estudiante/dashboard" element={
          <ProtectedRoute allowedRoles={['consultor_estudiante']}>
            <ConsultorEstudianteHome onNavigate={(action: string) => {
              if (action === 'horario') {
                navigate('/estudiante/mi-horario');
              } else if (action === 'asistentes') {
                navigate('/estudiante/asistente-virtual');
              } else {
                navigate('/estudiante/dashboard');
              }
            }} />
          </ProtectedRoute>
        } />
        <Route path="estudiante/mi-horario" element={
          <ProtectedRoute allowedRoles={['consultor_estudiante']}>
            <MiHorario />
          </ProtectedRoute>
        } />
        <Route path="estudiante/asistente-virtual" element={
          <ProtectedRoute allowedRoles={['consultor_estudiante']}>
            <AsistentesVirtuales />
          </ProtectedRoute>
        } />

        {/* Rutas compartidas */}
        <Route path="notificaciones" element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor_general', 'consultor_docente', 'consultor_estudiante']}>
            <Notificaciones />
          </ProtectedRoute>
        } />
        <Route path="ajustes" element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor_general', 'consultor_docente', 'consultor_estudiante']}>
            <Ajustes />
          </ProtectedRoute>
        } />

        {/* Ruta por defecto dentro del layout - redirige al home del rol */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Login fuera del layout */}
      <Route path="/login" element={<Login />} />

      {/* Cualquier otra ruta no protegida redirige a login si no está logueado, pero como estamos dentro del if usuario, esto no se alcanza */}
    </Routes>
  );
}