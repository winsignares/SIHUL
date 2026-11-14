import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Search, LayoutGrid, List } from 'lucide-react';
import type { usePrestamosEspaciosPagina } from '../../hooks/usePrestamosEspaciosPagina';

type Gestion = ReturnType<typeof usePrestamosEspaciosPagina>;

/** Filtros de las solicitudes de préstamo. */
export function FiltrosPrestamos({ vista, setVista, searchTerm, setSearchTerm, filterEstado, setFilterEstado, filterFechaHora, setFilterFechaHora, filterFechaEspecifica, setFilterFechaEspecifica, filterPeriodo, setFilterPeriodo, periodos }: Pick<Gestion, 'vista' | 'setVista' | 'searchTerm' | 'setSearchTerm' | 'filterEstado' | 'setFilterEstado' | 'filterFechaHora' | 'setFilterFechaHora' | 'filterFechaEspecifica' | 'setFilterFechaEspecifica' | 'filterPeriodo' | 'setFilterPeriodo' | 'periodos'>) {
  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por solicitante, espacio o tipo de evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filterFechaHora}
            onValueChange={(value) => {
              setFilterFechaHora(value);
              if (value !== 'fecha-especifica') setFilterFechaEspecifica('');
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Fecha y Hora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las fechas</SelectItem>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="esta-semana">Esta semana</SelectItem>
              <SelectItem value="este-mes">Este mes</SelectItem>
              <SelectItem value="proximos">Próximos</SelectItem>
              <SelectItem value="pasados">Pasados</SelectItem>
              <SelectItem value="fecha-especifica">Fecha específica</SelectItem>
            </SelectContent>
          </Select>
          {filterFechaHora === 'fecha-especifica' && (
            <Input
              type="date"
              value={filterFechaEspecifica}
              onChange={(e) => setFilterFechaEspecifica(e.target.value)}
              className="w-[200px]"
            />
          )}
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="aprobado">Aprobados</SelectItem>
              <SelectItem value="rechazado">Rechazados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Periodo académico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los periodos</SelectItem>
              {periodos.map((periodo) => (
                <SelectItem key={periodo.id} value={String(periodo.id)}>
                  {periodo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
            <Button
              type="button"
              variant={vista === 'lista' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVista('lista')}
              title="Vista lista"
            >
              <List className="w-4 h-4 mr-2" />
              Vista Lista
            </Button>
            <Button
              type="button"
              variant={vista === 'cuadricula' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVista('cuadricula')}
              title="Vista cuadrícula"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Vista Cuadrícula
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
