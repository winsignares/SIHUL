import { Bot } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Devuelve el icono si es un componente válido; si no, el icono de bot. */
export const getSafeIcon = (icon: unknown): LucideIcon => {
  return typeof icon === 'function' ? (icon as LucideIcon) : Bot;
};
