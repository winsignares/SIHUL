import { apiClient } from '../../core/apiClient';
import { tokenManager } from '../../core/tokenManager';
import { ENDPOINTS } from '../../core/endpoints';
import type { LoginCredentials, LoginResponse, Usuario } from '../../models/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // Backend espera: { correo: string, contrasena: string }
    // Backend retorna: { message: string, id: number, nombre: string, rol: string|null }
    const response = await apiClient.post<any>(
      ENDPOINTS.USUARIOS.LOGIN,
      credentials,
      { requiresAuth: false }
    );
    
    // Guardamos la información del usuario
    if (response.id) {
      // Crear un token simulado con los datos del usuario
      const userData = {
        id: response.id,
        nombre: response.nombre,
        correo: credentials.correo,
        rol: response.rol || null,
        // Estos campos deberían venir del backend en el futuro
        permisos: response.permisos || [],
        areas: response.areas || [],
      };
      
      const fakeToken = btoa(JSON.stringify(userData));
      tokenManager.setToken(fakeToken);
    }
    
    return {
      access: response.id?.toString() || '',
      refresh: '',
      usuario: {
        id: response.id,
        nombre: response.nombre,
        apellido: '',
        correo: credentials.correo,
        rol: response.rol || 'estudiante',
        activo: true,
        permisos: response.permisos || [],
        areas: response.areas || [],
      },
      message: response.message,
      permisos: response.permisos || [],
      areas: response.areas || [],
    };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.USUARIOS.LOGOUT);
    } finally {
      tokenManager.clearToken();
    }
  },

  async getCurrentUser(): Promise<Usuario> {
    const token = tokenManager.getToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    try {
      const userData = JSON.parse(atob(token));
      return {
        id: userData.id,
        nombre: userData.nombre,
        apellido: '',
        correo: userData.correo || '',
        rol: userData.rol,
        activo: true,
        permisos: userData.permisos || [],
        areas: userData.areas || [],
      };
    } catch (error) {
      tokenManager.clearToken();
      throw new Error('Sesión inválida');
    }
  },

  getUserData(): any {
    const token = tokenManager.getToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  },

  getPermisos(): string[] {
    const userData = this.getUserData();
    return userData?.permisos || [];
  },

  getAreas(): string[] {
    const userData = this.getUserData();
    return userData?.areas || [];
  },

  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  },

  getUserRole(): string | null {
    const token = tokenManager.getToken();
    if (!token) return null;

    try {
      const userData = JSON.parse(atob(token));
      return userData.rol || null;
    } catch {
      return null;
    }
  },
};

