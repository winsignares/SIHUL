export interface ApiActivitySnapshot {
  pendingRequests: number;
  error: string | null;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let snapshot: ApiActivitySnapshot = {
  pendingRequests: 0,
  error: null,
};

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

export function reportApiError(error: unknown, fallback = 'No se pudo completar la solicitud.'): void {
  const message =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : fallback;

  emit({
    ...snapshot,
    error: message,
  });
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

    return await fetch(input, {
      ...init,
      credentials: init?.credentials ?? 'include',
      headers,
    });
  } catch (error) {
    reportApiError(error);
    throw error;
  } finally {
    endRequest();
  }
}
