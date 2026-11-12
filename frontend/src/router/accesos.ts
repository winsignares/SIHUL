import { getRouteForComponent } from '../config/componentRoutes';
import { normalizeFinancialRole, normalizeFinancialText, resolveCanonicalFinancialRole } from '../context/financialRoleUtils';
import { isSpaceSupervisorRole } from '../context/spaceSupervisorRole';
import type { AuthState } from '../models/auth/auth.model';

export interface AccesosDelRol {
  canAccessAdminFinanciero: boolean;
  canAccessRectoria: boolean;
  canAccessDireccionFinanciera: boolean;
  homeRoute: string;
}

interface EntradaAccesos {
  components: AuthState['components'];
  effectiveRole: AuthState['role'];
  userName: string;
}

/** A qué módulos financieros entra el usuario y cuál es su pantalla de inicio, según su rol y sus componentes. */
export function calcularAccesos({ components, effectiveRole, userName }: EntradaAccesos): AccesosDelRol {
  const canonicalFinancialRole = resolveCanonicalFinancialRole({
    roleName: effectiveRole?.nombre,
    userName,
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

    if (isSpaceSupervisorRole(effectiveRole)) {
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

  return { canAccessAdminFinanciero, canAccessRectoria, canAccessDireccionFinanciera, homeRoute };
}
