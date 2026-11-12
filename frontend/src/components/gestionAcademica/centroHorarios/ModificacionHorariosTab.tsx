import { Badge } from '../../../share/badge';
import { TabsContent } from '../../../share/tabs';
import { Fragment } from 'react';
import { Button } from '../../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../share/card';
import { SearchableSelect } from '../../../share/searchableSelect';
import { HorarioFiltersCard, FilterField } from '../../../share/horarioFiltersCard';
import {
  Search,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  ChevronDown,
  List,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Loading } from '../../../components/common/Loading';
import type { useCentroHorarios } from '../../../hooks/gestionAcademica/useCentroHorarios';

interface Props {
  hook: ReturnType<typeof useCentroHorarios>;
}

/** Pestaña «Modificación» del Centro de Horarios. */
export function ModificacionHorariosTab({ hook }: Props) {
  const {
    loading,
    facultades,
    filtroFacultad,
    setFiltroFacultad,
    filtroPrograma,
    setFiltroPrograma,
    filtroGrupo,
    setFiltroGrupo,
    filtroSemestre,
    setFiltroSemestre,
    filtroPeriodo,
    setFiltroPeriodo,
    filtroDocente,
    setFiltroDocente,
    filtroEspacio,
    setFiltroEspacio,
    gruposExpandidos,
    loadData,
    horariosFiltrados,
    gruposAgrupados,
    gruposAgrupadosTotal,
    obtenerHorariosCompletosDeGrupo,
    currentPage,
    totalPages,
    pageNumbers,
    pageSize,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasPrevPageWindow,
    hasNextPageWindow,
    goToPrevPageWindow,
    goToNextPageWindow,
    gruposUnicos,
    semestresUnicos,
    docentesDisponibles,
    espaciosDisponibles,
    periodosDisponibles,
    programasFiltrados,
    handleVerDetalles,
    handleEditar,
    handleEliminar,
    limpiarFiltros,
    toggleGrupoExpandido,
    handleAbrirModalEliminarGrupo,
  } = hook;

  return (
  <TabsContent value="modificacion" className="space-y-6">
    {/* Filtros (reutilizados) */}
    <HorarioFiltersCard
      activeCount={[filtroFacultad, filtroPrograma, filtroGrupo, filtroSemestre, filtroPeriodo, filtroDocente, filtroEspacio].filter(v => v && v !== 'all').length}
      onClear={limpiarFiltros}
      accentClassName="text-orange-600"
      actions={
        <Button
          onClick={() => loadData({ force: true })}
          className="ml-auto bg-orange-600 hover:bg-orange-700"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      }
    >
      <FilterField label="Facultad">
        <SearchableSelect
          items={[
            ...(facultades.length > 1 ? [{ id: 'all', nombre: 'Todas las facultades' }] : []),
            ...facultades.map(f => ({
              id: (f.id ?? '').toString(),
              nombre: f.nombre
            }))
          ]}
          value={filtroFacultad}
          onSelect={(item) => setFiltroFacultad(item.id)}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.nombre}
          placeholder="Seleccionar facultad..."
          searchPlaceholder="Buscar facultad..."
          emptyMessage="No se encontró ninguna facultad"
          disabled={facultades.length === 1}
        />
      </FilterField>

      <FilterField label="Programa">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todos los programas' },
            ...programasFiltrados.map(p => ({
              id: (p.id ?? '').toString(),
              nombre: p.nombre
            }))
          ]}
          value={filtroPrograma}
          onSelect={(item) => setFiltroPrograma(item.id)}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.nombre}
          placeholder="Seleccionar programa..."
          searchPlaceholder="Buscar programa..."
          emptyMessage="No se encontró ningún programa"
        />
      </FilterField>

      <FilterField label="Grupo">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todos los grupos' },
            ...gruposUnicos.map(g => ({
              id: g,
              nombre: g
            }))
          ]}
          value={filtroGrupo}
          onSelect={(item) => setFiltroGrupo(item.id)}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.nombre}
          placeholder="Seleccionar grupo..."
          searchPlaceholder="Buscar grupo..."
          emptyMessage="No se encontró ningún grupo"
        />
      </FilterField>

      <FilterField label="Semestre">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todos los semestres' },
            ...semestresUnicos.map(s => ({
              id: s.toString(),
              nombre: `Semestre ${s}`
            }))
          ]}
          value={filtroSemestre}
          onSelect={(item) => setFiltroSemestre(item.id)}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.nombre}
          placeholder="Seleccionar semestre..."
          searchPlaceholder="Buscar semestre..."
          emptyMessage="No se encontró ningún semestre"
        />
      </FilterField>

      <FilterField label="Periodo">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todos los periodos' },
            ...periodosDisponibles.map(p => ({
              id: (p.id ?? '').toString(),
              nombre: p.nombre
            }))
          ]}
          value={filtroPeriodo}
          onSelect={(item) => setFiltroPeriodo(item.id)}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.nombre}
          placeholder="Seleccionar periodo..."
          searchPlaceholder="Buscar periodo..."
          emptyMessage="No se encontró ningún periodo"
        />
      </FilterField>

      <FilterField label="Docente">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todos los docentes', correo: '' },
            ...(horariosFiltrados.some(h => h.docente_id == null) ? [{ id: 'sin-asignar', nombre: 'Sin asignar', correo: '' }] : []),
            ...docentesDisponibles.map(d => ({
              id: d.id.toString(),
              nombre: d.nombre,
              correo: d.correo
            }))
          ]}
          value={filtroDocente}
          onSelect={(item) => setFiltroDocente(item.id)}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.nombre}
          getItemSecondary={(item) => item.correo}
          placeholder="Seleccionar docente..."
          searchPlaceholder="Buscar docente..."
          emptyMessage="No se encontró ningún docente"
        />
      </FilterField>

      <FilterField label="Espacio">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todos los espacios', capacidad: undefined },
            ...(horariosFiltrados.some(h => h.espacio_id == null) ? [{ id: 'sin-espacio', nombre: 'Sin espacio', capacidad: undefined }] : []),
            ...espaciosDisponibles.map(e => ({
              id: (e.id ?? '').toString(),
              nombre: e.nombre,
              capacidad: e.capacidad
            }))
          ]}
          value={filtroEspacio}
          onSelect={(item) => setFiltroEspacio(item.id)}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.nombre}
          getItemSecondary={(item) => item.capacidad ? `Capacidad: ${item.capacidad}` : ''}
          placeholder="Seleccionar espacio..."
          searchPlaceholder="Buscar espacio..."
          emptyMessage="No se encontró ningún espacio"
        />
      </FilterField>
    </HorarioFiltersCard>

    {/* Tabla de Modificación */}
    <Card className="border-slate-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-orange-600" />
            Modificación y Eliminación de Grupos ({gruposAgrupadosTotal})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && gruposAgrupados.length === 0 ? (
          <Loading message="Cargando grupos..." />
        ) : gruposAgrupados.length === 0 ? (
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
                  <th className="px-4 py-3 text-center text-slate-700">Clases</th>
                  <th className="px-4 py-3 text-center text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gruposAgrupados.map((grupo) => {
                  const grupoKey = `${grupo.programaId}-${grupo.grupo}-${grupo.semestre}-${grupo.periodoId ?? 'sin-periodo'}`;
                  const estaExpandido = gruposExpandidos.has(grupoKey);
                  // Horario completo del grupo (todas las asignaturas), sin recortar por
                  // los filtros de docente/espacio usados solo para localizar el grupo.
                  const horariosCompletos = obtenerHorariosCompletosDeGrupo(grupo);

                  return (
                    <Fragment key={grupoKey}>
                      {/* Fila principal del grupo */}
                      <tr className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900">{grupo.horarios[0]?.programa_nombre || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="border-orange-600 text-orange-600">{grupo.grupo}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{grupo.semestre}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className="bg-slate-600">{horariosCompletos.length} clases</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-purple-600 text-purple-600 hover:bg-purple-50"
                              onClick={() => toggleGrupoExpandido(grupoKey)}
                            >
                              <List className="w-4 h-4 mr-2" />
                              Ver Asignaturas
                              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${estaExpandido ? 'rotate-180' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-600 text-orange-600 hover:bg-orange-50"
                              onClick={() => handleVerDetalles(grupo)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Horario
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-600 hover:bg-red-50"
                              onClick={() => handleAbrirModalEliminarGrupo(grupo)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar Grupo
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Fila expandible con lista de asignaturas */}
                      <AnimatePresence>
                        {estaExpandido && (
                          <motion.tr
                            key={`${grupoKey}-expandido`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-gradient-to-r from-purple-50 to-orange-50"
                          >
                            <td colSpan={5} className="px-4 py-4">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="bg-white rounded-lg border-2 border-purple-200 p-4">
                                  <div className="flex items-center gap-2 mb-4">
                                    <List className="w-5 h-5 text-purple-600" />
                                    <h3 className="text-slate-900">Asignaturas del Grupo {grupo.grupo}</h3>
                                    <Badge className="bg-purple-600">{horariosCompletos.length} asignaturas</Badge>
                                  </div>

                                  {/* Tabla interna de asignaturas */}
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead className="bg-purple-100">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-purple-900 text-sm">Asignatura</th>
                                          <th className="px-3 py-2 text-left text-purple-900 text-sm">Docente</th>
                                          <th className="px-3 py-2 text-center text-purple-900 text-sm">Día</th>
                                          <th className="px-3 py-2 text-center text-purple-900 text-sm">Horario</th>
                                          <th className="px-3 py-2 text-center text-purple-900 text-sm">Espacio</th>
                                          <th className="px-3 py-2 text-center text-purple-900 text-sm">Acciones</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {horariosCompletos.map((horario, idx) => (
                                          <motion.tr
                                            key={horario.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="border-t border-purple-100 hover:bg-purple-50 transition-colors"
                                          >
                                            <td className="px-3 py-2 text-slate-900">{horario.asignatura_nombre}</td>
                                            <td className="px-3 py-2 text-slate-700">{horario.docente_nombre}</td>
                                            <td className="px-3 py-2 text-center">
                                              <Badge variant="outline" className="border-slate-600 text-slate-700 text-xs">
                                                {horario.dia_semana.charAt(0).toUpperCase() + horario.dia_semana.slice(1)}
                                              </Badge>
                                            </td>
                                            <td className="px-3 py-2 text-center text-slate-700 text-sm">
                                              {horario.hora_inicio} - {horario.hora_fin}
                                            </td>
                                            <td className="px-3 py-2 text-center text-slate-700 text-sm">
                                              {horario.espacio_nombre}
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="flex gap-2 justify-center">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="border-blue-600 text-blue-600 hover:bg-blue-50 h-8 px-2"
                                                  onClick={() => handleEditar(horario)}
                                                >
                                                  <Edit className="w-3 h-3 mr-1" />
                                                  Editar
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="border-red-600 text-red-600 hover:bg-red-50 h-8 px-2"
                                                  onClick={() => handleEliminar(horario.id)}
                                                >
                                                  <Trash2 className="w-3 h-3 mr-1" />
                                                  Eliminar
                                                </Button>
                                              </div>
                                            </td>
                                          </motion.tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-slate-600">
                Mostrando {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, gruposAgrupadosTotal)} de {gruposAgrupadosTotal} grupos
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
                {hasPrevPageWindow && (
                  <Button variant="ghost" size="sm" onClick={goToPrevPageWindow}>
                    ...
                  </Button>
                )}
                {pageNumbers.map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                {hasNextPageWindow && (
                  <Button variant="ghost" size="sm" onClick={goToNextPageWindow}>
                    ...
                  </Button>
                )}
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
      </CardContent>
    </Card>
  </TabsContent>
  );
}
