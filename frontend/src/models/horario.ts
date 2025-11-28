export interface Horario {
  id: number;
  asignatura_id: number;
  espacio_id: number;
  profesor_id: number;
  grupo_id: number;
  dia_semana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
  hora_inicio: string;
  hora_fin: string;
  periodo_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateHorarioDto {
  asignatura_id: number;
  espacio_id: number;
  profesor_id: number;
  grupo_id: number;
  dia_semana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
  hora_inicio: string;
  hora_fin: string;
  periodo_id: number;
}

export interface UpdateHorarioDto {
  id: number;
  asignatura_id?: number;
  espacio_id?: number;
  profesor_id?: number;
  grupo_id?: number;
  dia_semana?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
  hora_inicio?: string;
  hora_fin?: string;
  periodo_id?: number;
}

export interface HorariosResponse {
  horarios: Horario[];
  total: number;
}

export interface HorarioResponse {
  horario: Horario;
}
