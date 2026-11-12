import { Badge } from '../../../../components/ui/badge';
import { TabsContent } from '../../../../components/ui/tabs';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { SearchableSelect } from '../../../../components/ui/searchableSelect';
import { HorarioFiltersCard, FilterField } from '../../../horarios/components/horarioFiltersCard';
import {
  Search,
  Calendar,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Loading } from '../../../../components/common/Loading';
import type { useCentroHorarios } from '../../hooks/useCentroHorarios';

interface Props {
  hook: ReturnType<typeof useCentroHorarios>;
}

/** Pestaña «Consulta de Horarios» del Centro de Horarios. */
export function ConsultaHorariosTab({ hook }: Props) {
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
    loadData,
    horariosFiltrados,
    gruposAgrupados,
    gruposAgrupadosTotal,
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
    limpiarFiltros,
  } = hook;

  return (
  <TabsContent value="consulta" className="space-y-6">
    {/* Filtros */}
    <HorarioFiltersCard
      activeCount={[filtroFacultad, filtroPrograma, filtroGrupo, filtroSemestre, filtroPeriodo, filtroDocente, filtroEspacio].filter(v => v && v !== 'all').length}
      onClear={limpiarFiltros}
      accentClassName="text-blue-600"
      actions={
        <Button
          onClick={() => loadData({ force: true })}
          className="ml-auto bg-blue-600 hover:bg-blue-700"
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

    {/* Resultados */}
    <Card className="border-slate-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Grupos Encontrados ({gruposAgrupadosTotal}) 
          {/* DEBUG: totalPages={totalPages}, currentPage={currentPage} */}
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
                  <th className="px-4 py-3 text-center text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gruposAgrupados.map((grupo) => (
                  <tr key={`${grupo.programaId}-${grupo.grupo}-${grupo.semestre}-${grupo.periodoId ?? 'sin-periodo'}`} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{grupo.horarios[0]?.programa_nombre || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-blue-600 text-blue-600">{grupo.grupo}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{grupo.semestre}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleVerDetalles(grupo)}
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
