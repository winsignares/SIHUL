import { useCallback, useEffect, useRef, useState } from 'react';
import { useActualizacionEnVivo } from './useActualizacionEnVivo';

export interface ActualizacionProtegida {
  /** Hay cambios de otras personas que todavía no se aplicaron porque la persona tiene trabajo sin guardar. */
  hayCambios: boolean;
  /** Aplica los cambios pendientes (vuelve a leer los datos). */
  aplicar: () => void;
  /** Ignora el aviso sin recargar. */
  descartar: () => void;
}

/**
 * Como `useActualizacionEnVivo`, pero para pantallas de edición: si la persona no tiene cambios sin guardar, los datos
 * se vuelven a leer solos; si los tiene, no se toca lo que está escribiendo y se marca `hayCambios` para mostrar un
 * aviso (`AvisoCambios`). Al guardar o descartar su trabajo, los cambios pendientes se aplican solos.
 */
export function useActualizacionProtegida(
  recursos: readonly string[],
  recargar: () => void,
  haySinGuardar: boolean,
  activo = true,
): ActualizacionProtegida {
  const [hayCambios, setHayCambios] = useState(false);
  const recargarRef = useRef(recargar);
  recargarRef.current = recargar;
  const sinGuardarRef = useRef(haySinGuardar);
  sinGuardarRef.current = haySinGuardar;

  useActualizacionEnVivo(recursos, () => {
    if (sinGuardarRef.current) setHayCambios(true);
    else recargarRef.current();
  }, activo);

  // Cuando la persona termina su edición (guarda o cancela), se aplican los cambios que llegaron mientras tanto.
  useEffect(() => {
    if (hayCambios && !haySinGuardar) {
      setHayCambios(false);
      recargarRef.current();
    }
  }, [hayCambios, haySinGuardar]);

  const aplicar = useCallback(() => {
    setHayCambios(false);
    recargarRef.current();
  }, []);
  const descartar = useCallback(() => setHayCambios(false), []);

  return { hayCambios, aplicar, descartar };
}
