// Avisa al servidor cuando una pantalla se rompe, para que quede en su log qué fue (el error solo lo ve quien tiene la
// pantalla delante). Nunca debe causar otro error: cualquier fallo al avisar se ignora.
const URL_REPORTE = '/api/auth/error-cliente/';

export function reportarErrorDeCliente(origen: string, error: unknown, detalle?: string): void {
  try {
    const mensaje = error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? '');
    const pila = [error instanceof Error ? error.stack : '', detalle].filter(Boolean).join(' | ');
    void fetch(URL_REPORTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify({
        origen,
        mensaje,
        pila,
        ruta: window.location.pathname,
        navegador: navigator.userAgent,
      }),
    }).catch(() => undefined);
  } catch {
    // sin red o sin fetch: no hay nada más que hacer
  }
}
