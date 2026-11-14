import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { TrendingUp, Filter, Search, X } from 'lucide-react';
import { FILTROS_INICIALES, ORDER_OPTIONS } from '../../../hooks/tesoreria/enviarDireccionFinancieraUtils';
import type { useEnviarDireccionFinanciera } from '../../../hooks/tesoreria/useEnviarDireccionFinanciera';

type Gestion = ReturnType<typeof useEnviarDireccionFinanciera>;

/** Filtros y orden de las facturas aprobadas por auditoría. */
export function FiltrosEnviarDireccion({ filtros, setFiltros, filtrosActivos }: Pick<Gestion, 'filtros' | 'setFiltros' | 'filtrosActivos'>) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Filtros de Busqueda Independientes
            </CardTitle>
            <CardDescription>
              Filtre por columna especifica usando los campos independientes
              {filtrosActivos > 0 && <span className="ml-2 text-red-600 font-semibold">{filtrosActivos} {filtrosActivos === 1 ? 'filtro activo' : 'filtros activos'}</span>}
            </CardDescription>
          </div>
          {filtrosActivos > 0 && (
            <Button size="sm" variant="outline" onClick={() => setFiltros(FILTROS_INICIALES)} className="border-red-200 text-red-600 hover:bg-red-50 gap-1">
              <X className="h-3 w-3" /> Limpiar Todo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-3">
          <div className="space-y-1">
            <Label className="flex items-center gap-1 text-xs font-medium text-slate-600"><Search className="h-3 w-3" /> N° Factura</Label>
            <Input placeholder="Ej: FAC-2026-001" value={filtros.numeroFactura} onChange={(e) => setFiltros((p) => ({ ...p, numeroFactura: e.target.value }))} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1 text-xs font-medium text-slate-600"><Search className="h-3 w-3" /> N° Radicado</Label>
            <Input placeholder="Ej: RAD-2026-001" value={filtros.numeroRadicado} onChange={(e) => setFiltros((p) => ({ ...p, numeroRadicado: e.target.value }))} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1 text-xs font-medium text-slate-600"><Search className="h-3 w-3" /> N° Proceso Pago</Label>
            <Input placeholder="Ej: PRC-2026-001" value={filtros.numeroProcesoPago} onChange={(e) => setFiltros((p) => ({ ...p, numeroProcesoPago: e.target.value }))} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1 text-xs font-medium text-slate-600"><Filter className="h-3 w-3" /> Desde</Label>
            <Input type="date" value={filtros.fechaInicio} onChange={(e) => setFiltros((p) => ({ ...p, fechaInicio: e.target.value }))} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1 text-xs font-medium text-slate-600"><Filter className="h-3 w-3" /> Hasta</Label>
            <Input type="date" value={filtros.fechaFin} onChange={(e) => setFiltros((p) => ({ ...p, fechaFin: e.target.value }))} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">Ordenar lista</Label>
            <select value={filtros.orden} onChange={(e) => setFiltros((p) => ({ ...p, orden: e.target.value }))} className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700">
              {ORDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
