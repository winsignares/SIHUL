import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { getRouteForComponent } from '../config/componentRoutes';
import { normalizeFinancialRole, normalizeFinancialText, resolveCanonicalFinancialRole } from '../context/financialRoleUtils';

// Lazy load de componentes para mejorar el rendimiento
const DashboardHome = lazy(() => import('../pages/dashboard/DashboardHome'));
const PublicDashboard = lazy(() => import('../pages/dashboard/PublicDashboard'));
const PublicConsultaHorario = lazy(() => import('../pages/horarios/PublicConsultaHorario'));
const PublicPrestamo = lazy(() => import('../pages/prestamos/PublicPrestamo'));
const FacultadesPrograms = lazy(() => import('../pages/gestionAcademica/FacultadesPrograms'));
const ConsultaEspacios = lazy(() => import('../pages/espacios/ConsultaEspacios'));
const CentroHorarios = lazy(() => import('../pages/gestionAcademica/CentroHorarios'));
const PrestamosEspacios = lazy(() => import('../pages/espacios/PrestamosEspacios'));
const PeriodosAcademicos = lazy(() => import('../pages/gestionAcademica/PeriodosAcademicos'));
const AsistentesVirtuales = lazy(() => import('../pages/chatbot/AsistentesVirtuales'));
const OcupacionSemanal = lazy(() => import('../pages/reporte/OcupacionSemanal'));
const Reportes = lazy(() => import('../pages/reporte/Reportes'));
const GestionUsuarios = lazy(() => import('../pages/gestionAcademica/GestionUsuarios'));
const EstadoRecursos = lazy(() => import('../pages/gestionAcademica/EstadoRecursos'));
const Notificaciones = lazy(() => import('../pages/users/Notificaciones'));
const Ajustes = lazy(() => import('../pages/users/Ajustes'));
const SupervisorGeneralHome = lazy(() => import('../pages/dashboard/SupervisorGeneralHome'));
const SupervisorSalonHome = lazy(() => import('../pages/espacios/SupervisorSalonHome'));
const ConsultorDocenteHome = lazy(() => import('../pages/dashboard/ConsultorDocenteHome'));
const MiHorario = lazy(() => import('../pages/horarios/MiHorario'));
const ConsultorEstudianteHome = lazy(() => import('../pages/dashboard/ConsultorEstudianteHome'));
const Login = lazy(() => import('../pages/users/Login'));
const Register = lazy(() => import('../pages/users/Register'));
const DocentePrestamos = lazy(() => import('../pages/prestamos/DocentePrestamos'));
const EnConstruccion = lazy(() => import('../pages/shared/EnConstruccion'));
const DynamicComponentPage = lazy(() => import('../pages/shared/DynamicComponentPage'));
const SolicitudesEspacio = lazy(() => import('../pages/gestionAcademica/SolicitudesEspacio'));
const ComponentesRoles = lazy(() => import('../pages/permisos/ComponentesRoles'));
const GestionRoles = lazy(() => import('../pages/permisos/GestionRoles'));
const AsignacionEspaciosSeccionalPage = lazy(() => import('../pages/gestionAcademica/AsignacionEspaciosSeccionalPage'));

// Lazy load de componentes Financiero
const FuncionarioDashboard = lazy(() => import('../pages/financiero/funcionario'));
const ProveedorDashboard = lazy(() => import('../pages/financiero/proveedor'));
const ProveedorFacturaDetalle = lazy(() => import('../pages/financiero/proveedor/FacturaDetalle'));
const ContabilidadDashboard = lazy(() => import('../pages/financiero/contabilidad'));
const TesoreriaDashboard = lazy(() => import('../pages/financiero/tesoreria'));
const AuditoriaDashboard = lazy(() => import('../pages/financiero/auditoria'));
const DireccionFinancieraDashboard = lazy(() => import('../pages/financiero/direccion_financiera'));
const RectoriaDashboard = lazy(() => import('../pages/financiero/rectoria'));
const AdminFinancieroDashboard = lazy(() => import('../pages/financiero/admin_financiero'));

// Importar sin lazy (necesarios inmediatamente)
import AdminDashboard from '../layouts/AdminDashboard';

