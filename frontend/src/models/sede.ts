export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSedeDto {
  nombre: string;
  direccion: string;
  ciudad: string;
  activo?: boolean;
}

export interface UpdateSedeDto {
  id: number;
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  activo?: boolean;
}

export interface SedesResponse {
  sedes: Sede[];
}

export interface SedeResponse {
  sede: Sede;
}
