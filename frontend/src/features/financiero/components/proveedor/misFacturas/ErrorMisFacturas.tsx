import { AlertCircle } from 'lucide-react';
import type { useMisFacturas } from '../../../hooks/proveedor/useMisFacturas';

type Gestion = ReturnType<typeof useMisFacturas>;

/** Mensaje de error de la carga. */
export function ErrorMisFacturas({ error }: Pick<Gestion, 'error'>) {
  return (
    <>
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </>
  );
}
