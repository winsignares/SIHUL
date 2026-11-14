import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { calcularAccesos } from './accesos';
import { AppLayout } from './AppLayout';
import { PageLoader } from './PageLoader';
import { Login, Register, RegistroProveedor } from './paginas';
import { rutasAdmin } from './rutas/admin';
import { rutasCompartidas } from './rutas/compartidas';
import { rutasDocente, rutasEstudiante } from './rutas/consultores';
import { rutasFinanciero } from './rutas/financiero';
import { rutasAsistentePublico, rutasPublicas } from './rutas/publicas';
import { rutasSupervisor } from './rutas/supervisor';

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

  const accesos = calcularAccesos({ components, effectiveRole, userName: user?.nombre || '' });

  // Evita renderizar layouts vacíos mientras se hidrata sesión y componentes del rol.
  if (isAuthenticated && (!hasBootstrappedRoleView || isLoading || isRouteTransitionLoading)) {
    return <PageLoader message="Cargando componentes de tu rol..." />;
  }

  // Si no está logueado, solo puede ver Login y rutas públicas
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {rutasAsistentePublico()}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registro-proveedor" element={<RegistroProveedor />} />
          {rutasPublicas()}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    );
  }

  // Rutas protegidas con layout compartido
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Enlace público de una seccional al asistente virtual: sin menú ni sesión */}
        {rutasAsistentePublico()}

        {/* Rutas públicas disponibles incluso si hay sesión activa */}
        {rutasPublicas()}

        {/* Todas las rutas protegidas usan el layout compartido */}
        <Route path="/" element={<AppLayout />}>
          {/* Ruta raíz - redirige al home del rol */}
          <Route index element={<Navigate to={accesos.homeRoute} replace />} />

          {rutasAdmin()}
          {rutasSupervisor()}
          {rutasDocente()}
          {rutasEstudiante()}
          {rutasFinanciero(accesos)}
          {rutasCompartidas()}

          {/* Ruta por defecto dentro del layout - redirige al home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Login fuera del layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro-proveedor" element={<RegistroProveedor />} />
      </Routes>
    </Suspense>
  );
}
