export const DEFAULT_PLACEHOLDER = 'Sin Asignar';

export function displayText(value: unknown, placeholder: string = DEFAULT_PLACEHOLDER): string {
  if (value === null || value === undefined) return placeholder;
  if (typeof value === 'string' && value.trim().length === 0) return placeholder;
  return String(value);
}

export function displayRadicado(value: unknown): string {
  return displayText(value, 'Sin Asignar');
}

export function displayDate(value: unknown): string {
  return displayText(value, 'Sin fecha registrada');
}
