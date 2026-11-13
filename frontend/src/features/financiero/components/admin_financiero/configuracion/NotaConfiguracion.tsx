import { Sparkles } from 'lucide-react';

/** Nota informativa de la configuración. */
export function NotaConfiguracion() {
  return (
    <div className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-amber-50 px-4 py-3 text-xs text-slate-700 flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-rose-700" />
      Recomendación: guarda por lotes pequeños para auditar mejor el impacto de cada cambio.
    </div>
  );
}
