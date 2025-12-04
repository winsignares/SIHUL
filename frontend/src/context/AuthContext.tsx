import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/users/authService';
import type { LoginPayload, LoginResponse, AuthState } from '../models/auth/auth.model';

interface AuthContextType extends AuthState {
    login: (payload: LoginPayload) => Promise<void>;
    logout: () => void;
    hasPermission: (componentCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        token: localStorage.getItem('auth_token'),
        user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
        role: JSON.parse(localStorage.getItem('auth_role') || 'null'),
        components: JSON.parse(localStorage.getItem('auth_components') || '[]'),
        faculties: JSON.parse(localStorage.getItem('auth_faculties') || 'null') || undefined,
        areas: JSON.parse(localStorage.getItem('auth_areas') || 'null') || undefined,
        isAuthenticated: !!localStorage.getItem('auth_token'),
        isLoading: false,
    });

    const login = async (payload: LoginPayload) => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // Limpiar cache de sesiones anteriores antes de hacer login
            const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
            cacheKeys.forEach(key => localStorage.removeItem(key));

            const response: LoginResponse = await authService.login(payload);

            // Construir objeto usuario
            const user = {
                id: response.id,
                nombre: response.nombre,
                correo: response.correo,
                rol: response.rol,
                facultad: response.facultad
            };

            // Guardar en localStorage
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('auth_user', JSON.stringify(user));
            localStorage.setItem('auth_role', JSON.stringify(response.rol));
            localStorage.setItem('auth_components', JSON.stringify(response.componentes));

            if (response.facultad) {
                localStorage.setItem('auth_faculties', JSON.stringify([response.facultad]));
            }

            if (response.espacios_permitidos) {
                localStorage.setItem('auth_areas', JSON.stringify(response.espacios_permitidos));
            }

            // Actualizar estado
            setState({
                token: response.token,
                user: user,
                role: response.rol,
                components: response.componentes,
                faculties: response.facultad ? [response.facultad] : undefined,
                areas: response.espacios_permitidos,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            setState(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    };

    const logout = () => {
        // Llamar al service (por si hay endpoint de logout en backend)
        authService.logout().catch(console.error);

        // Limpiar TODO el localStorage (incluye auth y cache)
        localStorage.clear();

        // Limpiar estado
        setState({
            token: null,
            user: null,
            role: null,
            components: [],
            faculties: undefined,
            areas: undefined,
            isAuthenticated: false,
            isLoading: false,
        });
    };

    const hasPermission = (componentName: string): boolean => {
        return state.components.some(c => c.nombre === componentName);
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
