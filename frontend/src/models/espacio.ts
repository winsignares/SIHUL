export interface Espacio {
  id: number;
  nombre: string;
  codigo: string;
  tipo: 'aula' | 'laboratorio' | 'auditorio' | 'sala';
  capacidad: number;
  sede_id: number;
  edificio?: string;
  piso?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEspacioDto {
  nombre: string;
  codigo: string;
  tipo: 'aula' | 'laboratorio' | 'auditorio' | 'sala';
  capacidad: number;
  sede_id: number;
  edificio?: string;
  piso?: string;
}

export interface UpdateEspacioDto {
  id: number;
  nombre?: string;
  codigo?: string;
  tipo?: 'aula' | 'laboratorio' | 'auditorio' | 'sala';
  capacidad?: number;
  sede_id?: number;
  edificio?: string;
  piso?: string;
  activo?: boolean;
}

export interface EspaciosResponse {
  espacios: Espacio[];
  total: number;
}

export interface EspacioResponse {
  espacio: Espacio;
}
