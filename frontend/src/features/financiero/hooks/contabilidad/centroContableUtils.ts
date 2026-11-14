import type { CentroCosto, CuentaContable } from '../../models/core.models';

export type TabKey = 'cuentas' | 'centros';

export type CuentaContableForm = {
  id?: number;
  codigo: string;
  nombre: string;
  tipo_cuenta: CuentaContable['tipo_cuenta'];
  nivel: number;
  cuenta_padre?: string;
  naturaleza: CuentaContable['naturaleza'];
  acepta_movimiento: boolean;
  requiere_tercero: boolean;
  requiere_centro_costo: boolean;
  descripcion?: string;
  estado: CuentaContable['estado'];
};

export type CentroCostoForm = {
  id?: number;
  codigo: string;
  nombre: string;
  tipo: CentroCosto['tipo'];
  departamento_id?: number | null;
  presupuesto_asignado?: number | string;
  estado: CentroCosto['estado'];
};

export const CUENTA_TIPOS: CuentaContable['tipo_cuenta'][] = ['Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Gasto', 'Costo'];
export const CUENTA_NATURALEZAS: CuentaContable['naturaleza'][] = ['Débito', 'Crédito'];
export const CUENTA_ESTADOS: CuentaContable['estado'][] = ['Activo', 'Inactivo'];
export const CENTRO_TIPOS: CentroCosto['tipo'][] = ['Administrativo', 'Académico', 'Operativo', 'Investigación', 'Extensión'];
export const CENTRO_ESTADOS: CentroCosto['estado'][] = ['Activo', 'Inactivo'];
export const NIVELES = [1, 2, 3, 4] as const;
export const NIVEL_LABEL: Record<number, string> = {
  1: 'Clase',
  2: 'Grupo',
  3: 'Cuenta',
  4: 'Subcuenta',
};

export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(numeric);
};

export const initialCuentaForm: CuentaContableForm = {
  codigo: '',
  nombre: '',
  tipo_cuenta: 'Activo',
  nivel: 1,
  cuenta_padre: '',
  naturaleza: 'Débito',
  acepta_movimiento: true,
  requiere_tercero: true,
  requiere_centro_costo: true,
  descripcion: '',
  estado: 'Activo',
};

export const initialCentroForm: CentroCostoForm = {
  codigo: '',
  nombre: '',
  tipo: 'Administrativo',
  departamento_id: null,
  presupuesto_asignado: '',
  estado: 'Activo',
};

export const resolveList = <T,>(
  response:
    | { results?: T[]; data?: T[] | { results?: T[]; items?: T[]; data?: T[]; centros?: T[]; cuentas?: T[] }; items?: T[]; centros?: T[]; cuentas?: T[] }
    | T[]
): T[] => {
  if (Array.isArray(response)) return response;
  const nested = response.data && !Array.isArray(response.data) ? response.data : undefined;
  return (
    response.results ||
    (Array.isArray(response.data) ? response.data : undefined) ||
    response.items ||
    response.centros ||
    response.cuentas ||
    nested?.results ||
    nested?.items ||
    nested?.data ||
    nested?.centros ||
    nested?.cuentas ||
    []
  );
};