// Componente de Loading
const PageLoader = ({ message = 'Cargando...' }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      <p className="mt-4 text-slate-600 font-medium">{message}</p>
    </div>
  </div>
);

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

  useEffect(() => {
    const hasVerified = localStorage.getItem('public_access_verified') === 'true';
    if (!hasVerified) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  
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
  const location = useLocation();
  const { isAuthenticated, components, role, user, isLoading } = useAuth();
  const [hasBootstrappedRoleView, setHasBootstrappedRoleView] = useState(false);
  const [isRouteTransitionLoading, setIsRouteTransitionLoading] = useState(false);
  const effectiveRole = role ?? user?.rol ?? null;

  useEffect(() => {
    if (!isAuthenticated) {
      setHasBootstrappedRoleView(false);
      return;
    }

    if (hasBootstrappedRoleView) {
      return;
    }

    const timer = window.setTimeout(() => {
      setHasBootstrappedRoleView(true);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, hasBootstrappedRoleView]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsRouteTransitionLoading(false);
      return;
    }

    setIsRouteTransitionLoading(true);
    const timer = window.setTimeout(() => {
      setIsRouteTransitionLoading(false);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, location.pathname]);

  const canonicalFinancialRole = resolveCanonicalFinancialRole({
    roleName: effectiveRole?.nombre,
    userName: user?.nombre || '',
    components,
  });

  const hasComponentByName = (name: string) => components.some(c => c.nombre === name);
  const hasFinancialComponent = components.some(c => {
    const normalized = normalizeFinancialText(c.nombre);
    return normalized.includes('factur') || normalized.includes('financier') || normalized.includes('pendient');
  });
  const hasTesoreriaComponent = components.some(c => {
    const normalized = normalizeFinancialText(c.nombre);
    return (
      normalized.includes('tesorer') ||
      normalized.includes('alistar pago') ||
      normalized.includes('registrar pago') ||
      normalized.includes('pago aplicado') ||
      normalized.includes('factura pagada') ||
      normalized.includes('comprobante egreso')
    );
  });
  const hasDireccionFinancieraComponent = components.some(c => {
    const normalized = normalizeFinancialText(c.nombre);
    return (
      normalized.includes('direccion financiera') ||
      normalized.includes('sindicatura') ||
      normalized.includes('revisar pagos') ||
      normalized.includes('confirmacion pagos') ||
      normalized.includes('control de pago bancario') ||
      normalized.includes('enviar rectoria') ||
      normalized.includes('enviar a rectoria')
    );
  });
  const hasAuditoriaComponent = components.some(c => {
    const normalized = normalizeFinancialText(c.nombre);
    return (
      normalized.includes('auditor') ||
      normalized.includes('control previo') ||
      normalized.includes('revision') ||
      normalized.includes('revisar pagos') ||
      normalized.includes('revisar pago')
    );
  });
  const hasRectoriaComponent = components.some(c => {
    const normalized = normalizeFinancialText(c.nombre);
    return (
      normalized.includes('rector') ||
      normalized.includes('rectoria') ||
      normalized.includes('autorizar pago') ||
      normalized.includes('aprobacion rectoria')
    );
  });
  const hasAdminFinancieroComponent = components.some(c => {
    const normalized = normalizeFinancialText(c.nombre);
    return (
      normalized.includes('admin financiero') ||
      normalized.includes('administrador financiero') ||
      normalized.includes('dashboard admin') ||
      normalized.includes('gestion usuarios financiero') ||
      normalized.includes('gestion de usuarios financiero') ||
      normalized.includes('gestion proveedores') ||
      normalized.includes('gestion proveedores') ||
      normalized.includes('parametrizacion sla') ||
      normalized.includes('reportes consolidados') ||
      normalized.includes('reportes consolidados financiero') ||
      normalized.includes('configuracion sistema') ||
      normalized.includes('configuracion sistema financiero')
    );
  });

  const isRectoriaProfile = canonicalFinancialRole === 'rectoria';

  const isDireccionFinancieraProfile = canonicalFinancialRole === 'direccion_financiera';

  const isAdminFinancieroProfile = canonicalFinancialRole === 'admin_financiero';

  const isAdminFinancieroByRole = normalizeFinancialRole(effectiveRole?.nombre) === 'admin_financiero';

  const canAccessAdminFinanciero =
    isAdminFinancieroByRole ||
    (isAdminFinancieroProfile &&
      (hasComponentByName('Dashboard Admin Financiero') || hasAdminFinancieroComponent));

  const canAccessRectoria =
    !isAdminFinancieroByRole &&
    !canAccessAdminFinanciero &&
    isRectoriaProfile &&
    (hasComponentByName('Dashboard Rectoria') || hasComponentByName('Autorizar Pagos') || hasRectoriaComponent);

  const canAccessDireccionFinanciera =
    isDireccionFinancieraProfile &&
    (hasComponentByName('Dashboard Direccion Financiera') || hasDireccionFinancieraComponent || hasFinancialComponent);

  // Evita renderizar layouts vacíos mientras se hidrata sesión y componentes del rol.
  if (isAuthenticated && (!hasBootstrappedRoleView || isLoading || isRouteTransitionLoading)) {
    return <PageLoader message="Cargando componentes de tu rol..." />;
  }

  // Si no está logueado, solo puede ver Login y rutas públicas
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
      </Suspense>
    );
  }

  // Definir redirección inicial según rol y componentes exactos del backend
  const homeRoute = (() => {
    const roleName = effectiveRole?.nombre;

    if (roleName === 'admin') {
      if (hasComponentByName('Dashboard')) return '/admin/dashboard';
      if (hasComponentByName('Gestión de Usuarios')) return '/admin/usuarios';
      if (hasComponentByName('Gestión de Roles')) return '/admin/roles';
      if (hasComponentByName('Gestión de Componentes')) return '/admin/componentes-roles';
    }

    if (roleName === 'admin_planeacion' || roleName === 'planeacion_facultad') {
      if (hasComponentByName('Dashboard')) return '/admin/dashboard';
    }

    if (roleName === 'supervisor_general') {
      if (hasComponentByName('Dashboard Supervisor')) return '/supervisor/dashboard';
    }

    if (roleName === 'docente') {
      if (hasComponentByName('Dashboard Docente')) return '/docente/dashboard';
    }

    if (roleName === 'estudiante') {
      if (hasComponentByName('Dashboard Estudiante')) return '/estudiante/dashboard';
    }

    // Redirección para roles del módulo Financiero
    // AdminFinanciero tiene prioridad sobre Rectoria
    if (canAccessAdminFinanciero) {
      return '/financiero/admin-financiero/dashboard';
    }

    if (canAccessRectoria) {
      return '/financiero/rectoria/dashboard';
    }

    if (canAccessDireccionFinanciera) {
      return '/financiero/direccion-financiera/dashboard';
    }

    if (canonicalFinancialRole === 'tesoreria' && (hasComponentByName('Alistar Pagos') || hasComponentByName('Registrar Pago Aplicado') || hasTesoreriaComponent || hasFinancialComponent)) {
      return '/financiero/tesoreria/dashboard';
    }

    if (canonicalFinancialRole === 'auditoria' && (hasComponentByName('Control Previo') || hasAuditoriaComponent || hasFinancialComponent)) {
      return '/financiero/auditoria/dashboard';
    }

    if (canonicalFinancialRole === 'contabilidad' && (hasComponentByName('Causar Factura') || hasComponentByName('Causar Facturas') || hasFinancialComponent)) {
      return '/financiero/contabilidad/dashboard';
    }

    if (canonicalFinancialRole === 'proveedor') {
      return '/financiero/proveedor/dashboard';
    }

    if (canonicalFinancialRole === 'funcionario' && (hasComponentByName('Gestión de Facturas') || hasFinancialComponent)) {
      return '/financiero/funcionario/dashboard';
    }

    for (const component of components) {
      const route = getRouteForComponent(component.nombre);
      if (route !== '/') {
        return route;
      }
    }

    return '/notificaciones';
  })();

  // Rutas protegidas con layout compartido
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Rutas públicas disponibles incluso si hay sesión activa */}
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

        <Route path="asignacion-espacios-seccional" element={
          <ProtectedRoute requiredComponent="Asignación de espacios por seccional">
            <AsignacionEspaciosSeccionalPage />
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

        <Route path="admin/componentes-roles" element={
          <ProtectedRoute requiredComponent="Gestión de Componentes">
            <ComponentesRoles />
          </ProtectedRoute>
        } />

        <Route path="admin/roles" element={
          <ProtectedRoute requiredComponent="Gestión de Roles">
            <GestionRoles />
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

        {/* Rutas de Módulo Financiero */}
        <Route path="financiero/funcionario" element={
          <ProtectedRoute>
            <FuncionarioDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/funcionario/dashboard" element={
          <ProtectedRoute>
            <FuncionarioDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/funcionario/registrar" element={
          <ProtectedRoute>
            <FuncionarioDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/funcionario/consultar" element={
          <ProtectedRoute>
            <FuncionarioDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/funcionario/pendientes" element={
          <ProtectedRoute>
            <FuncionarioDashboard />
          </ProtectedRoute>
        } />

        {/* Rutas de Proveedor */}
        <Route path="financiero/proveedor" element={
          <ProtectedRoute>
            <ProveedorDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/proveedor/dashboard" element={
          <ProtectedRoute>
            <ProveedorDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/proveedor/enviar" element={
          <ProtectedRoute>
            <ProveedorDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/proveedor/mis-facturas" element={
          <ProtectedRoute>
            <ProveedorDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/proveedor/:id" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <ProveedorFacturaDetalle />
            </Suspense>
          </ProtectedRoute>
        } />

        {/* Rutas de Contabilidad */}
        <Route path="financiero/contabilidad" element={
          <ProtectedRoute>
            <ContabilidadDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/contabilidad/dashboard" element={
          <ProtectedRoute>
            <ContabilidadDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/contabilidad/pendientes" element={
          <ProtectedRoute>
            <ContabilidadDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/contabilidad/radicar" element={
          <ProtectedRoute>
            <ContabilidadDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/contabilidad/causar" element={
          <ProtectedRoute>
            <ContabilidadDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/contabilidad/centro-contable" element={
          <ProtectedRoute>
            <ContabilidadDashboard />
          </ProtectedRoute>
        } />

        {/* Rutas de Tesoreria */}
        <Route path="financiero/tesoreria" element={
          <ProtectedRoute>
            <TesoreriaDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/tesoreria/dashboard" element={
          <ProtectedRoute>
            <TesoreriaDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/tesoreria/pendientes" element={
          <ProtectedRoute>
            <TesoreriaDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/tesoreria/alistar" element={
          <ProtectedRoute>
            <TesoreriaDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/tesoreria/enviar" element={
          <ProtectedRoute>
            <TesoreriaDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/tesoreria/registrar-pago" element={
          <ProtectedRoute>
            <TesoreriaDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/tesoreria/comprobante" element={
          <ProtectedRoute>
            <TesoreriaDashboard />
          </ProtectedRoute>
        } />

        {/* Rutas de Auditoria */}
        <Route path="financiero/auditoria" element={
          <ProtectedRoute>
            <AuditoriaDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/auditoria/dashboard" element={
          <ProtectedRoute>
            <AuditoriaDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/auditoria/pendientes" element={
          <ProtectedRoute>
            <AuditoriaDashboard />
          </ProtectedRoute>
        } />
        <Route path="financiero/auditoria/control" element={
          <ProtectedRoute>
            <AuditoriaDashboard />
          </ProtectedRoute>
        } />

        {/* Rutas de Direccion Financiera */}
        <Route path="financiero/direccion-financiera" element={
          canAccessDireccionFinanciera ? (
            <ProtectedRoute>
              <DireccionFinancieraDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/direccion-financiera/dashboard" element={
          canAccessDireccionFinanciera ? (
            <ProtectedRoute>
              <DireccionFinancieraDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/direccion-financiera/pendientes" element={
          canAccessDireccionFinanciera ? (
            <ProtectedRoute>
              <DireccionFinancieraDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/direccion-financiera/revisar" element={
          canAccessDireccionFinanciera ? (
            <ProtectedRoute>
              <DireccionFinancieraDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/direccion-financiera/enviar" element={
          canAccessDireccionFinanciera ? (
            <ProtectedRoute>
              <DireccionFinancieraDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/direccion-financiera/confirmar" element={
          canAccessDireccionFinanciera ? (
            <ProtectedRoute>
              <DireccionFinancieraDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />

        {/* Rutas de Rectoria */}
        <Route path="financiero/rectoria" element={
          canAccessRectoria ? (
            <ProtectedRoute>
              <RectoriaDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/rectoria/dashboard" element={
          canAccessRectoria ? (
            <ProtectedRoute>
              <RectoriaDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/rectoria/pendientes" element={
          canAccessRectoria ? (
            <ProtectedRoute>
              <RectoriaDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/rectoria/autorizar" element={
          canAccessRectoria ? (
            <ProtectedRoute>
              <RectoriaDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />

        {/* Rutas de Admin Financiero */}
        <Route path="financiero/admin-financiero" element={
          canAccessAdminFinanciero ? (
            <ProtectedRoute>
              <AdminFinancieroDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/admin-financiero/dashboard" element={
          canAccessAdminFinanciero ? (
            <ProtectedRoute>
              <AdminFinancieroDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/admin-financiero/usuarios" element={
          canAccessAdminFinanciero ? (
            <ProtectedRoute>
              <AdminFinancieroDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/admin-financiero/proveedores" element={
          canAccessAdminFinanciero ? (
            <ProtectedRoute>
              <AdminFinancieroDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/admin-financiero/sla" element={
          canAccessAdminFinanciero ? (
            <ProtectedRoute>
              <AdminFinancieroDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/admin-financiero/reportes" element={
          canAccessAdminFinanciero ? (
            <ProtectedRoute>
              <AdminFinancieroDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
        } />
        <Route path="financiero/admin-financiero/configuracion" element={
          canAccessAdminFinanciero ? (
            <ProtectedRoute>
              <AdminFinancieroDashboard />
            </ProtectedRoute>
          ) : (
            <Navigate to={homeRoute} replace />
          )
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

        {/* Ruta dinámica para componentes nuevos asignados desde backend */}
        <Route path="componentes/:slug" element={
          <ProtectedRoute>
            <DynamicComponentPage />
          </ProtectedRoute>
        } />

        {/* Ruta por defecto dentro del layout - redirige al home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Login fuera del layout */}
      <Route path="/login" element={<Login />} />
    </Routes>
    </Suspense>
  );
}
