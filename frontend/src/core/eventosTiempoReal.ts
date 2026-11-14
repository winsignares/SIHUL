import { resolveApiBaseUrl } from './backendUrl.ts';

/**
 * Cliente de eventos en tiempo real (SSE).
 *
 * El backend avisa que algo cambió (`{recurso, accion, id}`); no envía los datos. Quien escucha vuelve a pedirlos por
 * la API normal, con sus permisos. Hay una sola conexión para toda la aplicación, abierta mientras exista algún oyente.
 */

export interface EventoTiempoReal {
  recurso: string;
  accion: 'creado' | 'actualizado' | 'eliminado';
  id: number;
}

/** `null` significa «puede que te hayas perdido eventos»: se llama al reconectar y al volver a ver la pestaña. */
export type OyenteEventos = (evento: EventoTiempoReal | null) => void;

interface Suscripcion {
  recursos: ReadonlySet<string>;
  oyente: OyenteEventos;
}

const URL_EVENTOS = `${resolveApiBaseUrl(import.meta.env.VITE_API_URL)}/eventos/`;
const ESPERA_MINIMA_MS = 5_000;
const ESPERA_MAXIMA_MS = 300_000;

const suscripciones = new Set<Suscripcion>();
let fuente: EventSource | null = null;
let temporizador: ReturnType<typeof setTimeout> | null = null;
let espera = ESPERA_MINIMA_MS;
let huboError = false;

function avisarATodos(evento: EventoTiempoReal | null): void {
  suscripciones.forEach((s) => {
    if (evento === null || s.recursos.has('*') || s.recursos.has(evento.recurso)) {
      try {
        s.oyente(evento);
      } catch (error) {
        console.error('Error en un oyente de eventos en tiempo real', error);
      }
    }
  });
}

function esEvento(valor: unknown): valor is EventoTiempoReal {
  if (typeof valor !== 'object' || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return typeof v.recurso === 'string' && typeof v.accion === 'string' && typeof v.id === 'number';
}

function cerrar(): void {
  if (temporizador) {
    clearTimeout(temporizador);
    temporizador = null;
  }
  if (fuente) {
    fuente.close();
    fuente = null;
  }
}

function programarReintento(): void {
  if (temporizador || suscripciones.size === 0) return;
  temporizador = setTimeout(() => {
    temporizador = null;
    abrir();
  }, espera);
  espera = Math.min(espera * 2, ESPERA_MAXIMA_MS);
}

function abrir(): void {
  if (fuente || suscripciones.size === 0 || typeof EventSource === 'undefined') return;
  const nueva = new EventSource(URL_EVENTOS, { withCredentials: true });
  fuente = nueva;

  nueva.onopen = () => {
    espera = ESPERA_MINIMA_MS;
    if (huboError) {
      huboError = false;
      avisarATodos(null); // lo ocurrido mientras no había conexión
    }
  };

  nueva.onmessage = (mensaje: MessageEvent<string>) => {
    try {
      const dato: unknown = JSON.parse(mensaje.data);
      if (esEvento(dato)) avisarATodos(dato);
    } catch {
      // mensaje mal formado: se ignora
    }
  };

  nueva.onerror = () => {
    huboError = true;
    // Si el navegador desistió (sin sesión o servicio no disponible), se reintenta con espera creciente.
    if (nueva.readyState === EventSource.CLOSED) {
      fuente = null;
      programarReintento();
    }
  };
}

/** Escucha los cambios de los recursos indicados. Devuelve la función que cancela la escucha. */
export function suscribirEventos(recursos: readonly string[], oyente: OyenteEventos): () => void {
  const suscripcion: Suscripcion = { recursos: new Set(recursos), oyente };
  suscripciones.add(suscripcion);
  abrir();
  return () => {
    suscripciones.delete(suscripcion);
    if (suscripciones.size === 0) cerrar();
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') avisarATodos(null);
  });
}
