export interface Periodo {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePeriodoDto {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo?: boolean;
}

export interface UpdatePeriodoDto {
  id: number;
  nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo?: boolean;
}

export interface PeriodosResponse {
  periodos: Periodo[];
}

export interface PeriodoResponse {
  periodo: Periodo;
}
