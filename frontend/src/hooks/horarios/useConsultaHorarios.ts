import { useState, useEffect, useMemo } from 'react';
import { horarioService } from '../../services/horarios/horariosAPI';
import { periodoActivoService } from '../../services/periodos/periodoActivoAPI';
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';

const CACHE_KEY = 'consulta-horarios';

export interface Horario {
  id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  asignatura: string;
  docente: string;
  espacio: string;
  grupo: string;
  programa: string;
  facultad: string;
}

interface HorarioAPI {
  id?: number;
  dia_nombre?: string;
  dia?: string;
  hora_inicio?: string;
  hora_fin?: string;
  asignatura_nombre?: string;
  asignatura?: string;
  docente_nombre?: string;
  docente?: string;
  espacio_nombre?: string;
  espacio?: string;
  grupo?: string;
  programa_nombre?: string;
  programa?: string;
  facultad_nombre?: string;
  facultad?: string;
}

export function useConsultaHorarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocente, setFilterDocente] = useState('todos');
  const [filterPrograma, setFilterPrograma] = useState('todos');
  const [filterFacultad, setFilterFacultad] = useState('todos');
  const [filterEspacio, setFilterEspacio] = useState('todos');
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoActual, setPeriodoActual] = useState('Cargando...');

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  useEffect(() => {
    loadPeriodoActivo();
    loadHorarios();
  }, []);

  const loadPeriodoActivo = async () => {
    try {
      const periodo = await periodoActivoService.getPeriodoActivo();
      setPeriodoActual(periodo?.nombre || 'Sin periodo activo');
    } catch (error) {
      console.error('Error al cargar período activo:', error);
      setPeriodoActual('Sin periodo activo');
    }
  };

  const loadHorarios = async () => {
    const activeToken = localStorage.getItem('auth_token');

    // Check cache first
    const cached = getSessionCacheData<Horario[]>(CACHE_KEY, activeToken);
    if (cached) {
      setHorarios(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await horarioService.listExtendidos();
      const mappedHorarios: Horario[] = response.horarios.map((h: HorarioAPI) => ({
        id: h.id?.toString() || '',
        dia: h.dia_nombre || h.dia || '',
        horaInicio: h.hora_inicio || '',
        horaFin: h.hora_fin || '',
        asignatura: h.asignatura_nombre || h.asignatura || '',
        docente: h.docente_nombre || h.docente || '',
        espacio: h.espacio_nombre || h.espacio || '',
        grupo: h.grupo || '',
        programa: h.programa_nombre || h.programa || '',
        facultad: h.facultad_nombre || h.facultad || ''
      }));
      setHorarios(mappedHorarios);
      setSessionCacheData(CACHE_KEY, activeToken, mappedHorarios);
    } catch (error) {
      console.error('Error loading horarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const docentes = useMemo(() => {
    const docs = new Set(horarios.map(h => h.docente).filter(Boolean));
    return ['todos', ...Array.from(docs).sort()];
  }, [horarios]);

  const programas = useMemo(() => {
    const progs = new Set(horarios.map(h => h.programa).filter(Boolean));
    return ['todos', ...Array.from(progs).sort()];
  }, [horarios]);

  const facultades = useMemo(() => {
    const facs = new Set(horarios.map(h => h.facultad).filter(Boolean));
    return ['todos', ...Array.from(facs).sort()];
  }, [horarios]);

  const espacios = useMemo(() => {
    const esps = new Set(horarios.map(h => h.espacio).filter(Boolean));
    return ['todos', ...Array.from(esps).sort()];
  }, [horarios]);

  const filteredHorarios = useMemo(() => {
    return horarios.filter(h => {
      const matchesSearch = searchTerm === '' ||
        h.asignatura.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.docente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.espacio.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDocente = filterDocente === 'todos' || h.docente === filterDocente;
      const matchesPrograma = filterPrograma === 'todos' || h.programa === filterPrograma;
      const matchesFacultad = filterFacultad === 'todos' || h.facultad === filterFacultad;
      const matchesEspacio = filterEspacio === 'todos' || h.espacio === filterEspacio;

      return matchesSearch && matchesDocente && matchesPrograma && matchesFacultad && matchesEspacio;
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
    periodoActual,
    horarios,
    docentes,
    programas,
    facultades,
    espacios,
    filteredHorarios,
    dias,
    clearFilters,
    loading
  };
}
