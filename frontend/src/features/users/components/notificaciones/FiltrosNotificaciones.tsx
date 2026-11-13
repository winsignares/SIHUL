import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Search, X } from 'lucide-react';
import type { useNotificacionesPagina } from '../../hooks/useNotificacionesPagina';

type Gestion = ReturnType<typeof useNotificacionesPagina>;

/** Búsqueda y filtros por período y prioridad. */
export function FiltrosNotificaciones({
  busqueda, setBusqueda, filtroTiempo, setFiltroTiempo, filtroPrioridad, setFiltroPrioridad,
}: Pick<Gestion, 'busqueda' | 'setBusqueda' | 'filtroTiempo' | 'setFiltroTiempo' | 'filtroPrioridad' | 'setFiltroPrioridad'>) {
  return (
    <div className="mt-6 space-y-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar notificaciones por título o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-slate-300 dark:border-slate-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
        />
        {busqueda && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBusqueda('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filtros con Selects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtro de Tiempo */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Período de Tiempo
          </Label>
          <Select value={filtroTiempo} onValueChange={(value) => setFiltroTiempo(value as any)}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            <SelectTrigger className="w-full border border-slate-300 dark:border-slate-600">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Hoy (últimas 24h)</SelectItem>
              <SelectItem value="semana">Esta Semana (7 días)</SelectItem>
              <SelectItem value="mes">Este Mes (30 días)</SelectItem>
              <SelectItem value="todo">Todo el Tiempo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Prioridad */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Prioridad
          </Label>
          <Select value={filtroPrioridad} onValueChange={(value) => setFiltroPrioridad(value as any)}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            <SelectTrigger className="w-full border border-slate-300 dark:border-slate-600">
              <SelectValue placeholder="Seleccionar prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las Prioridades</SelectItem>
              <SelectItem value="alta">Alta - Urgente</SelectItem>
              <SelectItem value="media">Media - Importante</SelectItem>
              <SelectItem value="baja">Baja - Informativa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
