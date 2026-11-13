import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { usePrestamosEspaciosPagina } from '../../hooks/usePrestamosEspaciosPagina';

type Gestion = ReturnType<typeof usePrestamosEspaciosPagina>;

/** Paginación de la vista de lista. */
export function PaginacionPrestamos({ vista, totalFilteredPrestamos, currentPage, totalPages, pageNumbers, pageSize, goToPage, goToNextPage, goToPrevPage, hasPrevPageWindow, hasNextPageWindow, goToPrevPageWindow, goToNextPageWindow }: Pick<Gestion, 'vista' | 'totalFilteredPrestamos' | 'currentPage' | 'totalPages' | 'pageNumbers' | 'pageSize' | 'goToPage' | 'goToNextPage' | 'goToPrevPage' | 'hasPrevPageWindow' | 'hasNextPageWindow' | 'goToPrevPageWindow' | 'goToNextPageWindow'>) {
  return (
    <>
      {vista === 'lista' && totalFilteredPrestamos > 0 && (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mostrando {totalFilteredPrestamos === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalFilteredPrestamos)} de {totalFilteredPrestamos} solicitudes
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPageWindow}
                    disabled={!hasPrevPageWindow}
                    className="px-2"
                    title="Ver números de página anteriores"
                    aria-label="Grupo anterior de páginas"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1 flex-wrap">
                    {pageNumbers.map((page) => (
                      <Button
                        key={page}
                        type="button"
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToNextPageWindow}
                    disabled={!hasNextPageWindow}
                    className="px-2"
                    title="Ver números de página siguientes"
                    aria-label="Grupo siguiente de páginas"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
