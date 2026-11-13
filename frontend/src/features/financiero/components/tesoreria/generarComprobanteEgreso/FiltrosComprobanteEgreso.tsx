import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Calendar, Filter, Search, X } from 'lucide-react';
import { ORDER_OPTIONS } from '../../../hooks/tesoreria/generarComprobanteEgresoUtils';
import type { useGenerarComprobanteEgreso } from '../../../hooks/tesoreria/useGenerarComprobanteEgreso';

type Gestion = ReturnType<typeof useGenerarComprobanteEgreso>;

/** Filtros y orden de las facturas pagadas. */
export function FiltrosComprobanteEgreso({ filtros, setFiltros, filtrosActivos, FILTROS_INICIALES }: Pick<Gestion, 'filtros' | 'setFiltros' | 'filtrosActivos' | 'FILTROS_INICIALES'>) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-slate-800">Filtros de Busqueda</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {filtrosActivos > 0 ? `${filtrosActivos} filtro(s) activo(s)` : 'Sin filtros aplicados'}
              </p>
            </div>
          </div>
          {filtrosActivos > 0 && (
            <Button type="button" variant="outline" onClick={() => setFiltros(FILTROS_INICIALES)} className="border-red-300 text-red-700 hover:bg-red-50">
              <X className="w-4 h-4 mr-2" />Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-3">
          {/* N° Factura */}
          <div className="space-y-2 min-w-0 flex-1 basis-40">
            <Label htmlFor="f-factura" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Search className="w-3 h-3 text-red-600" />N° Factura
            </Label>
            <div className="relative">
              <Input id="f-factura" placeholder="FAC-2026-001" value={filtros.numeroFactura}
                onChange={(e) => setFiltros((p) => ({ ...p, numeroFactura: e.target.value }))}
                className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
              {filtros.numeroFactura && <button onClick={() => setFiltros((p) => ({ ...p, numeroFactura: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
            </div>
          </div>
          {/* N° Radicado */}
          <div className="space-y-2 min-w-0 flex-1 basis-40">
            <Label htmlFor="f-radicado" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Search className="w-3 h-3 text-red-600" />N° Radicado
            </Label>
            <div className="relative">
              <Input id="f-radicado" placeholder="RAD-2026-001" value={filtros.numeroRadicado}
                onChange={(e) => setFiltros((p) => ({ ...p, numeroRadicado: e.target.value }))}
                className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
              {filtros.numeroRadicado && <button onClick={() => setFiltros((p) => ({ ...p, numeroRadicado: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
            </div>
          </div>
          {/* N° Proceso Pago */}
          <div className="space-y-2 min-w-0 flex-1 basis-40">
            <Label htmlFor="f-proceso" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Search className="w-3 h-3 text-red-600" />N° Proceso Pago
            </Label>
            <div className="relative">
              <Input id="f-proceso" placeholder="PP-2026-001" value={filtros.numeroProcesoPago}
                onChange={(e) => setFiltros((p) => ({ ...p, numeroProcesoPago: e.target.value }))}
                className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
              {filtros.numeroProcesoPago && <button onClick={() => setFiltros((p) => ({ ...p, numeroProcesoPago: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
            </div>
          </div>
          {/* Desde */}
          <div className="space-y-2 min-w-0 flex-1 basis-36">
            <Label htmlFor="f-desde" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-600" />Desde
            </Label>
            <Input id="f-desde" type="date" value={filtros.fechaInicio}
              onChange={(e) => setFiltros((p) => ({ ...p, fechaInicio: e.target.value }))}
              className="border-slate-300 focus:border-blue-600 focus:ring-blue-600" />
          </div>
          {/* Hasta */}
          <div className="space-y-2 min-w-0 flex-1 basis-36">
            <Label htmlFor="f-hasta" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-600" />Hasta
            </Label>
            <Input id="f-hasta" type="date" value={filtros.fechaFin}
              onChange={(e) => setFiltros((p) => ({ ...p, fechaFin: e.target.value }))}
              className="border-slate-300 focus:border-blue-600 focus:ring-blue-600" />
          </div>
          {/* Ordenar */}
          <div className="space-y-2 min-w-0 flex-1 basis-36">
            <Label htmlFor="f-orden" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Search className="w-3 h-3 text-red-600" />Ordenar lista
            </Label>
            <select id="f-orden" value={filtros.orden}
              onChange={(e) => setFiltros((p) => ({ ...p, orden: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-slate-700 text-sm focus:border-red-600 focus:outline-none">
              {ORDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
