export type RawRole = string;

// Canonical roles used in the app
export type CanonicalRole =
  | 'admin'
  | 'supervisor_general'
  | 'docente'
  | 'estudiante'
  | 'autorizado'
  | 'consultor';

const KNOWN_ROLES: CanonicalRole[] = [
  'admin',
  'supervisor_general',
  'docente',
  'estudiante',
  'autorizado',
  'consultor'
];

/**
 * Normalize a role string coming from any source into the canonical role format
 * used across the app (lowercase with underscores). Returns undefined when
 * role is not recognized.
 */
export function normalizeRole(role?: RawRole): CanonicalRole | undefined {
  if (!role) return undefined;

  // If already canonical, return it
  const asString = String(role);
  if (KNOWN_ROLES.includes(asString as CanonicalRole)) return asString as CanonicalRole;

  // Convert camelCase or PascalCase to underscore form: e.g. consultorDocente -> consultor_docente
  const underscored = asString
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // insert underscore before capitals
    .replace(/[-\s]+/g, '_') // replace spaces/dashes with underscore
    .toLowerCase();

  // Some sources may already be lowercased but missing underscore: try to map common patterns
  const legacyMap: Record<string, CanonicalRole> = {
    consultordocente: 'docente',
    consultorestudiante: 'estudiante',
    supervisorgeneral: 'supervisor_general'
  };

  if (KNOWN_ROLES.includes(underscored as CanonicalRole)) return underscored as CanonicalRole;
  if (legacyMap[underscored]) return legacyMap[underscored];

  return undefined;
}

export default normalizeRole;
