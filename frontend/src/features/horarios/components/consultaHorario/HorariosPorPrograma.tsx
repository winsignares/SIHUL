import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { SearchableSelect } from '../../../../components/ui/searchableSelect';
import { Eye, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { getPageNumbers, getTotalPages, getPageSlice, hasPrevPageWindow, hasNextPageWindow, getTargetPageForPrevWindow, getTargetPageForNextWindow } from '../../../gestionAcademica/hooks/paginacion';
import type { usePublicConsultaHorarioPagina } from '../../hooks/usePublicConsultaHorarioPagina';

type Gestion = ReturnType<typeof usePublicConsultaHorarioPagina>;

/** Horarios agrupados por programa, con su paginación. */
export function HorariosPorPrograma({ currentPagePrograma, setCurrentPagePrograma, pageSize, filtroPrograma, setFiltroPrograma, horariosPrograma, programas, handleVerHorarioGrupo }: Pick<Gestion, 'currentPagePrograma' | 'setCurrentPagePrograma' | 'pageSize' | 'filtroPrograma' | 'setFiltroPrograma' | 'horariosPrograma' | 'programas' | 'handleVerHorarioGrupo'>) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as Record<string, { programa?: string; grupo: string; horarios: any[] }>);

  const gruposAgrupados = Object.values(horariosAgrupados);
  const totalGrupos = gruposAgrupados.length;
  const totalPagesPrograma = getTotalPages(totalGrupos, pageSize);
  const paginatedGrupos = getPageSlice(gruposAgrupados, currentPagePrograma, pageSize);
  const pageNumbersPrograma = getPageNumbers(totalPagesPrograma, currentPagePrograma);

  const goToPagePrograma = (page: number) => setCurrentPagePrograma(page);
  const goToPrevPagePrograma = () => setCurrentPagePrograma(p => Math.max(1, p - 1));
  const goToNextPagePrograma = () => setCurrentPagePrograma(p => Math.min(totalPagesPrograma, p + 1));
  const goToPrevPageWindowPrograma = () => {
    const target = getTargetPageForPrevWindow(currentPagePrograma, totalPagesPrograma);
    if (target) setCurrentPagePrograma(target);
  };
  const goToNextPageWindowPrograma = () => {
    const target = getTargetPageForNextWindow(currentPagePrograma, totalPagesPrograma);
    if (target) setCurrentPagePrograma(target);
  };

  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-slate-100">Horarios por Programa</CardTitle>
          <div className="w-[340px]">
            <SearchableSelect
              items={programas.map((prog, index) => ({ id: index, nombre: prog }))}
              value={filtroPrograma === 'Todos' ? null : filtroPrograma}
              onSelect={(item) => setFiltroPrograma(item.nombre)}
              getItemId={(item) => item.nombre}
              getItemLabel={(item) => item.nombre}
              placeholder="Seleccionar programa..."
              searchPlaceholder="Buscar programa..."
              emptyMessage="No se encontró ningún programa"
              clearable
              onClear={() => setFiltroPrograma('Todos')}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {gruposAgrupados.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-2">No se encontraron grupos</p>
            <p className="text-slate-500 dark:text-slate-500">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300">Programa</th>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300">Grupo</th>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300">Semestre</th>
                  <th className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGrupos.map((grupo) => (
                  <tr key={`${grupo.programa}-${grupo.grupo}`} className="border-t border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{grupo.programa || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400">
                        {grupo.grupo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {grupo.horarios[0]?.semestre || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
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
        {/* Pagination Programas */}
        {totalGrupos > pageSize && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Mostrando {Math.min((currentPagePrograma - 1) * pageSize + 1, totalGrupos)} - {Math.min(currentPagePrograma * pageSize, totalGrupos)} de {totalGrupos} grupos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPagePrograma}
                disabled={currentPagePrograma <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              {hasPrevPageWindow(currentPagePrograma, totalPagesPrograma) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPageWindowPrograma}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
              )}
              {pageNumbersPrograma.map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPagePrograma ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => goToPagePrograma(pageNumber)}
                  className={pageNumber === currentPagePrograma ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                >
                  {pageNumber}
                </Button>
              ))}
              {hasNextPageWindow(currentPagePrograma, totalPagesPrograma) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPageWindowPrograma}
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPagePrograma}
                disabled={currentPagePrograma >= totalPagesPrograma}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
