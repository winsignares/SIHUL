import { useEffect, useState, useSyncExternalStore } from 'react';
import { AlertCircle, X } from 'lucide-react';
import {
  clearApiError,
  getApiActivitySnapshot,
  subscribeApiActivity,
} from '../../core/apiActivity';
import { Loading } from './Loading';

const ERROR_VISIBLE_MS = 7000;
const LOADING_DELAY_MS = 180;

export function ApiRequestFeedback() {
  const { pendingRequests, error } = useSyncExternalStore(
    subscribeApiActivity,
    getApiActivitySnapshot,
    getApiActivitySnapshot,
  );
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (pendingRequests === 0) {
      setShowLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => setShowLoading(true), LOADING_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [pendingRequests]);

  useEffect(() => {
    if (!error) return;
    const timeoutId = window.setTimeout(clearApiError, ERROR_VISIBLE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
      {showLoading && (
        <div className="pointer-events-auto rounded-lg border border-slate-200 bg-white/95 px-4 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <Loading compact message="Cargando datos..." />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="pointer-events-auto flex max-w-xl items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 shadow-lg dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="text-sm">{error}</span>
          <button
            type="button"
            onClick={clearApiError}
            className="ml-auto rounded p-0.5 hover:bg-red-100 dark:hover:bg-red-900"
            aria-label="Cerrar mensaje de error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ApiRequestFeedback;
