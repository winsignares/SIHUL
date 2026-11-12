import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { SearchableSelect } from '../../../../components/ui/searchableSelect';
import { Eye, Search } from 'lucide-react';
import type { HorarioDocente } from '../../models/reportes-general.model';
import type { useReportes } from '../../hooks/useReportes';

type Reportes = ReturnType<typeof useReportes>;

/** Listado de docentes con acceso a su horario. */
export function ReporteHorariosDocente({
  horariosDocente,
  filtroDocente,
  setFiltroDocente,
  docentes,
  handleVerHorarioDocente
}: Pick<Reportes, 'horariosDocente' | 'filtroDocente' | 'setFiltroDocente' | 'docentes' | 'handleVerHorarioDocente'>) {
  // Agrupar horarios por docente y filtrar según el filtro aplicado
  const docentesAgrupados = horariosDocente
    .filter(horario => 
      filtroDocente === 'Todos' || 
      horario.docente.toLowerCase() === filtroDocente.toLowerCase()
    )
    .reduce((acc, horario) => {
      const key = horario.docente;
      if (!acc[key]) {
        acc[key] = {
          docente: horario.docente,
          facultad: horario.facultad,
          horarios: []
        };
      }
      acc[key].horarios.push(horario);
      return acc;
    }, {} as Record<string, { docente: string; facultad?: string; horarios: HorarioDocente[] }>);

  const docentesListaAgrupada = Object.values(docentesAgrupados);

  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-slate-100">Horarios por Docente</CardTitle>
          <div className="w-[300px]">
            <SearchableSelect
              items={docentes}
              value={filtroDocente}
              onSelect={(docente) => setFiltroDocente(docente.nombre)}
              getItemId={(docente) => docente.nombre}
              getItemLabel={(docente) => docente.nombre}
              getItemSecondary={(docente) => docente.correo}
              placeholder="Seleccionar docente..."
              searchPlaceholder="Buscar docente..."
              emptyMessage="No se encontró ningún docente"
              clearable
              onClear={() => setFiltroDocente('Todos')}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {docentesListaAgrupada.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No se encontraron docentes</p>
            <p className="text-slate-500">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-700">Facultad</th>
                  <th className="px-4 py-3 text-left text-slate-700">Nombre Docente</th>
                  <th className="px-4 py-3 text-center text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docentesListaAgrupada.map((item) => (
                  <tr key={item.docente} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{item.facultad || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-900">{item.docente}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleVerHorarioDocente(item.docente)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Horario
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
