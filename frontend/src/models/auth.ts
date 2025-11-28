export interface LoginCredentials {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  usuario: Usuario;
  // Campos adicionales del backend
  message?: string;
  id?: number;
  nombre?: string;
  rol?: string;
  permisos?: string[];
  areas?: string[];
}

export interface Usuario {
  id: number;
  correo: string;
  nombre: string;
  apellido: string;
  rol: 'admin' | 'profesor' | 'estudiante' | 'audiovisual';
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  permisos?: string[];
  areas?: string[];
}

export interface AuthUser extends Usuario {
  token: string;
}
