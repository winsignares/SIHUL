import { useEffect, useRef } from 'react';
import { suscribirEventos } from '../core/eventosTiempoReal';

const ESPERA_AGRUPAR_MS = 400;

/**
 * Llama a `recargar` cuando cambia alguno de los `recursos` (por ejemplo `['sedes']`) o cuando puede haberse perdido
 * un cambio (al reconectar o al volver a ver la pestaña). Varios eventos seguidos se agrupan en una sola recarga.
 * Con `activo` en falso no abre la conexión (por ejemplo, sin sesión).
 */
export function useActualizacionEnVivo(recursos: readonly string[], recargar: () => void, activo = true): void {
  const recargarRef = useRef(recargar);
  recargarRef.current = recargar;
  const clave = recursos.join('|');

  useEffect(() => {
    if (!activo) return undefined;
    let temporizador: ReturnType<typeof setTimeout> | null = null;
    const cancelar = suscribirEventos(clave.split('|'), () => {
      if (temporizador) clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        temporizador = null;
        recargarRef.current();
      }, ESPERA_AGRUPAR_MS);
    });
    return () => {
      if (temporizador) clearTimeout(temporizador);
      cancelar();
    };
  }, [clave, activo]);
}
