import { Button } from '../../../../../components/ui/button';
import { Save, Gauge } from 'lucide-react';
import type { useConfiguracionFinanciera } from '../../../hooks/admin_financiero/useConfiguracionFinanciera';

type Gestion = ReturnType<typeof useConfiguracionFinanciera>;

/** Barra fija para guardar los cambios. */
export function BarraGuardarConfiguracion({ loading, saving, totalCambiosPendientes, guardarTodo }: Pick<Gestion, 'loading' | 'saving' | 'totalCambiosPendientes' | 'guardarTodo'>) {
  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-[460px] z-30">
      <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur shadow-2xl p-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Estado de edición</p>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {totalCambiosPendientes > 0 ? `${totalCambiosPendientes} cambios listos para guardar` : 'No hay cambios pendientes'}
          </p>
        </div>
        <Button onClick={guardarTodo} disabled={saving || loading} className="bg-rose-700 hover:bg-rose-800 text-white whitespace-nowrap">
          {saving ? <Gauge className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  );
}
