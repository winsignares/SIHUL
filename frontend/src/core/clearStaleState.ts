// Claves que es seguro conservar al hacer una limpieza profunda: son solo
// preferencias de presentación, nunca causan el tipo de error que esta
// limpieza busca resolver (sesión corrupta, cache de datos desincronizado).
const KEYS_TO_PRESERVE = new Set(['theme']);
const AUTH_KEYS = [
  'auth_token',
  'auth_user',
  'auth_role',
  'auth_components',
  'auth_faculties',
  'auth_areas',
  'auth_sede',
  'auth_signature',
  'auth_is_public',
];

export function clearAuthClientState(): void {
  try {
    AUTH_KEYS.forEach((key) => localStorage.removeItem(key));

    const keysToRemove = Object.keys(localStorage).filter(
      (key) => key.startsWith('cache_') || key.startsWith('sihul_cache_')
    );
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('No se pudo limpiar el estado de autenticación local:', error);
  }
}

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
