import { Card, CardContent } from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Calendar, Filter, Search, X } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { FILTROS_INICIALES, ORDER_OPTIONS } from '../../hooks/auditoria/controlPrevioUtils';
import type { useControlPrevio } from '../../hooks/auditoria/useControlPrevio';

type Gestion = ReturnType<typeof useControlPrevio>;

/** Filtros y orden de las facturas por auditar. */
export function FiltrosControlPrevio({ filtros, setFiltros }: Pick<Gestion, 'filtros' | 'setFiltros'>) {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="pt-6">
        <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-xl border-2 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Filtros de Busqueda</h3>
                <p className="text-xs text-slate-500">
                  {[filtros.numeroFactura, filtros.numeroRadicado, filtros.numeroProcesoPago, filtros.fechaInicio, filtros.fechaFin].filter(Boolean).length > 0
                    ? `${[filtros.numeroFactura, filtros.numeroRadicado, filtros.numeroProcesoPago, filtros.fechaInicio, filtros.fechaFin].filter(Boolean).length} filtro(s) activo(s)`
                    : 'Sin filtros aplicados'}
                </p>
              </div>
            </div>
            {[filtros.numeroFactura, filtros.numeroRadicado, filtros.numeroProcesoPago, filtros.fechaInicio, filtros.fechaFin].some(Boolean) && (
              <button type="button" onClick={() => setFiltros(FILTROS_INICIALES)}
                className="inline-flex items-center gap-2 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
                <X className="w-4 h-4" />Limpiar
              </button>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="space-y-2 min-w-0 flex-1 basis-40">
              <Label htmlFor="cp-factura" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                <Search className="w-3 h-3 text-red-600" />N° Factura
              </Label>
              <div className="relative">
                <Input id="cp-factura" placeholder="FAC-2026-001" value={filtros.numeroFactura}
                  onChange={(e) => setFiltros((p) => ({ ...p, numeroFactura: e.target.value }))}
                  className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
                {filtros.numeroFactura && <button onClick={() => setFiltros((p) => ({ ...p, numeroFactura: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
              </div>
            </div>
            <div className="space-y-2 min-w-0 flex-1 basis-40">
              <Label htmlFor="cp-radicado" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                <Search className="w-3 h-3 text-red-600" />N° Radicado
              </Label>
              <div className="relative">
                <Input id="cp-radicado" placeholder="RAD-2026-001" value={filtros.numeroRadicado}
                  onChange={(e) => setFiltros((p) => ({ ...p, numeroRadicado: e.target.value }))}
                  className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
                {filtros.numeroRadicado && <button onClick={() => setFiltros((p) => ({ ...p, numeroRadicado: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
              </div>
            </div>
            <div className="space-y-2 min-w-0 flex-1 basis-40">
              <Label htmlFor="cp-proceso" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                <Search className="w-3 h-3 text-red-600" />N° Proceso Pago
              </Label>
              <div className="relative">
                <Input id="cp-proceso" placeholder="PP-2026-001" value={filtros.numeroProcesoPago}
                  onChange={(e) => setFiltros((p) => ({ ...p, numeroProcesoPago: e.target.value }))}
                  className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
                {filtros.numeroProcesoPago && <button onClick={() => setFiltros((p) => ({ ...p, numeroProcesoPago: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
              </div>
            </div>
            <div className="space-y-2 min-w-0 flex-1 basis-36">
              <Label htmlFor="cp-desde" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600" />Desde
              </Label>
              <Input id="cp-desde" type="date" value={filtros.fechaInicio}
                onChange={(e) => setFiltros((p) => ({ ...p, fechaInicio: e.target.value }))}
                className="border-slate-300 focus:border-blue-600 focus:ring-blue-600" />
            </div>
            <div className="space-y-2 min-w-0 flex-1 basis-36">
              <Label htmlFor="cp-hasta" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600" />Hasta
              </Label>
              <Input id="cp-hasta" type="date" value={filtros.fechaFin}
                onChange={(e) => setFiltros((p) => ({ ...p, fechaFin: e.target.value }))}
                className="border-slate-300 focus:border-blue-600 focus:ring-blue-600" />
            </div>
            <div className="space-y-2 min-w-0 flex-1 basis-36">
              <Label htmlFor="cp-orden" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                <Search className="w-3 h-3 text-red-600" />Ordenar lista
              </Label>
              <select id="cp-orden" value={filtros.orden}
                onChange={(e) => setFiltros((p) => ({ ...p, orden: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-slate-700 text-sm focus:border-red-600 focus:outline-none">
                {ORDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
