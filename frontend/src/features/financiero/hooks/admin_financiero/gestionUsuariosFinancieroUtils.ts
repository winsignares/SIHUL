import type { Usuario } from '../../../users/services/authService';

export type PermisoTipo = 'VER' | 'EDITAR';

export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const FINANCIAL_ROLE_NAMES = new Set([
  'funcionario',
  'contabilidad',
  'tesoreria',
  'auditoria',
  'direccion financiera',
  'rectoria',
  'admin financiero',
]);

export const isProveedorRole = (roleName: string) => normalizeText(roleName) === 'proveedor';

export const isFinancialRole = (roleName: string) => FINANCIAL_ROLE_NAMES.has(normalizeText(roleName));

export const getRolNombre = (usuario: Usuario, rolesById: Record<number, string>) =>
  rolesById[usuario.rol_id || -1] || usuario.rol?.nombre || 'Sin rol';

export const formatSede = (sede: Usuario['sede']) => {
  if (!sede) return 'Sin sede';
  if (typeof sede === 'string') return sede;
  return sede.nombre || 'Sin sede';
};

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const initialNuevoUsuario = {
  nombre: '',
  correo: '',
  contrasena: '',
  rolId: '',
  activo: true,
};

export const initialEditarUsuario = {
  id: null as number | null,
  nombre: '',
  correo: '',
  contrasena: '',
  rolId: '',
  activo: true,
};
