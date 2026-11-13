import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { SearchableSelect } from '../../../../components/ui/searchableSelect';
import { Eye, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { getPageNumbers, getTotalPages, getPageSlice, hasPrevPageWindow, hasNextPageWindow, getTargetPageForPrevWindow, getTargetPageForNextWindow } from '../../../gestionAcademica/hooks/paginacion';
import type { usePublicConsultaHorarioPagina } from '../../hooks/usePublicConsultaHorarioPagina';

type Gestion = ReturnType<typeof usePublicConsultaHorarioPagina>;

/** Horarios agrupados por docente, con su paginación. */
export function HorariosPorDocente({ currentPageDocente, setCurrentPageDocente, pageSize, filtroDocente, setFiltroDocente, horariosDocente, docentes, handleVerHorarioDocente }: Pick<Gestion, 'currentPageDocente' | 'setCurrentPageDocente' | 'pageSize' | 'filtroDocente' | 'setFiltroDocente' | 'horariosDocente' | 'docentes' | 'handleVerHorarioDocente'>) {
  // Agrupar horarios por docente y filtrar
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as Record<string, { docente: string; facultad?: string; horarios: any[] }>);

  const docentesListaAgrupada = Object.values(docentesAgrupados);
  const totalDocentes = docentesListaAgrupada.length;
  const totalPagesDocente = getTotalPages(totalDocentes, pageSize);
  const paginatedDocentes = getPageSlice(docentesListaAgrupada, currentPageDocente, pageSize);
  const pageNumbersDocente = getPageNumbers(totalPagesDocente, currentPageDocente);

  const goToPageDocente = (page: number) => setCurrentPageDocente(page);
  const goToPrevPageDocente = () => setCurrentPageDocente(p => Math.max(1, p - 1));
  const goToNextPageDocente = () => setCurrentPageDocente(p => Math.min(totalPagesDocente, p + 1));
  const goToPrevPageWindowDocente = () => {
    const target = getTargetPageForPrevWindow(currentPageDocente, totalPagesDocente);
    if (target) setCurrentPageDocente(target);
  };
  const goToNextPageWindowDocente = () => {
    const target = getTargetPageForNextWindow(currentPageDocente, totalPagesDocente);
    if (target) setCurrentPageDocente(target);
  };

  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-slate-100">Horarios por Docente</CardTitle>
          <div className="w-[340px]">
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
            <p className="text-slate-600 dark:text-slate-400 mb-2">No se encontraron docentes</p>
            <p className="text-slate-500 dark:text-slate-500">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300">Facultad</th>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300">Nombre Docente</th>
                  <th className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocentes.map((item) => (
                  <tr key={item.docente} className="border-t border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{item.facultad || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{item.docente}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
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
        {/* Pagination Docentes */}
        {totalDocentes > pageSize && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Mostrando {Math.min((currentPageDocente - 1) * pageSize + 1, totalDocentes)} - {Math.min(currentPageDocente * pageSize, totalDocentes)} de {totalDocentes} docentes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPageDocente}
                disabled={currentPageDocente <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              {hasPrevPageWindow(currentPageDocente, totalPagesDocente) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPageWindowDocente}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
              )}
              {pageNumbersDocente.map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPageDocente ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => goToPageDocente(pageNumber)}
                  className={pageNumber === currentPageDocente ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                >
                  {pageNumber}
                </Button>
              ))}
              {hasNextPageWindow(currentPageDocente, totalPagesDocente) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPageWindowDocente}
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPageDocente}
                disabled={currentPageDocente >= totalPagesDocente}
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
