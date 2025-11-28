export interface Programa {
  id: number;
  codigo: string;
  nombre: string;
  facultad_id: number;
  numero_semestres: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProgramaDto {
  codigo: string;
  nombre: string;
  facultad_id: number;
  numero_semestres: number;
  activo?: boolean;
}

export interface UpdateProgramaDto {
  id: number;
  codigo?: string;
  nombre?: string;
  facultad_id?: number;
  numero_semestres?: number;
  activo?: boolean;
}

export interface ProgramasResponse {
  programas: Programa[];
}

export interface ProgramaResponse {
  programa: Programa;
}
