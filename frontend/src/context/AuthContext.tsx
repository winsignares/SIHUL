import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { authService } from '../services/users/authService';
import type { LoginPayload, LoginResponse, AuthState } from '../models/auth/auth.model';

interface AuthContextType extends AuthState {
    login: (payload: LoginPayload) => Promise<LoginResponse>;
    logout: () => void;
    hasPermission: (componentCode: string) => boolean;
    hasEditPermission: (componentName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const authSignatureRef = useRef<string>(localStorage.getItem('auth_signature') || '');
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

    const login = async (payload: LoginPayload): Promise<LoginResponse> => {
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
                facultad: response.facultad,
                sede: response.sede
            };

            // Guardar en localStorage
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('auth_user', JSON.stringify(user));
            localStorage.setItem('auth_role', JSON.stringify(response.rol));
            localStorage.setItem('auth_components', JSON.stringify(response.componentes));
            localStorage.removeItem('auth_signature');
            authSignatureRef.current = '';

            if (response.facultad) {
                localStorage.setItem('auth_faculties', JSON.stringify([response.facultad]));
            }

            if (response.sede) {
                localStorage.setItem('auth_sede', JSON.stringify(response.sede));
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

            return response;
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
        authSignatureRef.current = '';
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

    const hasEditPermission = (componentName: string): boolean => {
        return state.components.some(c => 
            c.nombre === componentName && 
            (c.permiso === 'EDITAR' || c.permiso === 'Editar')
        );
    };

    useEffect(() => {
        if (!state.isAuthenticated) {
            return;
        }

        let isCancelled = false;

        const syncSessionAuthState = async () => {
            try {
                const response = await authService.getSessionAuthState(authSignatureRef.current || undefined);
                if (isCancelled) {
                    return;
                }

                if (response.signature && response.signature !== authSignatureRef.current) {
                    authSignatureRef.current = response.signature;
                    localStorage.setItem('auth_signature', response.signature);
                }

                if (!response.changed) {
                    return;
                }

                const nextRole = response.rol ?? null;
                const nextComponents = response.componentes ?? [];

                localStorage.setItem('auth_role', JSON.stringify(nextRole));
                localStorage.setItem('auth_components', JSON.stringify(nextComponents));

                setState(prev => ({
                    ...prev,
                    role: nextRole,
                    components: nextComponents,
                    user: prev.user ? { ...prev.user, rol: nextRole } : prev.user,
                }));
            } catch (error) {
                // Fallar en silencio para no interrumpir la sesión en errores transitorios.
            }
        };

        const syncIfVisible = () => {
            if (document.visibilityState === 'visible') {
                void syncSessionAuthState();
            }
        };

        // Sync inicial al autenticarse
        void syncSessionAuthState();

        // Sync periódico ligero (solo pestaña visible)
        const intervalId = window.setInterval(syncIfVisible, 7000);

        // Sync inmediato al recuperar foco/visibilidad
        window.addEventListener('focus', syncIfVisible);
        document.addEventListener('visibilitychange', syncIfVisible);

        return () => {
            isCancelled = true;
            window.clearInterval(intervalId);
            window.removeEventListener('focus', syncIfVisible);
            document.removeEventListener('visibilitychange', syncIfVisible);
        };
    }, [state.isAuthenticated]);

    return (
        <AuthContext.Provider value={{ ...state, login, logout, hasPermission, hasEditPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
