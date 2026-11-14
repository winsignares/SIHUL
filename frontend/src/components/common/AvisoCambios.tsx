import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import type { ActualizacionProtegida } from '../../hooks/useActualizacionProtegida';

/** Aviso de que otra persona cambió los datos mientras se edita; no recarga hasta que se pida. */
export function AvisoCambios({ hayCambios, aplicar, descartar }: ActualizacionProtegida) {
  if (!hayCambios) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <span>Otra persona cambió estos datos. Termina lo que estás editando o actualiza para verlos.</span>
      <span className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={aplicar}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Actualizar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={descartar}>
          Ahora no
        </Button>
      </span>
    </div>
  );
}
