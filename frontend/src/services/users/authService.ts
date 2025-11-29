import { apiClient } from '../../core/apiClient';

// Interfaces
export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface Usuario {
  id?: number;
  nombre: string;
  correo: string;
  contrasena?: string;
  rol_id?: number | null;
  facultad_id?: number | null;
  activo: boolean;
  rol?: Rol;
  facultad?: {
    id: number;
    nombre: string;
  } | null;
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
  } | null;
  facultad: {
    id: number;
    nombre: string;
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

/**
 * Servicio de autenticación y gestión de usuarios
 */
export const authService = {
  /**
   * Inicia sesión con el backend
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/usuarios/login/', payload, {
      requiresAuth: false
    });
  },

  /**
   * Cierra la sesión del usuario
   */
  logout: async (): Promise<{ message: string }> => {
    return apiClient.get('/usuarios/logout/');
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
    return apiClient.get('/usuarios/me/');
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
    return apiClient.get('/usuarios/list/');
  },

  /**
   * Obtiene un usuario por su ID
   */
  obtenerUsuario: async (id: number): Promise<Usuario> => {
    return apiClient.get(`/usuarios/${id}/`);
  },

  /**
   * Crea un nuevo usuario
   */
  crearUsuario: async (usuario: Omit<Usuario, 'id'>): Promise<{ message: string; id: number }> => {
    return apiClient.post('/usuarios/', {
      nombre: usuario.nombre,
      correo: usuario.correo,
      contrasena: usuario.contrasena,
      rol_id: usuario.rol_id,
      facultad_id: usuario.facultad_id,
      activo: usuario.activo ?? true
    });
  },

  /**
   * Actualiza un usuario existente
   */
  actualizarUsuario: async (usuario: Usuario): Promise<{ message: string; id: number }> => {
    if (!usuario.id) {
      throw new Error('Se requiere el ID del usuario para actualizar');
    }

    return apiClient.put('/usuarios/update/', {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol_id: usuario.rol_id,
      facultad_id: usuario.facultad_id,
      activo: usuario.activo
    });
  },

  /**
   * Elimina un usuario
   */
  eliminarUsuario: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete('/usuarios/delete/', { id });
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
    return apiClient.get('/usuarios/roles/list/');
  },

  /**
   * Obtiene un rol por su ID
   */
  obtenerRol: async (id: number): Promise<Rol> => {
    return apiClient.get(`/usuarios/roles/${id}/`);
  },

  /**
   * Crea un nuevo rol
   */
  crearRol: async (rol: Omit<Rol, 'id'>): Promise<{ message: string; id: number }> => {
    return apiClient.post('/usuarios/roles/', {
      nombre: rol.nombre,
      descripcion: rol.descripcion
    });
  },

  /**
   * Actualiza un rol existente
   */
  actualizarRol: async (rol: Rol): Promise<{ message: string; id: number }> => {
    if (!rol.id) {
      throw new Error('Se requiere el ID del rol para actualizar');
    }

    return apiClient.put('/usuarios/roles/update/', {
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion
    });
  },

  /**
   * Elimina un rol
   */
  eliminarRol: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete('/usuarios/roles/delete/', { id });
  }
};