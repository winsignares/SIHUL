export interface Facultad {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFacultadDto {
  nombre: string;
  codigo?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateFacultadDto {
  id: number;
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface FacultadesResponse {
  facultades: Facultad[];
  total: number;
}

export interface FacultadResponse {
  facultad: Facultad;
}
