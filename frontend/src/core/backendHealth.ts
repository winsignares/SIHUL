import { resolveApiBaseUrl } from './backendUrl';
import { reportBackendReachable, getApiActivitySnapshot } from './apiActivity';

const apiUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL);
const PING_INTERVAL_MS = 5000;
const PING_TIMEOUT_MS = 10000;

let pingTimerId: ReturnType<typeof setTimeout> | null = null;
let started = false;

async function ping(): Promise<void> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

  try {
    // Cualquier respuesta HTTP (incluso 401/403/404) confirma que el backend está vivo.
    await fetch(`${apiUrl}/`, { method: 'HEAD', signal: controller.signal, credentials: 'include' });
    reportBackendReachable();
  } catch {
    // Backend sigue inalcanzable; no hacemos nada, el siguiente ping lo reintentará.
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function scheduleNextPing(): void {
  pingTimerId = window.setTimeout(async () => {
    if (getApiActivitySnapshot().backendUnreachable) {
      await ping();
    }
    scheduleNextPing();
  }, PING_INTERVAL_MS);
}

/**
 * Arranca el polling de salud del backend. Es deliberadamente perezoso: solo
 * hace ping de verdad mientras `backendUnreachable` esté activo, así que en
 * el caso normal (backend arriba) no añade tráfico de red.
 */
export function startBackendHealthWatcher(): () => void {
  if (started) {
    return () => undefined;
  }
  started = true;

  scheduleNextPing();

  return () => {
    if (pingTimerId) {
      window.clearTimeout(pingTimerId);
      pingTimerId = null;
    }
    started = false;
  };
}
