import { Card, CardContent } from '../../../../../components/ui/card';
import type { useConfiguracionFinanciera } from '../../../hooks/admin_financiero/useConfiguracionFinanciera';

type Gestion = ReturnType<typeof useConfiguracionFinanciera>;

/** Totales de los parámetros. */
export function ResumenConfiguracion({ saving, editable, grouped, totalCambiosPendientes }: Pick<Gestion, 'saving' | 'editable' | 'grouped' | 'totalCambiosPendientes'>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-0 shadow-md bg-gradient-to-br from-white to-emerald-50">
        <CardContent className="p-4">
          <p className="text-xs text-slate-500">Parámetros editables</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{editable.length}</p>
          <p className="text-xs text-slate-600 mt-1">Configurables por la administración financiera</p>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-md bg-gradient-to-br from-white to-blue-50">
        <CardContent className="p-4">
          <p className="text-xs text-slate-500">Categorías activas</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{Object.keys(grouped).length}</p>
          <p className="text-xs text-slate-600 mt-1">General, SLA, sistema, reportes y más</p>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-md bg-gradient-to-br from-white to-amber-50">
        <CardContent className="p-4">
          <p className="text-xs text-slate-500">Sincronización</p>
          <p className="text-sm font-semibold text-slate-900 mt-2">{saving ? 'Aplicando cambios...' : 'Listo para guardar'}</p>
          <p className="text-xs text-slate-600 mt-1">Los cambios impactan el módulo financiero inmediatamente.</p>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-md bg-gradient-to-br from-white to-rose-50">
        <CardContent className="p-4">
          <p className="text-xs text-slate-500">Pendientes</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalCambiosPendientes}</p>
          <p className="text-xs text-slate-600 mt-1">Parámetros modificados sin persistir</p>
        </CardContent>
      </Card>
    </div>
  );
}
