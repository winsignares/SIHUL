import { Button } from '../../../../components/ui/button';
import { SearchableSelect } from '../../../../components/ui/searchableSelect';
import { HorarioFiltersCard, FilterField } from '../../../horarios/components/horarioFiltersCard';
import { Search } from 'lucide-react';
import type { useCrearHorarios } from '../../hooks/useCrearHorarios';

type CrearHorarios = ReturnType<typeof useCrearHorarios>;

/** Filtros de la lista de grupos sin horario. */
export function FiltrosGruposSinHorario({
  facultades,
  filtroFacultad,
  setFiltroFacultad,
  filtroPrograma,
  setFiltroPrograma,
  filtroSemestre,
  setFiltroSemestre,
  filtroGrupo,
  setFiltroGrupo,
  filtroPeriodo,
  setFiltroPeriodo,
  filtroAsignatura,
  setFiltroAsignatura,
  filtroDocente,
  setFiltroDocente,
  filtroEspacio,
  setFiltroEspacio,
  filtroDia,
  setFiltroDia,
  limpiarFiltros,
  loadData,
  programasFiltrados,
  gruposFiltroDisponibles,
  periodosDisponibles,
  asignaturasFiltroDisponibles,
  docentesFiltroDisponibles,
  espaciosFiltroDisponibles,
  diasFiltroDisponibles,
  semestres
}: Pick<CrearHorarios, 'facultades' | 'filtroFacultad' | 'setFiltroFacultad' | 'filtroPrograma' | 'setFiltroPrograma' | 'filtroSemestre' | 'setFiltroSemestre' | 'filtroGrupo' | 'setFiltroGrupo' | 'filtroPeriodo' | 'setFiltroPeriodo' | 'filtroAsignatura' | 'setFiltroAsignatura' | 'filtroDocente' | 'setFiltroDocente' | 'filtroEspacio' | 'setFiltroEspacio' | 'filtroDia' | 'setFiltroDia' | 'limpiarFiltros' | 'loadData' | 'programasFiltrados' | 'gruposFiltroDisponibles' | 'periodosDisponibles' | 'asignaturasFiltroDisponibles' | 'docentesFiltroDisponibles' | 'espaciosFiltroDisponibles' | 'diasFiltroDisponibles' | 'semestres'>) {
  // Valor string para el select de programa
  const filtroProgramaValue = String(filtroPrograma);

  return (
    <HorarioFiltersCard
      activeCount={[filtroFacultad, filtroProgramaValue, filtroGrupo, filtroSemestre, filtroPeriodo, filtroAsignatura, filtroDocente, filtroEspacio, filtroDia].filter(v => v && v !== 'all').length}
      onClear={limpiarFiltros}
      accentClassName="text-red-600"
      actions={
        <Button
          onClick={() => loadData()}
          className="ml-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          size="sm"
        >
          <Search className="w-4 h-4 mr-2" />
          Buscar / Actualizar
        </Button>
      }
    >
      <FilterField label="Facultad">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todas las facultades' },
            ...facultades.map(f => ({
              id: f.id?.toString() || '',
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
        />
      </FilterField>

      <FilterField label="Programa">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todos los programas' },
            ...programasFiltrados.map(p => ({
              id: p.id?.toString() || '',
              nombre: p.nombre
            }))
          ]}
          value={filtroProgramaValue}
          onSelect={(item) => setFiltroPrograma(item.id === 'all' ? 'all' : Number(item.id))}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.nombre}
          placeholder="Seleccionar programa..."
          searchPlaceholder="Buscar programa..."
          emptyMessage="No se encontró ningún programa"
        />
      </FilterField>

      <FilterField label="Semestre">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todos los semestres' },
            ...semestres.map(s => ({
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

      <FilterField label="Grupo">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todos los grupos' },
            ...gruposFiltroDisponibles.map(g => ({
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

      <FilterField label="Periodo">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todos los periodos' },
            ...periodosDisponibles.map(p => ({
              id: p.id?.toString() || '',
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

      <FilterField label="Asignatura">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todas las asignaturas', codigo: '' },
            ...asignaturasFiltroDisponibles.map(a => ({
              id: a.id?.toString() || '',
              nombre: a.nombre,
              codigo: a.codigo
            }))
          ]}
          value={filtroAsignatura}
          onSelect={(item) => setFiltroAsignatura(item.id)}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.nombre}
          getItemSecondary={(item) => item.codigo}
          placeholder="Seleccionar asignatura..."
          searchPlaceholder="Buscar asignatura..."
          emptyMessage="No se encontró ninguna asignatura"
        />
      </FilterField>

      <FilterField label="Docente">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todos los docentes', correo: '' },
            { id: 'sin-asignar', nombre: 'Sin asignar', correo: '' },
            ...docentesFiltroDisponibles.map(d => ({
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
            { id: 'sin-espacio', nombre: 'Sin espacio', capacidad: undefined },
            ...espaciosFiltroDisponibles.map(e => ({
              id: e.id?.toString() || '',
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

      <FilterField label="Día">
        <SearchableSelect
          items={[
            { id: 'all', nombre: 'Todos los días' },
            ...diasFiltroDisponibles.map(dia => ({
              id: dia,
              nombre: dia.charAt(0).toUpperCase() + dia.slice(1)
            }))
          ]}
          value={filtroDia}
          onSelect={(item) => setFiltroDia(item.id)}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.nombre}
          placeholder="Seleccionar día..."
          searchPlaceholder="Buscar día..."
          emptyMessage="No se encontró ningún día"
        />
      </FilterField>
    </HorarioFiltersCard>
  );
}
