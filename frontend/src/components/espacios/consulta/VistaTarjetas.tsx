import type { ReactNode } from 'react';
import { Button } from '../../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { 
  CalendarDays, 
  MapPin, 
  Users, 
  RefreshCw, 
  AlertCircle,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { motion } from 'motion/react';



import type { useConsultaEspacios } from '../../../hooks/espacios/useConsultaEspacios';

interface Props {
  hook: ReturnType<typeof useConsultaEspacios>;
  firstItemIndex: number;
  lastItemIndex: number;
  isMobile: boolean;
  getAperturaBadge: (estaAbierto: boolean) => ReactNode;
  periodoSeleccionado: ReturnType<typeof useConsultaEspacios>['periodos'][number] | null;
}

/** Vista de tarjetas (y su paginación) de la consulta de espacios. */
export function VistaTarjetas({ hook, firstItemIndex, lastItemIndex, isMobile, getAperturaBadge, periodoSeleccionado }: Props) {
  const {
    filterOcupacion,
    vistaActual,
    paginatedEspacios,
    totalFilteredEspacios,
    currentPage,
    totalPages,
    pageNumbers,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasPrevPageWindow,
    hasNextPageWindow,
    goToPrevPageWindow,
    goToNextPageWindow,
    espacioSeleccionado,
    verCronogramaIndividual,
    loading,
  } = hook;

  return (
    <>
  {/* Vista Tarjetas */}
  {vistaActual === 'tarjetas' && !espacioSeleccionado && (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
      {loading && (
        <div className="col-span-full flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 py-10">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Cargando espacios...</span>
          </div>
        </div>
      )}

      {!loading && paginatedEspacios.length === 0 && (
        <div className="col-span-full rounded-lg border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <p className="font-medium text-slate-700 dark:text-slate-200">
            {filterOcupacion === 'todos'
              ? 'No hay espacios que coincidan con los filtros seleccionados.'
              : 'No hay espacios que cumplan el filtro de ocupación seleccionado.'}
          </p>
          {periodoSeleccionado && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Los horarios y préstamos se están consultando únicamente para el periodo {periodoSeleccionado.nombre}.
            </p>
          )}
        </div>
      )}

      {!loading && paginatedEspacios.map(espacio => {
        return (
          <motion.div
            key={espacio.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card 
              className="border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow bg-white dark:bg-slate-800 cursor-pointer"
              onClick={() => verCronogramaIndividual(espacio)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-slate-900 dark:text-slate-100 mb-2">{espacio.nombre}</CardTitle>
                    <Badge variant="outline" className="border-blue-600 text-blue-600">
                      {espacio.tipo}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getAperturaBadge(espacio.estaAbierto)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Users className="w-4 h-4" />
                  <span>Capacidad: {espacio.capacidad} personas</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span>{espacio.sede} - Edificio {espacio.edificio}</span>
                </div>
                {espacio.proximaClase && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                    <p className="text-slate-600 dark:text-slate-400">Próxima clase:</p>
                    <p className="text-blue-700 dark:text-blue-300">{espacio.proximaClase}</p>
                  </div>
                )}
                <div className="pt-2">
                  <Button variant="outline" className="w-full text-sm border-blue-600 text-blue-600 hover:bg-blue-50">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Ver Cronograma
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  )}

  {/* Paginación - Solo en vista tarjetas */}
  {vistaActual === 'tarjetas' && !espacioSeleccionado && totalFilteredEspacios > 0 && (
    <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando {firstItemIndex}-{lastItemIndex} de {totalFilteredEspacios} espacios
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
            >
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
              <div className="flex gap-1 flex-wrap">
                {pageNumbers.map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className={currentPage === page ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800' : ''}
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
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )}

    </>
  );
}
