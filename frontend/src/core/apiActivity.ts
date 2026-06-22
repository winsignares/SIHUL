export interface ApiActivitySnapshot {
  pendingRequests: number;
  error: string | null;
  backendUnreachable: boolean;
  backendRecovering: boolean;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let snapshot: ApiActivitySnapshot = {
  pendingRequests: 0,
  error: null,
  backendUnreachable: false,
  backendRecovering: false,
};

// Nº de fallos de red consecutivos antes de considerar el backend caído.
// Evita falsos positivos por una sola petición fallida puntual.
const CONSECUTIVE_FAILURES_THRESHOLD = 2;
let consecutiveNetworkFailures = 0;

function emit(next: ApiActivitySnapshot): void {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function subscribeApiActivity(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getApiActivitySnapshot(): ApiActivitySnapshot {
  return snapshot;
}

export function beginApiRequest(): () => void {
  emit({
    ...snapshot,
    pendingRequests: snapshot.pendingRequests + 1,
    error: snapshot.pendingRequests === 0 ? null : snapshot.error,
  });

  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    emit({
      ...snapshot,
      pendingRequests: Math.max(0, snapshot.pendingRequests - 1),
    });
  };
}

/**
 * Un TypeError lanzado por `fetch` (sin response) indica que la petición nunca
 * llegó al servidor: backend caído, sin red, CORS bloqueado, DNS, etc.
 * Cualquier otro error (4xx/5xx ya manejados por errorHandler) no cuenta aquí.
 */
function isNetworkUnreachableError(error: unknown): boolean {
  return error instanceof TypeError;
}

export function reportApiError(error: unknown, fallback = 'No se pudo completar la solicitud.'): void {
  const message =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : fallback;

  if (isNetworkUnreachableError(error)) {
    consecutiveNetworkFailures += 1;
  } else {
    consecutiveNetworkFailures = 0;
  }

  emit({
    ...snapshot,
    error: message,
    backendUnreachable: consecutiveNetworkFailures >= CONSECUTIVE_FAILURES_THRESHOLD,
  });
}

const RELOAD_AFTER_RECOVERY_MS = 1500;

/**
 * Llamar cuando se confirma que el backend respondió correctamente
 * (ver backendHealth.ts). Si la app venía de una caída confirmada, en lugar
 * de simplemente ocultar el aviso se entra en estado "recovering" y se
 * recarga la página: así cualquier pantalla que quedó con un error viejo
 * (listas, formularios, etc. que no se re-consultan solas) vuelve a pedir
 * sus datos desde cero, en vez de quedar mostrando un error obsoleto.
 */
export function reportBackendReachable(): void {
  consecutiveNetworkFailures = 0;

  if (!snapshot.backendUnreachable) return;

  emit({
    ...snapshot,
    backendUnreachable: false,
    backendRecovering: true,
  });

  window.setTimeout(() => {
    window.location.reload();
  }, RELOAD_AFTER_RECOVERY_MS);
}

export function clearApiError(): void {
  if (!snapshot.error) return;
  emit({
    ...snapshot,
    error: null,
  });
}

export async function trackedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const endRequest = beginApiRequest();
  try {
    const token = localStorage.getItem('auth_token');
    const headers = new Headers(init?.headers);

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(input, {
      ...init,
      credentials: init?.credentials ?? 'include',
      headers,
    });
    reportBackendReachable();
    return response;
  } catch (error) {
    reportApiError(error);
    throw error;
  } finally {
    endRequest();
  }
}
