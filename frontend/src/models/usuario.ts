export interface Usuario {
  id: number;
  correo: string;
  nombre: string;
  apellido: string;
  rol: 'admin' | 'profesor' | 'estudiante' | 'audiovisual';
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUsuarioDto {
  correo: string;
  nombre: string;
  apellido: string;
  contrasena: string;
  rol: 'admin' | 'profesor' | 'estudiante' | 'audiovisual';
}

export interface UpdateUsuarioDto {
  id: number;
  correo?: string;
  nombre?: string;
  apellido?: string;
  contrasena?: string;
  rol?: 'admin' | 'profesor' | 'estudiante' | 'audiovisual';
  activo?: boolean;
}

export interface UsuariosResponse {
  usuarios: Usuario[];
  total: number;
}

export interface UsuarioResponse {
  usuario: Usuario;
}
