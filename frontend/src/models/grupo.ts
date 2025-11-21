export interface Grupo {
  id: number;
  nombre: string;
  programa_id: number;
  semestre: number;
  jornada: 'diurna' | 'nocturna' | 'mixta';
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGrupoDto {
  nombre: string;
  programa_id: number;
  semestre: number;
  jornada: 'diurna' | 'nocturna' | 'mixta';
  activo?: boolean;
}

export interface UpdateGrupoDto {
  id: number;
  nombre?: string;
  programa_id?: number;
  semestre?: number;
  jornada?: 'diurna' | 'nocturna' | 'mixta';
  activo?: boolean;
}

export interface GruposResponse {
  grupos: Grupo[];
}

export interface GrupoResponse {
  grupo: Grupo;
}
