import { apiClient } from '../../core/apiClient';
import { resolveBackendBaseUrl } from '../../core/backendUrl';

const BACKEND_BASE_URL = resolveBackendBaseUrl(import.meta.env.VITE_API_URL);

// Interfaces
export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  supervisa_espacios?: boolean;
}

export interface Usuario {
  id?: number;
  nombre: string;
  correo: string;
  contrasena?: string;
  contrasena_hash?: string;
  rol_id?: number | null;
  facultad_id?: number | null;
  sede_id?: number | null;
  sede?: string | {
    id: number;
    nombre: string;
    ciudad?: string;
    seccional_id?: number | null;
    seccional_ciudad?: string | null;
    direccion?: string;
  } | null;
  activo: boolean;
  rol?: Rol;
  facultad?: {
    id: number;
    nombre: string;
  } | null;
  espacios_permitidos?: number[];
}

interface UsuarioApi {
  id?: number;
  nombre: string;
  correo: string;
  contrasena?: string;
  contrasena_hash?: string;
  rol?: number | Rol | null;
  rol_id?: number | null;
  facultad?: number | { id: number; nombre?: string } | null;
  facultad_id?: number | null;
  sede?: number | string | {
    id: number;
    nombre: string;
    ciudad?: string;
    seccional_id?: number | null;
    seccional_ciudad?: string | null;
    direccion?: string;
  } | null;
  sede_id?: number | null;
  activo: boolean;
  espacios_permitidos?: number[];
}

export interface CreateUsuarioPayload {
  nombre: string;
  correo: string;
  contrasena?: string;
  contrasena_hash?: string;
  rol_id?: number | null;
  facultad_id?: number | null;
  activo?: boolean;
  espacios_permitidos?: number[];
  sede?: string;
  // Compatibilidad con formularios existentes; backend usa "sede".
  sede_id?: number | null;
}

export interface UpdateUsuarioPayload {
  id: number;
  nombre?: string;
  correo?: string;
  contrasena?: string;
  contrasena_hash?: string;
  rol_id?: number | null;
  facultad_id?: number | null;
  activo?: boolean;
  espacios_permitidos?: number[];
}

export interface LoginPayload {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  message: string;
  id: number;
  nombre: string;
  correo: string;
  rol: {
    id: number;
    nombre: string;
    descripcion: string;
    supervisa_espacios?: boolean;
  } | null;
  facultad: {
    id: number;
    nombre: string;
  } | null;
  sede: {
    id: number;
    nombre: string;
    ciudad?: string;
    seccional_id?: number | null;
    seccional_ciudad?: string | null;
    direccion?: string;
  } | null;
  componentes: Array<{
    id: number;
    nombre: string;
    descripcion: string;
    permiso: string;
  }>;
  espacios_permitidos: Array<{
    id: number;
    tipo: string;
    capacidad: number;
    ubicacion: string;
    disponible: boolean;
    sede_id: number;
    sede_nombre: string;
  }>;
  token: string;
}

export interface ChangePasswordPayload {
  correo: string;
  old_contrasena: string;
  new_contrasena: string;
}

export interface SessionAuthStateResponse {
  changed: boolean;
  signature: string;
  rol?: {
    id: number;
    nombre: string;
    descripcion: string;
    supervisa_espacios?: boolean;
  } | null;
  componentes?: Array<{
    id: number;
    nombre: string;
    descripcion: string;
    permiso: string;
  }>;
}

export interface SessionUserAuthenticatedResponse {
  authenticated?: true;
  id: number;
  nombre: string;
  correo: string;
  rol: {
    id: number;
    nombre: string;
    descripcion: string;
    supervisa_espacios?: boolean;
  } | null;
  facultad: {
    id: number;
    nombre: string;
  } | null;
  sede: {
    id: number;
    nombre: string;
    seccional_id?: number | null;
    seccional_ciudad?: string | null;
    direccion?: string;
    ciudad?: string;
  } | null;
  componentes: Array<{
    id: number;
    nombre: string;
    descripcion: string;
    permiso: string;
  }>;
  espacios_permitidos: Array<{
    id: number;
    tipo: string;
    capacidad: number;
    ubicacion: string;
    disponible: boolean;
    sede_id: number;
    sede_nombre: string;
  }>;
  token: string;
  signature?: string;
}

export interface SessionUserUnauthenticatedResponse {
  authenticated: false;
}

export type SessionUserResponse = SessionUserAuthenticatedResponse | SessionUserUnauthenticatedResponse;

