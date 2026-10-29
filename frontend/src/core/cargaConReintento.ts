import { lazy, type ComponentType } from 'react';

// Fallos al bajar un pedazo de la aplicación: se corta la conexión, o el sitio se actualizó y el archivo
// con el nombre anterior ya no existe.
const ERROR_DE_CARGA = /dynamically imported module|importing a module script failed|loading chunk|loading css chunk|failed to fetch|networkerror|load failed/i;

const ESPERAS_MS = [600, 1800, 4000];
const RECARGA_CLAVE = 'sihul_recarga_por_carga';
const RECARGA_MIN_INTERVALO_MS = 30_000;

export function esErrorDeCarga(error: unknown): boolean {
  const mensaje = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '');
  return ERROR_DE_CARGA.test(mensaje);
}

const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Con el navegador sin red no tiene sentido reintentar: se espera a que vuelva (con un tope)
function esperarConexion(topeMs: number): Promise<void> {
  if (typeof navigator === 'undefined' || navigator.onLine) return Promise.resolve();
  return new Promise((resolve) => {
    const listo = () => {
      window.removeEventListener('online', listo);
      resolve();
    };
    window.addEventListener('online', listo);
    setTimeout(listo, topeMs);
  });
}

/** Recarga la página una sola vez cada 30 s (evita un ciclo si el problema no es pasajero). */
export function recargarPorFalloDeCarga(): boolean {
  try {
    const ultima = Number(sessionStorage.getItem(RECARGA_CLAVE) || 0);
    if (Date.now() - ultima < RECARGA_MIN_INTERVALO_MS) return false;
    sessionStorage.setItem(RECARGA_CLAVE, String(Date.now()));
  } catch {
    // sin sessionStorage no se puede llevar la cuenta: mejor no recargar
    return false;
  }
  window.location.reload();
  return true;
}

/** Carga una pantalla reintentando si falla la descarga; si sigue fallando, recarga la página una vez. */
export async function importarConReintento<T>(cargar: () => Promise<T>): Promise<T> {
  let ultimoError: unknown;
  for (let intento = 0; intento <= ESPERAS_MS.length; intento += 1) {
    try {
      return await cargar();
    } catch (error) {
      ultimoError = error;
      if (!esErrorDeCarga(error) || intento === ESPERAS_MS.length) break;
      await esperarConexion(15_000);
      await esperar(ESPERAS_MS[intento]);
    }
  }
  if (esErrorDeCarga(ultimoError) && recargarPorFalloDeCarga()) {
    // la página se está recargando: no mostrar el error mientras tanto
    return new Promise<T>(() => undefined);
  }
  throw ultimoError;
}

/** `React.lazy` que reintenta la descarga de la pantalla en vez de quedar en error para siempre. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyConReintento<T extends ComponentType<any>>(cargar: () => Promise<{ default: T }>) {
  return lazy(() => importarConReintento(cargar));
}
