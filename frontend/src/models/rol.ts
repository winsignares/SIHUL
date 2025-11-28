// Modelo según el backend
export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface CreateRolDto {
  nombre: string;
  descripcion: string;
}

export interface UpdateRolDto {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface RolesResponse {
  roles: Rol[];
}

export interface RolResponse {
  rol: Rol;
}
