import { apiClient } from '../../core/apiClient';

export interface HorarioAsignacion {
  id: number;
  grupo_id: number | null;
  grupo_nombre: string;
  programa_id: number | null;
  programa_nombre: string;
  semestre: number | null;
  asignatura_id: number | null;
  asignatura_nombre: string;
  docente_id: number | null;
  docente_nombre: string;
  espacio_id: number | null;
  espacio_nombre: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  cantidad_estudiantes: number | null;
  estado?: string;
  sede_id?: number | null;
  sede_nombre?: string | null;
  seccional_id?: number | null;
  seccional_nombre?: string | null;
  periodo_id?: number | null;
}

export interface EspacioDisponible {
  id: number;
  nombre: string;
  tipo: string;
  capacidad: number;
  sede_id?: number | null;
  sede_nombre?: string | null;
  sede_seccional_id?: number | null;
  sede_seccional_ciudad?: string | null;
  ubicacion?: string | null;
  estado?: string;
  esta_abierto?: boolean;
}

export interface HorarioSinEspacioFilters {
  seccionalId?: number | null;
  programaId?: number | null;
  grupoId?: number | null;
  docenteId?: number | null;
  asignaturaId?: number | null;
  periodoId?: number | null;
  diaSemana?: string | null;
  soloSinEspacio?: boolean;
  estado?: string | null;
}

export interface EspaciosDisponiblesParams {
  seccionalId?: number | null;
  dia: string;
  horaInicio: string;
  horaFin: string;
  horarioId?: number | null;
}

export interface AsignarEspacioPayload {
  horarioId: number;
  espacioId: number;
}

const buildHorariosQuery = (filters: HorarioSinEspacioFilters): string => {
  const params = new URLSearchParams();

  if (filters.seccionalId) params.set('seccional_id', String(filters.seccionalId));
  if (filters.programaId) params.set('programa_id', String(filters.programaId));
  if (filters.grupoId) params.set('grupo_id', String(filters.grupoId));
  if (filters.docenteId) params.set('docente_id', String(filters.docenteId));
  if (filters.asignaturaId) params.set('asignatura_id', String(filters.asignaturaId));
  if (filters.periodoId) params.set('periodo_id', String(filters.periodoId));
  if (filters.diaSemana) params.set('dia_semana', filters.diaSemana);
  if (filters.estado) params.set('estado', filters.estado);

  if (filters.soloSinEspacio === false) {
    params.set('solo_sin_espacio', '0');
  }

  return params.toString();
};

export const asignacionEspaciosService = {
  getHorariosSinEspacio: async (
    filters: HorarioSinEspacioFilters = {}
  ): Promise<{ horarios: HorarioAsignacion[] }> => {
    const query = buildHorariosQuery(filters);
    const endpoint = query ? `/horarios/sin-espacio/?${query}` : '/horarios/sin-espacio/';
    return apiClient.get<{ horarios: HorarioAsignacion[] }>(endpoint);
  },

  getEspaciosDisponiblesPorHorario: async (
    params: EspaciosDisponiblesParams
  ): Promise<{ espacios: EspacioDisponible[] }> => {
    const query = new URLSearchParams();
    if (params.seccionalId) query.set('seccional_id', String(params.seccionalId));
    if (params.horarioId) query.set('horario_id', String(params.horarioId));
    query.set('dia_semana', params.dia);
    query.set('hora_inicio', params.horaInicio);
    query.set('hora_fin', params.horaFin);

    const endpoint = `/espacios/disponibles/por-horario/?${query.toString()}`;
    return apiClient.get<{ espacios: EspacioDisponible[] }>(endpoint);
  },

  asignarEspacioHorario: async (payload: AsignarEspacioPayload): Promise<{ message: string; horario_id: number; espacio_id: number; espacio_nombre?: string }> => {
    return apiClient.post('/horarios/asignar-espacio/', {
      horario_id: payload.horarioId,
      espacio_id: payload.espacioId,
    });
  },

  actualizarEspacioHorario: async (payload: AsignarEspacioPayload): Promise<{ message: string; horario_id: number; espacio_id: number; espacio_nombre?: string }> => {
    return asignacionEspaciosService.asignarEspacioHorario(payload);
  },
};
