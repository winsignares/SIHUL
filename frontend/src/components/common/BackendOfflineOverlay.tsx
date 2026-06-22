import { useSyncExternalStore } from 'react';
import { ServerCrash, CheckCircle2 } from 'lucide-react';
import { getApiActivitySnapshot, subscribeApiActivity } from '../../core/apiActivity';

export function BackendOfflineOverlay() {
  const { backendUnreachable, backendRecovering } = useSyncExternalStore(
    subscribeApiActivity,
    getApiActivitySnapshot,
    getApiActivitySnapshot,
  );

  if (!backendUnreachable && !backendRecovering) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-slate-50/95 px-4 backdrop-blur-sm dark:bg-slate-950/95"
    >
      <div className="relative flex h-32 w-32 items-center justify-center">
        {backendRecovering ? (
          <CheckCircle2
            aria-hidden="true"
            className="h-16 w-16 text-emerald-600 dark:text-emerald-400"
          />
        ) : (
          <>
            <span className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900" />
            <span className="absolute inset-0 animate-[spin_2.2s_linear_infinite] rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400" />
            <span className="absolute inset-3 animate-[spin_1.6s_linear_infinite_reverse] rounded-full border-4 border-transparent border-t-blue-400/70 dark:border-t-blue-300/70" />
            <ServerCrash
              aria-hidden="true"
              className="h-12 w-12 animate-pulse text-blue-600 dark:text-blue-400"
            />
          </>
        )}
      </div>

      <div className="text-center">
        {backendRecovering ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Conexión restablecida
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">
              Actualizando la página…
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Esperando conexión con el servidor…
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">
              No se puede contactar al servidor en este momento. Verificando la conexión
              automáticamente, no es necesario recargar la página.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default BackendOfflineOverlay;