const resolveSedeId = (usuario: CreateUsuarioPayload): number | undefined => {
  if (usuario.sede_id !== null && usuario.sede_id !== undefined) {
    return usuario.sede_id;
  }

  if (typeof usuario.sede === 'string') {
    const parsed = Number(usuario.sede);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (typeof usuario.sede === 'object' && usuario.sede !== null) {
    return (usuario.sede as { id?: number }).id;
  }

  return undefined;
};

const toFrontendUsuario = (usuario: UsuarioApi): Usuario => {
  const rolId = usuario.rol_id ?? (typeof usuario.rol === 'number' ? usuario.rol : usuario.rol?.id ?? null);
  const facultadId = usuario.facultad_id ?? (typeof usuario.facultad === 'number' ? usuario.facultad : usuario.facultad?.id ?? null);
  const sedeId = usuario.sede_id ?? (
    typeof usuario.sede === 'number'
      ? usuario.sede
      : (typeof usuario.sede === 'object' && usuario.sede && 'id' in usuario.sede ? usuario.sede.id : null)
  );

  const rolObj = typeof usuario.rol === 'object' && usuario.rol !== null ? usuario.rol : undefined;
  const facultadObj =
    typeof usuario.facultad === 'object' && usuario.facultad !== null && 'id' in usuario.facultad
      ? { id: usuario.facultad.id, nombre: usuario.facultad.nombre || '' }
      : null;

  const sedeObj =
    typeof usuario.sede === 'object' && usuario.sede !== null && 'id' in usuario.sede
      ? usuario.sede
      : (typeof usuario.sede === 'string' ? usuario.sede : undefined);

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    contrasena: usuario.contrasena,
    contrasena_hash: usuario.contrasena_hash,
    rol_id: rolId,
    facultad_id: facultadId,
    sede_id: sedeId,
    sede: sedeObj,
    activo: usuario.activo,
    rol: rolObj,
    facultad: facultadObj,
    espacios_permitidos: usuario.espacios_permitidos,
  };
};

/**
 * Servicio de autenticación y gestión de usuarios
 */
export const authService = {
  getMicrosoftLoginUrl: (): string => {
    return `${BACKEND_BASE_URL}/accounts/microsoft/login/`;
  },

  /**
   * Inicia sesión con el backend
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/usuarios/login/', payload, {
      requiresAuth: false
    });

    // Compatibilidad: algunos consumidores del frontend aun leen `sede.ciudad` como alias de seccional.
    if (response?.sede && !response.sede.ciudad && response.sede.seccional_ciudad) {
      response.sede.ciudad = response.sede.seccional_ciudad;
    }

    return response;
  },

  /**
   * Cierra la sesión del usuario
   */
  logout: async (): Promise<{ message: string }> => {
    return apiClient.get('/auth/logout/');
  },

  /**
   * Obtiene el usuario autenticado desde la sesión backend (OAuth o login clásico).
   */
  getAuthenticatedUser: async (options?: { suppressErrorLog?: boolean }): Promise<SessionUserResponse> => {
    const response = await apiClient.get<SessionUserResponse>('/auth/user/', {
      requiresAuth: false,
      suppressErrorLog: options?.suppressErrorLog ?? false,
    });

    if (response?.sede && !response.sede.ciudad && response.sede.seccional_ciudad) {
      response.sede.ciudad = response.sede.seccional_ciudad;
    }

    return response;
  },

  /**
   * Cambia la contraseña del usuario
   */
  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    return apiClient.put('/usuarios/change-password/', payload);
  },

  /**
   * Obtiene el perfil del usuario actual
   */
  getProfile: async (): Promise<Usuario> => {
    const storedUser = localStorage.getItem('auth_user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const userId = parsedUser?.id;

    if (!userId) {
      throw new Error('No se encontró el ID del usuario autenticado');
    }

    return apiClient.get(`/usuarios/${userId}/`);
  },

  /**
   * Sincroniza rol y componentes de la sesión actual.
   * Si se envía la firma previa y no hay cambios, backend responde payload mínimo.
   */
  getSessionAuthState: async (since?: string, options?: { suppressErrorLog?: boolean }): Promise<SessionAuthStateResponse> => {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiClient.get<SessionAuthStateResponse>(`/usuarios/session-auth-state/${query}`, {
      suppressErrorLog: options?.suppressErrorLog ?? false,
    });
  }
};

/**
 * Servicio para la gestión de usuarios
 */
