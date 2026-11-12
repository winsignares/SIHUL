import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { motion } from 'motion/react';
import { Calendar, AlertCircle, Plus, Loader2 } from 'lucide-react';
import type { useCrearHorarios } from '../../hooks/useCrearHorarios';

type CrearHorarios = ReturnType<typeof useCrearHorarios>;

/** Tabla paginada de grupos que todavía no tienen horario. */
export function TablaGruposSinHorario({
  loading,
  gruposSinHorarioFiltrados,
  paginatedGrupos,
  handleAsignarHorario,
  currentPage,
  totalPages,
  goToPage,
  goToNextPage,
  goToPrevPage
}: Pick<CrearHorarios, 'loading' | 'gruposSinHorarioFiltrados' | 'paginatedGrupos' | 'handleAsignarHorario' | 'currentPage' | 'totalPages' | 'goToPage' | 'goToNextPage' | 'goToPrevPage'>) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <CardTitle className="flex items-center justify-between text-slate-900">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" />
            Grupos sin horarios creados ({gruposSinHorarioFiltrados.length})
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
            <p className="text-slate-600">Cargando grupos...</p>
          </div>
        )}

        {/* Tabla con scroll */}
        {!loading && (
          <>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-6 py-4 text-slate-700">Programa</th>
                    <th className="text-left px-6 py-4 text-slate-700">Grupo</th>
                    <th className="text-left px-6 py-4 text-slate-700">Semestre</th>
                    <th className="text-center px-6 py-4 text-slate-700">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGrupos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                        <p>No hay grupos sin horarios con los filtros seleccionados</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedGrupos.map((grupo, index) => (
                      <motion.tr
                        key={grupo.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-slate-900">{grupo.programa_nombre || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {grupo.nombre}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-600">Semestre {grupo.semestre}</td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            onClick={() => handleAsignarHorario(grupo)}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Asignar Horario
                          </Button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="border-t border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    Mostrando {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, gruposSinHorarioFiltrados.length)} de {gruposSinHorarioFiltrados.length} grupos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className={currentPage === pageNum ? 'bg-red-600 hover:bg-red-700' : ''}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && (
                        <span className="text-slate-500 px-2">...</span>
                      )}
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
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
