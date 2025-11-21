export interface Asignatura {
  id: number;
  codigo: string;
  nombre: string;
  programa_id: number;
  semestre: number;
  creditos: number;
  horas_semana: number;
  tipo: 'obligatoria' | 'electiva';
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAsignaturaDto {
  codigo: string;
  nombre: string;
  programa_id: number;
  semestre: number;
  creditos: number;
  horas_semana: number;
  tipo: 'obligatoria' | 'electiva';
  activo?: boolean;
}

export interface UpdateAsignaturaDto {
  id: number;
  codigo?: string;
  nombre?: string;
  programa_id?: number;
  semestre?: number;
  creditos?: number;
  horas_semana?: number;
  tipo?: 'obligatoria' | 'electiva';
  activo?: boolean;
}

export interface AsignaturasResponse {
  asignaturas: Asignatura[];
}

export interface AsignaturaResponse {
  asignatura: Asignatura;
}
