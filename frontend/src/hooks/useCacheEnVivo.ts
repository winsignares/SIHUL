import { useEffect } from 'react';
import { suscribirEventos } from '../core/eventosTiempoReal';
import { clearSessionCache } from '../core/sessionCache';

/**
 * Mantiene abierta la conexión de eventos mientras haya sesión y vacía la caché local cuando algo cambia
 * (o puede haber cambiado), para que una pantalla que se abra después pida datos frescos y no los de hace unos minutos.
 * Las pantallas abiertas se actualizan solas con `useActualizacionEnVivo`.
 */
export function useCacheEnVivo(activo = true): void {
  useEffect(() => {
    if (!activo) return undefined;
    // Las notificaciones no son datos que se guarden en la caché local: no la vacían.
    return suscribirEventos(['*'], (evento) => {
      if (evento?.recurso !== 'notificaciones') clearSessionCache();
    });
  }, [activo]);
}
