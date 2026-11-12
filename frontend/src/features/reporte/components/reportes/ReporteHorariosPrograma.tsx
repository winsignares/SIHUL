import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { Eye, Search } from 'lucide-react';
import type { HorarioPrograma } from '../../models/reportes-general.model';
import type { useReportes } from '../../hooks/useReportes';

type Reportes = ReturnType<typeof useReportes>;

/** Listado de grupos por programa con acceso a su horario. */
export function ReporteHorariosPrograma({
  horariosPrograma,
  filtroPrograma,
  setFiltroPrograma,
  programas,
  handleVerHorarioGrupo
}: Pick<Reportes, 'horariosPrograma' | 'filtroPrograma' | 'setFiltroPrograma' | 'programas' | 'handleVerHorarioGrupo'>) {
  // Agrupar horarios por programa, grupo y semestre
  const horariosAgrupados = horariosPrograma
    .filter(horario => 
      filtroPrograma === 'Todos' || 
      horario.programa?.toLowerCase() === filtroPrograma.toLowerCase()
    )
    .reduce((acc, horario) => {
      const key = `${horario.programa}-${horario.grupo}`;
      if (!acc[key]) {
        acc[key] = {
          programa: horario.programa,
          grupo: horario.grupo,
          horarios: []
        };
      }
      acc[key].horarios.push(horario);
      return acc;
    }, {} as Record<string, { programa?: string; grupo: string; horarios: HorarioPrograma[] }>);

  const gruposAgrupados = Object.values(horariosAgrupados);

  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-slate-100">Horarios por Programa</CardTitle>
          <Select value={filtroPrograma} onValueChange={setFiltroPrograma}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Seleccionar programa" />
            </SelectTrigger>
            <SelectContent>
              {programas.map(prog => (
                <SelectItem key={prog} value={prog}>{prog}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {gruposAgrupados.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No se encontraron grupos</p>
            <p className="text-slate-500">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-700">Programa</th>
                  <th className="px-4 py-3 text-left text-slate-700">Grupo</th>
                  <th className="px-4 py-3 text-left text-slate-700">Semestre</th>
                  <th className="px-4 py-3 text-center text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gruposAgrupados.map((grupo) => (
                  <tr key={`${grupo.programa}-${grupo.grupo}`} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{grupo.programa || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-blue-600 text-blue-600">
                        {grupo.grupo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {grupo.horarios[0]?.semestre || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleVerHorarioGrupo(grupo.grupo)}
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
