import { Badge } from '../../share/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { SearchableSelect } from '../../share/searchableSelect';
import { HorarioFiltersCard, FilterField } from '../../share/horarioFiltersCard';
import { Clock, List, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface FacultadFiltro {
  id?: number;
  nombre: string;
}

interface ProgramaFiltro {
  id?: number;
  nombre: string;
}

interface DocenteFiltro {
  id: number;
  nombre: string;
  correo: string;
}

interface EspacioFiltro {
  id?: number;
  nombre: string;
  capacidad: number;
}

interface HorarioFusionadoExtendido {
  id: number;
  grupo1_id: number;
  grupo2_id: number;
  grupo3_id: number | null;
  grupo1_nombre: string;
  grupo2_nombre: string;
  grupo3_nombre: string | null;
  periodo_id: number | null;
  periodo_nombre: string | null;
  asignatura_id: number;
  asignatura_nombre: string;
  docente_id: number | null;
  docente_nombre: string;
  espacio_id: number;
  espacio_nombre: string;
  dia_semana: string;
  hora_inicio: string; 
  hora_fin: string;
  cantidad_estudiantes: number | null;
}

interface HorariosFusionadosProps {
  horariosFusionados: HorarioFusionadoExtendido[];
  loading: boolean;
  facultades: FacultadFiltro[];
  filtroFusionadoFacultad: string;
  setFiltroFusionadoFacultad: (value: string) => void;
  filtroFusionadoPrograma: string;
  setFiltroFusionadoPrograma: (value: string) => void;
  filtroFusionadoGrupo: string;
  setFiltroFusionadoGrupo: (value: string) => void;
  filtroFusionadoSemestre: string;
  setFiltroFusionadoSemestre: (value: string) => void;
  filtroFusionadoDia: string;
  setFiltroFusionadoDia: (value: string) => void;
  filtroFusionadoAsignatura: string;
  setFiltroFusionadoAsignatura: (value: string) => void;
  filtroFusionadoDocente: string;
  setFiltroFusionadoDocente: (value: string) => void;
  filtroFusionadoEspacio: string;
  setFiltroFusionadoEspacio: (value: string) => void;
  filtroFusionadoPeriodo: string;
  setFiltroFusionadoPeriodo: (value: string) => void;
  diasFusionadosUnicos: string[];
  asignaturasFusionadasUnicas: string[];
  programasFusionadosFiltrados: ProgramaFiltro[];
  gruposFusionadosUnicos: string[];
  semestresFusionadosUnicos: number[];
  docentesFusionadosDisponibles: DocenteFiltro[];
  espaciosFusionadosDisponibles: EspacioFiltro[];
  periodosFusionadosDisponibles: Array<{ id?: number; nombre: string }>;
  limpiarFiltrosFusionados: () => void;
}

export default function HorariosFusionados({ 
  horariosFusionados, 
  loading,
  facultades,
  filtroFusionadoFacultad,
  setFiltroFusionadoFacultad,
  filtroFusionadoPrograma,
  setFiltroFusionadoPrograma,
  filtroFusionadoGrupo,
  setFiltroFusionadoGrupo,
  filtroFusionadoSemestre,
  setFiltroFusionadoSemestre,
  filtroFusionadoDia,
  setFiltroFusionadoDia,
  filtroFusionadoAsignatura,
  setFiltroFusionadoAsignatura,
  filtroFusionadoDocente,
  setFiltroFusionadoDocente,
  filtroFusionadoEspacio,
  setFiltroFusionadoEspacio,
  filtroFusionadoPeriodo,
  setFiltroFusionadoPeriodo,
  diasFusionadosUnicos,
  asignaturasFusionadasUnicas,
  programasFusionadosFiltrados,
  gruposFusionadosUnicos,
  semestresFusionadosUnicos,
  docentesFusionadosDisponibles,
  espaciosFusionadosDisponibles,
  periodosFusionadosDisponibles,
  limpiarFiltrosFusionados
}: HorariosFusionadosProps) {
  return (
    <>
      {/* Card de Filtros */}
      <div className="mb-4">
      <HorarioFiltersCard
        activeCount={[
          filtroFusionadoFacultad, filtroFusionadoPrograma, filtroFusionadoGrupo,
          filtroFusionadoSemestre, filtroFusionadoPeriodo, filtroFusionadoDia,
          filtroFusionadoAsignatura, filtroFusionadoDocente, filtroFusionadoEspacio
        ].filter(v => v && v !== 'all').length}
        onClear={limpiarFiltrosFusionados}
        accentClassName="text-red-600"
      >
        <FilterField label="Facultad">
          <SearchableSelect
            items={[
              { id: 'all', nombre: 'Todas las facultades' },
              ...facultades.map(f => ({
                id: (f.id ?? '').toString(),
                nombre: f.nombre
              }))
            ]}
            value={filtroFusionadoFacultad}
            onSelect={(item) => setFiltroFusionadoFacultad(item.id)}
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
              ...programasFusionadosFiltrados.map(p => ({
                id: (p.id ?? '').toString(),
                nombre: p.nombre
              }))
            ]}
            value={filtroFusionadoPrograma}
            onSelect={(item) => setFiltroFusionadoPrograma(item.id)}
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
              ...gruposFusionadosUnicos.map(g => ({
                id: g,
                nombre: g
              }))
            ]}
            value={filtroFusionadoGrupo}
            onSelect={(item) => setFiltroFusionadoGrupo(item.id)}
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
              ...semestresFusionadosUnicos.map(s => ({
                id: s.toString(),
                nombre: `Semestre ${s}`
              }))
            ]}
            value={filtroFusionadoSemestre}
            onSelect={(item) => setFiltroFusionadoSemestre(item.id)}
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
              ...periodosFusionadosDisponibles.map(periodo => ({
                id: periodo.id?.toString() || '',
                nombre: periodo.nombre
              }))
            ]}
            value={filtroFusionadoPeriodo}
            onSelect={(item) => setFiltroFusionadoPeriodo(item.id)}
            getItemId={(item) => item.id}
            getItemLabel={(item) => item.nombre}
            placeholder="Seleccionar periodo..."
            searchPlaceholder="Buscar periodo..."
            emptyMessage="No se encontró ningún periodo"
          />
        </FilterField>

        <FilterField label="Día de la semana">
          <SearchableSelect
            items={[
              { id: 'all', nombre: 'Todos los días' },
              ...diasFusionadosUnicos.map(dia => ({
                id: dia,
                nombre: dia.charAt(0).toUpperCase() + dia.slice(1)
              }))
            ]}
            value={filtroFusionadoDia}
            onSelect={(item) => setFiltroFusionadoDia(item.id)}
            getItemId={(item) => item.id}
            getItemLabel={(item) => item.nombre}
            placeholder="Seleccionar día..."
            searchPlaceholder="Buscar día..."
            emptyMessage="No se encontró ningún día"
          />
        </FilterField>

        <FilterField label="Asignatura">
          <SearchableSelect
            items={[
              { id: 'all', nombre: 'Todas las asignaturas' },
              ...asignaturasFusionadasUnicas.map(asignatura => ({
                id: asignatura,
                nombre: asignatura
              }))
            ]}
            value={filtroFusionadoAsignatura}
            onSelect={(item) => setFiltroFusionadoAsignatura(item.id)}
            getItemId={(item) => item.id}
            getItemLabel={(item) => item.nombre}
            placeholder="Seleccionar asignatura..."
            searchPlaceholder="Buscar asignatura..."
            emptyMessage="No se encontró ninguna asignatura"
          />
        </FilterField>

        <FilterField label="Docente">
          <SearchableSelect
            items={[
              { id: 'all', nombre: 'Todos los docentes', correo: '' },
              ...(horariosFusionados.some(h => h.docente_id == null) ? [{ id: 'sin-asignar', nombre: 'Sin asignar', correo: '' }] : []),
              ...docentesFusionadosDisponibles.map(docente => ({
                id: docente.id.toString(),
                nombre: docente.nombre,
                correo: docente.correo
              }))
            ]}
            value={filtroFusionadoDocente}
            onSelect={(item) => setFiltroFusionadoDocente(item.id)}
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
              ...(horariosFusionados.some(h => h.espacio_id == null) ? [{ id: 'sin-espacio', nombre: 'Sin espacio', capacidad: undefined }] : []),
              ...espaciosFusionadosDisponibles.map(espacio => ({
                id: (espacio.id ?? '').toString(),
                nombre: espacio.nombre,
                capacidad: espacio.capacidad
              }))
            ]}
            value={filtroFusionadoEspacio}
            onSelect={(item) => setFiltroFusionadoEspacio(item.id)}
            getItemId={(item) => item.id}
            getItemLabel={(item) => item.nombre}
            getItemSecondary={(item) => item.capacidad ? `Capacidad: ${item.capacidad}` : ''}
            placeholder="Seleccionar espacio..."
            searchPlaceholder="Buscar espacio..."
            emptyMessage="No se encontró ningún espacio"
          />
        </FilterField>
      </HorarioFiltersCard>
      </div>

      {/* Card de Resultados */}
      <Card className="border-slate-200 shadow-xl overflow-hidden bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="bg-gradient-to-r from-red-600 to-yellow-500 text-white pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <List className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Horarios Fusionados</CardTitle>
              <p className="text-white/90 text-sm mt-1">
                Clases compartidas por múltiples grupos
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
            {horariosFusionados.length} fusionados
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : horariosFusionados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <List className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">No hay horarios fusionados registrados</p>
            <p className="text-slate-400 text-sm mt-2">
              Los horarios fusionados se crean automáticamente cuando varios grupos comparten una clase
            </p>
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-200 border-b-2 border-slate-300">
                  <th className="px-4 py-3 text-left text-slate-900 font-semibold">Grupos</th>
                  <th className="px-4 py-3 text-left text-slate-900 font-semibold">Asignatura</th>
                  <th className="px-4 py-3 text-left text-slate-900 font-semibold">Docente</th>
                  <th className="px-4 py-3 text-center text-slate-900 font-semibold">Día</th>
                  <th className="px-4 py-3 text-center text-slate-900 font-semibold">Horario</th>
                  <th className="px-4 py-3 text-center text-slate-900 font-semibold">Espacio</th>
                  <th className="px-4 py-3 text-center text-slate-900 font-semibold">Estudiantes</th>
                </tr>
              </thead>
              <tbody>
                {horariosFusionados.map((fusionado, idx) => (
                  <motion.tr
                    key={fusionado.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-slate-200 hover:bg-gradient-to-r hover:from-red-50 hover:to-yellow-50 transition-all duration-200"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                          {fusionado.grupo1_nombre}
                        </Badge>
                        <Badge className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white">
                          {fusionado.grupo2_nombre}
                        </Badge>
                        {fusionado.grupo3_nombre && (
                          <Badge className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
                            {fusionado.grupo3_nombre}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-600"></div>
                        <span className="text-slate-900 font-medium">{fusionado.asignatura_nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{fusionado.docente_nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className="border-red-600 text-red-700 font-medium">
                        {fusionado.dia_semana.charAt(0).toUpperCase() + fusionado.dia_semana.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-700">
                        <Clock className="w-4 h-4 text-red-600" />
                        <span className="font-medium">{fusionado.hora_inicio}</span>
                        <span className="text-slate-400">-</span>
                        <span className="font-medium">{fusionado.hora_fin}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-700">
                        <MapPin className="w-4 h-4 text-yellow-600" />
                        <span>{fusionado.espacio_nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-900 font-semibold">
                        {fusionado.cantidad_estudiantes}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
