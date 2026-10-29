import { useEffect, useRef } from 'react';
import { iniciarSondeoVisible } from '../core/sondeo';

/** Ejecuta `tarea` cada `intervaloMs` solo con la pestaña visible (ver core/sondeo.ts). */
export function useSondeoVisible(tarea: () => unknown, intervaloMs: number, activo = true): void {
  const tareaRef = useRef(tarea);
  tareaRef.current = tarea;

  useEffect(() => {
    if (!activo) return undefined;
    return iniciarSondeoVisible(() => tareaRef.current(), intervaloMs);
  }, [intervaloMs, activo]);
}