export const userService = {
  /**
   * Obtiene la lista de todos los usuarios
   */
  listarUsuarios: async (): Promise<{ usuarios: Usuario[] }> => {
    const response = await apiClient.get<UsuarioApi[] | { usuarios?: UsuarioApi[]; results?: UsuarioApi[] }>('/usuarios/');
    const usuariosRaw = Array.isArray(response)
      ? response
      : (response.usuarios ?? response.results ?? []);
    const usuarios = usuariosRaw.map(toFrontendUsuario);
    return { usuarios };
  },

  /**
   * Obtiene la lista de docentes activos
   */
  listarDocentes: async (): Promise<{ usuarios: Usuario[] }> => {
    const response = await apiClient.get<{ usuarios?: UsuarioApi[] } | UsuarioApi[]>('/usuarios/docentes/');
    const usuariosRaw = Array.isArray(response)
      ? response
      : (response.usuarios ?? []);
    const usuarios = usuariosRaw.map(toFrontendUsuario);
    return { usuarios };
  },

  /**
   * Obtiene un usuario por su ID
   */
  obtenerUsuario: async (id: number): Promise<Usuario> => {
    const usuario = await apiClient.get<UsuarioApi>(`/usuarios/${id}/`);
    return toFrontendUsuario(usuario);
  },

  /**
   * Crea un nuevo usuario
   */
  crearUsuario: async (usuario: CreateUsuarioPayload): Promise<{ message: string; id: number }> => {
    const sede = resolveSedeId(usuario);

    return apiClient.post('/usuarios/', {
      nombre: usuario.nombre,
      correo: usuario.correo,
      contrasena: usuario.contrasena,
      contrasena_hash: usuario.contrasena_hash,
      rol: usuario.rol_id,
      facultad: usuario.facultad_id,
      activo: usuario.activo ?? true,
      espacios_permitidos: usuario.espacios_permitidos,
      sede
    });
  },

  /**
   * Actualiza un usuario existente
   */
  actualizarUsuario: async (usuario: UpdateUsuarioPayload): Promise<{ message: string; id: number }> => {
    if (!usuario.id) {
      throw new Error('Se requiere el ID del usuario para actualizar');
    }

    const actualizado = await apiClient.patch<Usuario>(`/usuarios/${usuario.id}/`, {
      nombre: usuario.nombre,
      correo: usuario.correo,
      contrasena: usuario.contrasena,
      contrasena_hash: usuario.contrasena_hash,
      rol: usuario.rol_id,
      facultad: usuario.facultad_id,
      activo: usuario.activo,
      espacios_permitidos: usuario.espacios_permitidos
    });
    return { message: 'Usuario actualizado', id: actualizado.id ?? usuario.id };
  },

  /**
   * Elimina un usuario
   */
  eliminarUsuario: async (id: number): Promise<{ message: string }> => {
    await apiClient.delete(`/usuarios/${id}/`);
    return { message: 'Usuario eliminado' };
  }
};

/**
 * Servicio para la gestión de roles
 */
export const rolService = {
  /**
   * Obtiene la lista de todos los roles
   */
  listarRoles: async (): Promise<{ roles: Rol[] }> => {
    const roles = await apiClient.get<Rol[]>('/roles/');
    return { roles };
  },

  /**
   * Obtiene un rol por su ID
   */
  obtenerRol: async (id: number): Promise<Rol> => {
    return apiClient.get(`/roles/${id}/`);
  },

  /**
   * Crea un nuevo rol
   */
  crearRol: async (rol: Omit<Rol, 'id'>): Promise<{ message: string; id: number }> => {
    const creado = await apiClient.post<Rol>('/roles/', {
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      supervisa_espacios: rol.supervisa_espacios ?? false
    });
    return { message: 'Rol creado', id: creado.id ?? 0 };
  },

  /**
   * Actualiza un rol existente
   */
  actualizarRol: async (rol: Rol): Promise<{ message: string; id: number }> => {
    if (!rol.id) {
      throw new Error('Se requiere el ID del rol para actualizar');
    }

    const actualizado = await apiClient.put<Rol>(`/roles/${rol.id}/`, {
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      supervisa_espacios: rol.supervisa_espacios ?? false
    });
    return { message: 'Rol actualizado', id: actualizado.id ?? rol.id };
  },

  /**
   * Elimina un rol
   */
  eliminarRol: async (id: number): Promise<{ message: string }> => {
    await apiClient.delete(`/roles/${id}/`);
    return { message: 'Rol eliminado' };
  }
};
