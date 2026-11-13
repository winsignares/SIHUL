import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Search, X, Filter } from 'lucide-react';
import { FILTROS_INICIALES, ORDER_OPTIONS } from '../../../hooks/tesoreria/alistarPagosUtils';
import type { useAlistarPagos } from '../../../hooks/tesoreria/useAlistarPagos';

type Gestion = ReturnType<typeof useAlistarPagos>;

/** Filtros y orden de las facturas por alistar. */
export function FiltrosAlistarPagos({ filtros, setFiltros }: Pick<Gestion, 'filtros' | 'setFiltros'>) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-slate-800">Filtros de Busqueda</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {[filtros.numeroFactura, filtros.numeroRadicado].filter(Boolean).length > 0
                  ? `${[filtros.numeroFactura, filtros.numeroRadicado].filter(Boolean).length} filtro(s) activo(s)`
                  : 'Sin filtros aplicados'}
              </p>
            </div>
          </div>
          {(filtros.numeroFactura || filtros.numeroRadicado) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltros(FILTROS_INICIALES)}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2 min-w-0 flex-1 basis-48">
            <Label htmlFor="filter-factura" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Search className="w-3 h-3 text-red-600" />
              N° Factura
            </Label>
            <div className="relative">
              <Input
                id="filter-factura"
                placeholder="Ej: FAC-2026-001"
                value={filtros.numeroFactura}
                onChange={(e) => setFiltros((prev) => ({ ...prev, numeroFactura: e.target.value }))}
                className="border-slate-300 focus:border-red-600 focus:ring-red-600"
              />
              {filtros.numeroFactura && (
                <button onClick={() => setFiltros((prev) => ({ ...prev, numeroFactura: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2 min-w-0 flex-1 basis-48">
            <Label htmlFor="filter-radicado" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Search className="w-3 h-3 text-red-600" />
              N° Radicado
            </Label>
            <div className="relative">
              <Input
                id="filter-radicado"
                placeholder="Ej: RAD-2026-001"
                value={filtros.numeroRadicado}
                onChange={(e) => setFiltros((prev) => ({ ...prev, numeroRadicado: e.target.value }))}
                className="border-slate-300 focus:border-red-600 focus:ring-red-600"
              />
              {filtros.numeroRadicado && (
                <button onClick={() => setFiltros((prev) => ({ ...prev, numeroRadicado: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2 min-w-0 flex-1 basis-48">
            <Label htmlFor="filter-orden" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Search className="w-3 h-3 text-red-600" />
              Ordenar lista
            </Label>
            <select
              id="filter-orden"
              value={filtros.orden}
              onChange={(e) => setFiltros((prev) => ({ ...prev, orden: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-slate-700 text-sm focus:border-red-600 focus:outline-none"
            >
              {ORDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
