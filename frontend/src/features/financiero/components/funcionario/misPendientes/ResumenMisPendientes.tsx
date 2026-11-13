import { AlertCircle, FileText, TrendingUp } from 'lucide-react';
import type { useMisPendientesFuncionario } from '../../../hooks/funcionario/useMisPendientesFuncionario';

type Gestion = ReturnType<typeof useMisPendientesFuncionario>;

/** Totales de las facturas pendientes. */
export function ResumenMisPendientes({ rows, vencidas, proximas }: Pick<Gestion, 'rows' | 'vencidas' | 'proximas'>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600">Por registrar</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{rows.length}</p>
            <p className="text-xs text-slate-500 mt-1">Facturas recibidas pendientes de gestión</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-700 font-semibold">Fuera de SLA</p>
            <p className="text-3xl font-bold text-red-800 mt-1">{vencidas}</p>
            <p className="text-xs text-red-700/80 mt-1">Requieren registro prioritario</p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-700" />
          </div>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-700 font-semibold">Por vencer</p>
            <p className="text-3xl font-bold text-amber-800 mt-1">{proximas}</p>
            <p className="text-xs text-amber-700/80 mt-1">Conviene atenderlas pronto</p>
          </div>
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-amber-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
