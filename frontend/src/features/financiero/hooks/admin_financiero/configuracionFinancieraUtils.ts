import type { ParametroFinanciero } from '../../services';
import { ShieldCheck, Building2, Settings2, MailCheck, Clock3, Layers3 } from 'lucide-react';

export const CATEGORY_META: Record<ParametroFinanciero['categoria'], { titulo: string; descripcion: string; icono: typeof Settings2 }> = {
  general: { titulo: 'General', descripcion: 'Datos maestros e identidad institucional', icono: Building2 },
  autorizacion: { titulo: 'Autorización', descripcion: 'Reglas de umbrales y autorizaciones especiales', icono: ShieldCheck },
  sla: { titulo: 'SLA', descripcion: 'Alertas y políticas de tiempo por etapa', icono: Clock3 },
  email: { titulo: 'Notificaciones', descripcion: 'Canales de alertas y correo operativo', icono: MailCheck },
  sistema: { titulo: 'Sistema', descripcion: 'Comportamiento global y retención documental', icono: Settings2 },
  reportes: { titulo: 'Reportes', descripcion: 'Parámetros de salida analítica y consolidación', icono: Layers3 },
};

export const FRIENDLY_LABELS: Record<string, string> = {
  nombre_institucion: 'Nombre de la institución',
  nit_institucion: 'NIT de la institución',
  areas_solicitantes_excluidas: 'Áreas ocultas en el campo Solicitante',
  monto_autorizacion_especial: 'Monto para activar autorización especial',
  alerta_automatica_activa: 'Alertas automáticas de SLA',
  dias_retencion_documental: 'Días de retención documental',
  dias_retencion_documentos: 'Días de retención de documentos',
  email_notificaciones_financiero: 'Correo de notificaciones financieras',
  email_notificaciones: 'Correo general de notificaciones',
};

export const AREAS_SOLICITANTES_DEFAULT = [
  'Financiero',
  'Contabilidad',
  'Tesorería',
  'Auditoría',
  'Dirección Financiera',
  'Rectoría',
];

export const DUPLICATE_PREFERENCE_GROUPS: Array<{ preferred: string; mirrors: string[] }> = [
  { preferred: 'dias_retencion_documental', mirrors: ['dias_retencion_documentos'] },
  { preferred: 'email_notificaciones_financiero', mirrors: ['email_notificaciones'] },
];

export const getDuplicateGroup = (clave: string) =>
  DUPLICATE_PREFERENCE_GROUPS.find((group) => group.preferred === clave || group.mirrors.includes(clave));

export const getPreferredKey = (clave: string) => getDuplicateGroup(clave)?.preferred ?? clave;

export const shouldHideAsMirror = (clave: string) => {
  const group = getDuplicateGroup(clave);
  return Boolean(group && group.preferred !== clave);
};

export const isFieldBlocked = (clave: string) => clave === 'nombre_institucion' || clave === 'nit_institucion';

export const parseListText = (value: string): string[] =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const getFriendlyLabel = (clave: string) => {
  if (FRIENDLY_LABELS[clave]) return FRIENDLY_LABELS[clave];
  return clave
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const asBoolean = (value: string) => ['true', '1', 'si', 'sí', 'yes', 'on', 'activo'].includes(value.trim().toLowerCase());

export const normalizeNumberString = (value: string) => value.replace(',', '.').trim();

export const toDisplayValue = (param: ParametroFinanciero) => {
  if (param.tipo_dato !== 'json') return param.valor;
  try {
    const parsed = JSON.parse(param.valor);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).join('\n');
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join('\n');
    }
    return String(parsed ?? '');
  } catch {
    return param.valor;
  }
};

export const toApiValue = (param: ParametroFinanciero): string => {
  const currentValue = param.valor ?? '';

  if (param.tipo_dato === 'boolean') {
    return asBoolean(currentValue) ? 'true' : 'false';
  }

  if (param.tipo_dato === 'number') {
    return normalizeNumberString(currentValue);
  }

  if (param.tipo_dato === 'json') {
    const trimmed = currentValue.trim();
    if (!trimmed) return '[]';
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return JSON.stringify(JSON.parse(trimmed));
      } catch {
        return JSON.stringify(
          trimmed
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean),
        );
      }
    }
    return JSON.stringify(
      trimmed
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    );
  }

  return currentValue;
};

export const getValidationError = (param: ParametroFinanciero): string | null => {
  if (param.tipo_dato === 'number') {
    const value = normalizeNumberString(param.valor);
    if (value === '' || Number.isNaN(Number(value))) {
      return `${getFriendlyLabel(param.clave)} debe ser un número válido.`;
    }
  }
  return null;
};
