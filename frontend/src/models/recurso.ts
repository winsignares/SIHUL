export interface Recurso {
  id: number;
  nombre: string;
  tipo: string;
  descripcion?: string;
  cantidad_disponible: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRecursoDto {
  nombre: string;
  tipo: string;
  descripcion?: string;
  cantidad_disponible: number;
  activo?: boolean;
}

export interface UpdateRecursoDto {
  id: number;
  nombre?: string;
  tipo?: string;
  descripcion?: string;
  cantidad_disponible?: number;
  activo?: boolean;
}

export interface EspacioRecurso {
  espacio_id: number;
  recurso_id: number;
  cantidad: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEspacioRecursoDto {
  espacio_id: number;
  recurso_id: number;
  cantidad: number;
}

export interface UpdateEspacioRecursoDto {
  espacio_id: number;
  recurso_id: number;
  cantidad?: number;
}

export interface RecursosResponse {
  recursos: Recurso[];
}

export interface RecursoResponse {
  recurso: Recurso;
}
