import { clearSessionCache } from '../../core/sessionCache';

export const PRESTAMOS_CHANGED_EVENT = 'sihul:prestamos-changed';
export const PRESTAMOS_CHANGED_STORAGE_KEY = 'sihul_prestamos_changed_at';

export function notifyPrestamosChanged(): void {
  clearSessionCache('prestamos-espacios-admin');
  window.dispatchEvent(new CustomEvent(PRESTAMOS_CHANGED_EVENT));

  try {
    localStorage.setItem(PRESTAMOS_CHANGED_STORAGE_KEY, Date.now().toString());
  } catch {
    // La actualización de la pestaña actual funciona aunque localStorage falle.
  }
}
