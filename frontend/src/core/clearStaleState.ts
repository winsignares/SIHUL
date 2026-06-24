// Claves que es seguro conservar al hacer una limpieza profunda: son solo
// preferencias de presentación, nunca causan el tipo de error que esta
// limpieza busca resolver (sesión corrupta, cache de datos desincronizado).
const KEYS_TO_PRESERVE = new Set(['theme']);

/**
 * Borra todo el estado local persistido (localStorage) salvo las
 * preferencias inocuas, para resolver bugs causados por cookies/cache viejos
 * de un navegador (token corrupto, cache de queries desincronizado, etc.).
 */
export function clearStaleClientState(): void {
  try {
    const keysToRemove = Object.keys(localStorage).filter((key) => !KEYS_TO_PRESERVE.has(key));
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('No se pudo limpiar localStorage:', error);
  }

  try {
    sessionStorage.clear();
  } catch (error) {
    console.warn('No se pudo limpiar sessionStorage:', error);
  }
}
