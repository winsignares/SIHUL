import { Navigate, Route } from 'react-router-dom';
import { Suspense, type ComponentType } from 'react';
import { PageLoader } from '../PageLoader';
import { ProtectedRoute } from '../ProtectedRoute';
import {
  AdminFinancieroDashboard,
  AuditoriaDashboard,
  ContabilidadDashboard,
  DireccionFinancieraDashboard,
  FuncionarioDashboard,
  ProveedorDashboard,
  ProveedorFacturaDetalle,
  RectoriaDashboard,
  TesoreriaDashboard,
} from '../paginas';

/** Rutas de un tablero: la base y cada subruta muestran el mismo tablero. */
function rutasDeTablero(base: string, subrutas: string[], Tablero: ComponentType) {
  return [base, ...subrutas.map(sub => `${base}/${sub}`)].map(ruta => (
    <Route key={ruta} path={ruta} element={
      <ProtectedRoute>
        <Tablero />
      </ProtectedRoute>
    } />
  ));
}

/** Igual, pero solo si el rol tiene acceso; si no, vuelve al inicio. */
function rutasDeTableroRestringido(
  base: string, subrutas: string[], Tablero: ComponentType, permitido: boolean, homeRoute: string,
) {
  return [base, ...subrutas.map(sub => `${base}/${sub}`)].map(ruta => (
    <Route key={ruta} path={ruta} element={
      permitido ? (
        <ProtectedRoute>
          <Tablero />
        </ProtectedRoute>
      ) : (
        <Navigate to={homeRoute} replace />
      )
    } />
  ));
}

interface AccesosFinanciero {
  canAccessDireccionFinanciera: boolean;
  canAccessRectoria: boolean;
  canAccessAdminFinanciero: boolean;
  homeRoute: string;
}

/** Rutas del módulo Financiero. */
export const rutasFinanciero = ({
  canAccessDireccionFinanciera, canAccessRectoria, canAccessAdminFinanciero, homeRoute,
}: AccesosFinanciero) => (
  <>
    {/* Rutas de Funcionario */}
    {rutasDeTablero('financiero/funcionario', ['dashboard', 'registrar', 'consultar', 'pendientes'], FuncionarioDashboard)}

    {/* Rutas de Proveedor */}
    {rutasDeTablero('financiero/proveedor', ['dashboard', 'enviar', 'mis-facturas'], ProveedorDashboard)}
    <Route path="financiero/proveedor/:id" element={
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ProveedorFacturaDetalle />
        </Suspense>
      </ProtectedRoute>
    } />

    {/* Rutas de Contabilidad */}
    {rutasDeTablero('financiero/contabilidad', ['dashboard', 'pendientes', 'radicar', 'causar', 'centro-contable'], ContabilidadDashboard)}

    {/* Rutas de Tesoreria */}
    {rutasDeTablero('financiero/tesoreria', ['dashboard', 'pendientes', 'alistar', 'enviar', 'registrar-pago', 'comprobante'], TesoreriaDashboard)}

    {/* Rutas de Auditoria */}
    {rutasDeTablero('financiero/auditoria', ['dashboard', 'pendientes', 'control'], AuditoriaDashboard)}

    {/* Rutas de Direccion Financiera */}
    {rutasDeTableroRestringido('financiero/direccion-financiera', ['dashboard', 'pendientes', 'revisar', 'enviar', 'confirmar'], DireccionFinancieraDashboard, canAccessDireccionFinanciera, homeRoute)}

    {/* Rutas de Rectoria */}
    {rutasDeTableroRestringido('financiero/rectoria', ['dashboard', 'pendientes', 'autorizar'], RectoriaDashboard, canAccessRectoria, homeRoute)}

    {/* Rutas de Admin Financiero */}
    {rutasDeTableroRestringido('financiero/admin-financiero', ['dashboard', 'usuarios', 'proveedores', 'sla', 'reportes', 'configuracion'], AdminFinancieroDashboard, canAccessAdminFinanciero, homeRoute)}
  </>
);
