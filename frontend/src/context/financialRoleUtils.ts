export interface AuthComponentRef {
  nombre: string;
}

export type CanonicalFinancialRole =
  | 'funcionario'
  | 'contabilidad'
  | 'tesoreria'
  | 'auditoria'
  | 'direccion_financiera'
  | 'rectoria'
  | 'admin_financiero'
  | 'proveedor';

export function normalizeFinancialText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeFinancialRole(roleName?: string): CanonicalFinancialRole | undefined {
  if (!roleName) {
    return undefined;
  }

  const normalized = normalizeFinancialText(roleName);

  if (normalized.includes('admin financiero') || normalized.includes('administrador financiero')) {
    return 'admin_financiero';
  }

  if (normalized.includes('rectoria') || normalized.includes('rector')) {
    return 'rectoria';
  }

  if (normalized.includes('direccion financiera') || normalized.includes('sindicatura')) {
    return 'direccion_financiera';
  }

  if (normalized.includes('tesoreria')) {
    return 'tesoreria';
  }

  if (normalized.includes('auditoria') || normalized.includes('auditor')) {
    return 'auditoria';
  }

  if (normalized.includes('contabilidad')) {
    return 'contabilidad';
  }

  if (normalized.includes('funcionario')) {
    return 'funcionario';
  }

  if (normalized.includes('proveedor')) {
    return 'proveedor';
  }

  return undefined;
}

const COMPONENT_TERMS_BY_ROLE: Record<CanonicalFinancialRole, string[]> = {
  admin_financiero: [
    'dashboard admin financiero',
    'admin financiero',
    'gestion usuarios financiero',
    'gestion de usuarios financiero',
    'gestion proveedores',
    'parametrizacion sla',
    'reportes consolidados',
    'configuracion sistema financiero'
  ],
  rectoria: [
    'dashboard rectoria',
    'mis pendientes rectoria',
    'autorizar pago',
    'autorizar pagos',
    'aprobacion rectoria'
  ],
  direccion_financiera: [
    'dashboard direccion financiera',
    'mis pendientes direccion financiera',
    'revisar pagos direccion financiera',
    'confirmacion pagos direccion financiera',
    'control de pago bancario direccion financiera',
    'enviar a rectoria',
    'enviar rectoria',
    'sindicatura'
  ],
  tesoreria: [
    'dashboard tesoreria',
    'mis pendientes tesoreria',
    'alistar pagos',
    'registrar pago aplicado',
    'generar comprobante egreso',
    'comprobante egreso'
  ],
  auditoria: [
    'dashboard auditoria',
    'mis pendientes auditoria',
    'control previo'
  ],
  contabilidad: [
    'dashboard contabilidad',
    'mis pendientes contabilidad',
    'radicar facturas',
    'causar facturas'
  ],
  funcionario: [
    'dashboard financiero',
    'mis pendientes',
    'registrar factura',
    'consultar facturas',
    'gestion de facturas'
  ],
  proveedor: [
    'dashboard proveedor',
    'mis facturas proveedor',
    'enviar factura proveedor',
    'consultar estado facturas'
  ]
};

const FINANCIAL_ROLE_PRIORITY: CanonicalFinancialRole[] = [
  'admin_financiero',
  'rectoria',
  'direccion_financiera',
  'tesoreria',
  'auditoria',
  'contabilidad',
  'proveedor',
  'funcionario'
];

export function detectFinancialRoleByComponents(components: AuthComponentRef[]): CanonicalFinancialRole | undefined {
  for (const role of FINANCIAL_ROLE_PRIORITY) {
    const terms = COMPONENT_TERMS_BY_ROLE[role];
    const matchesRole = components.some(component => {
      const normalizedComponentName = normalizeFinancialText(component.nombre);
      return terms.some(term => normalizedComponentName.includes(term));
    });

    if (matchesRole) {
      return role;
    }
  }

  return undefined;
}

export function resolveCanonicalFinancialRole(params: {
  roleName?: string;
  userName?: string;
  components?: AuthComponentRef[];
}): CanonicalFinancialRole | undefined {
  const byRole = normalizeFinancialRole(params.roleName);
  if (byRole) {
    return byRole;
  }

  const byUserName = normalizeFinancialRole(params.userName);
  if (byUserName) {
    return byUserName;
  }

  const byComponents = detectFinancialRoleByComponents(params.components ?? []);
  if (byComponents) {
    return byComponents;
  }

  return undefined;
}
