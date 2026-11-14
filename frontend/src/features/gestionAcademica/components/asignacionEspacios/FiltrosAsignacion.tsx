import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { SearchableSelect } from '../../../../components/ui/searchableSelect';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Label } from '../../../../components/ui/label';
import { RefreshCw } from 'lucide-react';
import type { useAsignacionEspaciosSeccionalPagina } from '../../hooks/useAsignacionEspaciosSeccionalPagina';

type Gestion = ReturnType<typeof useAsignacionEspaciosSeccionalPagina>;

/** Filtros por período, programa, día y franja horaria. */
export function FiltrosAsignacion({ filtros, setFiltros, programas, grupos, asignaturas, periodos, diasSemana, handleForceReload }: Pick<Gestion, 'filtros' | 'setFiltros' | 'programas' | 'grupos' | 'asignaturas' | 'periodos' | 'diasSemana' | 'handleForceReload'>) {
  return (
    <Card className="border-slate-200 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white border-b-4 border-red-800 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <CardTitle className="text-white flex items-center gap-3 text-lg">
              <div className="w-1.5 h-7 bg-white rounded-full opacity-80"></div>
              Filtros de búsqueda avanzada
            </CardTitle>
            <p className="text-red-100 text-sm mt-2">Filtra horarios por programa, grupo, asignatura, período y día</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-red-100 hover:text-white transition-colors cursor-pointer">
              <Checkbox
                checked={!!filtros.soloSinEspacio}
                onCheckedChange={(value) => setFiltros({ soloSinEspacio: Boolean(value) })}
                className="cursor-pointer w-5 h-5 border-red-200 data-[state=checked]:bg-white data-[state=checked]:text-red-700"
              />
              <span className="font-semibold whitespace-nowrap">📌 Solo horarios sin espacio</span>
            </label>

            <Button
              onClick={handleForceReload}
              className="bg-white text-red-700 hover:bg-red-50 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar resultados
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 bg-gradient-to-br from-white via-red-50/30 to-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-red-700 uppercase tracking-wider">Programa</Label>
            <SearchableSelect
              items={[{ id: null, nombre: 'Todos' }, ...programas]}
              value={filtros.programaId}
              onSelect={(item) => setFiltros({ programaId: item.id, grupoId: null })}
              getItemId={(item) => item.id ?? 'all'}
              getItemLabel={(item) => item.nombre}
              placeholder="Todos"
              searchPlaceholder="Buscar programa..."
              emptyMessage="No se encontró ningún programa."
              clearable
              onClear={() => setFiltros({ programaId: null, grupoId: null })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-red-700 uppercase tracking-wider">Grupo</Label>
            <SearchableSelect
              items={[{ id: null, nombre: 'Todos' }, ...grupos]}
              value={filtros.grupoId}
              onSelect={(item) => setFiltros({ grupoId: item.id })}
              getItemId={(item) => item.id ?? 'all'}
              getItemLabel={(item) => item.nombre}
              placeholder="Todos"
              searchPlaceholder="Buscar grupo..."
              emptyMessage="No se encontró ningún grupo."
              clearable
              onClear={() => setFiltros({ grupoId: null })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-red-700 uppercase tracking-wider">Asignatura</Label>
            <SearchableSelect
              items={[{ id: null, nombre: 'Todas' }, ...asignaturas]}
              value={filtros.asignaturaId}
              onSelect={(item) => setFiltros({ asignaturaId: item.id })}
              getItemId={(item) => item.id ?? 'all'}
              getItemLabel={(item) => item.nombre}
              placeholder="Todas"
              searchPlaceholder="Buscar asignatura..."
              emptyMessage="No se encontró ninguna asignatura."
              clearable
              onClear={() => setFiltros({ asignaturaId: null })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-red-700 uppercase tracking-wider">Día</Label>
            <SearchableSelect
              items={[{ valor: null, nombre: 'Todos' }, ...diasSemana.map(d => ({ valor: d, nombre: d }))]}
              value={filtros.diaSemana}
              onSelect={(item) => setFiltros({ diaSemana: item.valor })}
              getItemId={(item) => item.valor ?? 'all'}
              getItemLabel={(item) => item.nombre}
              placeholder="Todos"
              searchPlaceholder="Buscar día..."
              emptyMessage="No se encontró ningún día."
              clearable
              onClear={() => setFiltros({ diaSemana: null })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-red-700 uppercase tracking-wider">Período</Label>
            <SearchableSelect
              items={[{ id: null, nombre: 'Todos' }, ...periodos]}
              value={filtros.periodoId}
              onSelect={(item) => setFiltros({ periodoId: item.id })}
              getItemId={(item) => item.id ?? 'all'}
              getItemLabel={(item) => item.nombre}
              placeholder="Todos"
              searchPlaceholder="Buscar período..."
              emptyMessage="No se encontró ningún período."
              clearable
              onClear={() => setFiltros({ periodoId: null })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
