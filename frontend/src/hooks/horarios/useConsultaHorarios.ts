import { useEffect, useMemo, useState } from 'react';
import { db } from '../../services/database';
import type { HorarioConsulta } from '../../models/horarios/horario.model';

export const PERIODO_FIJO = '2025-1';

const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

type HorarioExtendido = {
  id?: string;
  diaSemana?: string;
  dia_semana?: string;
  horaInicio?: string;
  hora_inicio?: string;
  horaFin?: string;
  hora_fin?: string;
  asignatura?: string;
  docente?: string;
  grupo?: string;
  programa?: string;
  espacioNombre?: string;
  espacio?: string;
};

const normalizeDia = (value: string): string => {
  const lower = value.toLowerCase();
  if (lower.includes('lun')) return 'Lunes';
  if (lower.includes('mar')) return 'Martes';
  if (lower.includes('mi')) return 'Miércoles';
  if (lower.includes('jue')) return 'Jueves';
  if (lower.includes('vie')) return 'Viernes';
  if (lower.includes('sab') || lower.includes('sáb')) return 'Sábado';
  return value;
};

export function useConsultaHorarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocente, setFilterDocente] = useState('todos');
  const [filterPrograma, setFilterPrograma] = useState('todos');
  const [filterFacultad, setFilterFacultad] = useState('todos');
  const [filterEspacio, setFilterEspacio] = useState('todos');
  const [horarios, setHorarios] = useState<HorarioConsulta[]>([]);

  useEffect(() => {
    const raw = db.getHorariosExtendidos() as HorarioExtendido[];
    const mapped: HorarioConsulta[] = raw.map((h, idx) => ({
      id: h.id || `h-${idx}`,
      dia: normalizeDia(h.diaSemana || h.dia_semana || ''),
      horaInicio: (h.horaInicio || h.hora_inicio || '').slice(0, 5),
      horaFin: (h.horaFin || h.hora_fin || '').slice(0, 5),
      asignatura: h.asignatura || 'Sin asignatura',
      docente: h.docente || 'Sin docente',
      grupo: h.grupo || 'Sin grupo',
      programa: h.programa || 'Sin programa',
      facultad: 'Sin facultad',
      espacio: h.espacioNombre || h.espacio || 'Sin espacio',
    }));
    setHorarios(mapped);
  }, []);

  const docentes = useMemo(
    () => ['todos', ...Array.from(new Set(horarios.map((h) => h.docente).filter(Boolean)))],
    [horarios],
  );
  const programas = useMemo(
    () => ['todos', ...Array.from(new Set(horarios.map((h) => h.programa).filter(Boolean)))],
    [horarios],
  );
  const facultades = useMemo(
    () => ['todos', ...Array.from(new Set(horarios.map((h) => h.facultad).filter(Boolean)))],
    [horarios],
  );
  const espacios = useMemo(
    () => ['todos', ...Array.from(new Set(horarios.map((h) => h.espacio).filter(Boolean)))],
    [horarios],
  );

  const filteredHorarios = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return horarios.filter((h) => {
      const matchSearch =
        !term ||
        h.asignatura.toLowerCase().includes(term) ||
        h.docente.toLowerCase().includes(term) ||
        h.grupo.toLowerCase().includes(term) ||
        h.espacio.toLowerCase().includes(term);
      const matchDocente = filterDocente === 'todos' || h.docente === filterDocente;
      const matchPrograma = filterPrograma === 'todos' || h.programa === filterPrograma;
      const matchFacultad = filterFacultad === 'todos' || h.facultad === filterFacultad;
      const matchEspacio = filterEspacio === 'todos' || h.espacio === filterEspacio;
      return matchSearch && matchDocente && matchPrograma && matchFacultad && matchEspacio;
    });
  }, [horarios, searchTerm, filterDocente, filterPrograma, filterFacultad, filterEspacio]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDocente('todos');
    setFilterPrograma('todos');
    setFilterFacultad('todos');
    setFilterEspacio('todos');
  };

  return {
    searchTerm,
    setSearchTerm,
    filterDocente,
    setFilterDocente,
    filterPrograma,
    setFilterPrograma,
    filterFacultad,
    setFilterFacultad,
    filterEspacio,
    setFilterEspacio,
    PERIODO_FIJO,
    horarios,
    docentes,
    programas,
    facultades,
    espacios,
    filteredHorarios,
    dias,
    clearFilters,
  };
}
