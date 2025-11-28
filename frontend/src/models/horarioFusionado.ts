// Modelo según el backend
export interface HorarioFusionado {
  id: number;
  grupo1_id: number;
  grupo2_id: number;
  grupo3_id: number | null;
  asignatura_id: number;
  docente_id: number | null;
  espacio_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  cantidad_estudiantes: number | null;
  comentario: string;
}

export interface CreateHorarioFusionadoDto {
  grupo1_id: number;
  grupo2_id: number;
  grupo3_id?: number;
  asignatura_id: number;
  espacio_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  docente_id?: number;
  cantidad_estudiantes?: number;
  comentario?: string;
}

export interface UpdateHorarioFusionadoDto {
  id: number;
  grupo1_id?: number;
  grupo2_id?: number;
  grupo3_id?: number;
  asignatura_id?: number;
  espacio_id?: number;
  dia_semana?: string;
  hora_inicio?: string;
  hora_fin?: string;
  docente_id?: number;
  cantidad_estudiantes?: number;
  comentario?: string;
}

export interface HorariosFusionadosResponse {
  horarios_fusionados: HorarioFusionado[];
}

export interface HorarioFusionadoResponse {
  horario_fusionado: HorarioFusionado;
}
