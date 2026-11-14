import type { Proveedor } from '../../models/core.models';

export type ProveedorUI = Proveedor;

export type ProveedorFormState = {
  usuario?: number | null;
  nombreUsuario: string;
  correoUsuario: string;
  nuevaContrasena: string;
  nit: string;
  razon_social: string;
  nombre_comercial: string;
  tipo_proveedor: Proveedor['tipo_proveedor'];
  tipo_persona: NonNullable<Proveedor['tipo_persona']>;
  direccion: string;
  pais_id: string;
  departamento_geo_id: string;
  ciudad_id: string;
  telefono: string;
  email: string;
  contacto_principal: string;
  telefono_contacto: string;
  banco_id: string;
  tipo_cuenta_id: string;
  numero_cuenta: string;
  regimen_tributario: string;
  observaciones: string;
  estado: Proveedor['estado'];
};

export const TIPO_PROVEEDOR_OPTIONS: Proveedor['tipo_proveedor'][] = ['Bienes', 'Servicios'];
export const TIPO_PERSONA_OPTIONS: NonNullable<Proveedor['tipo_persona']>[] = ['Jurídica', 'Natural'];
export const REGIMEN_OPTIONS = [
  'Responsable IVA',
  'No Responsable IVA',
  'Régimen Simple de Tributación',
  'Régimen Tributario Especial',
] as const;
export const ESTADO_OPTIONS: Proveedor['estado'][] = ['Activo', 'Inactivo', 'Bloqueado', 'Verificación'];

export const emptyForm: ProveedorFormState = {
  usuario: null,
  nombreUsuario: '',
  correoUsuario: '',
  nuevaContrasena: '',
  nit: '',
  razon_social: '',
  nombre_comercial: '',
  tipo_proveedor: 'Servicios',
  tipo_persona: 'Jurídica',
  direccion: '',
  pais_id: '',
  departamento_geo_id: '',
  ciudad_id: '',
  telefono: '',
  email: '',
  contacto_principal: '',
  telefono_contacto: '',
  banco_id: '',
  tipo_cuenta_id: '',
  numero_cuenta: '',
  regimen_tributario: '',
  observaciones: '',
  estado: 'Activo',
};

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const normalizeText = (value?: string) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const toArray = <T,>(value: T[] | { results?: T[] } | unknown): T[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray((value as { results?: T[] }).results)) {
    return (value as { results: T[] }).results;
  }
  return [];
};
