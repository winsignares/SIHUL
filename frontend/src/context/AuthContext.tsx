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
            const response: LoginResponse = await authService.login(payload);

            // Guardar en localStorage
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('auth_user', JSON.stringify(response.user));
            localStorage.setItem('auth_role', JSON.stringify(response.role));
            localStorage.setItem('auth_components', JSON.stringify(response.components));

            if (response.faculties) {
                localStorage.setItem('auth_faculties', JSON.stringify(response.faculties));
            }

            if (response.areas) {
                localStorage.setItem('auth_areas', JSON.stringify(response.areas));
            }

            // Actualizar estado
            setState({
                token: response.token,
                user: response.user,
                role: response.role,
                components: response.components,
                faculties: response.faculties,
                areas: response.areas,
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

        // Limpiar localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_role');
        localStorage.removeItem('auth_components');
        localStorage.removeItem('auth_faculties');
        localStorage.removeItem('auth_areas');

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

    const hasPermission = (componentCode: string): boolean => {
        return state.components.some(c => c.code === componentCode);
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
