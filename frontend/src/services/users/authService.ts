import { apiClient } from '../../core/apiClient';
import type { LoginPayload, LoginResponse } from '../../models/auth/auth.model';

/**
 * Servicio de autenticación para comunicación con el backend
 */
export const authService = {
    /**
     * Inicia sesión con el backend
     */
    login: async (payload: LoginPayload): Promise<LoginResponse> => {
        return apiClient.post<LoginResponse>('/usuarios/login/', payload, {
            requiresAuth: false // El login no requiere token
        });
    },

    /**
     * Cierra sesión (opcional: llamar endpoint de logout en backend)
     */
    logout: async (): Promise<void> => {
        // Si el backend tiene un endpoint de logout, descomentarlo:
        // await apiClient.post('/auth/logout');

        // Por ahora solo limpiamos el localStorage (se hace en AuthContext)
        return Promise.resolve();
    }
};
