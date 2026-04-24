import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { authService, type LoginPayload, type LoginResponse, type SessionUserResponse } from '../services/users/authService';
import type { AuthState } from '../models/auth/auth.model';
import { useMemo } from 'react';

interface AuthContextType extends AuthState {
    login: (payload: LoginPayload) => Promise<LoginResponse>;
    logout: () => void;
    hasPermission: (componentCode: string) => boolean;
    hasEditPermission: (componentName: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const authSignatureRef = useRef<string>(localStorage.getItem('auth_signature') || '');
    const [isSessionHydrated, setIsSessionHydrated] = useState(false);
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

    const clearAuthState = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_role');
        localStorage.removeItem('auth_components');
        localStorage.removeItem('auth_faculties');
        localStorage.removeItem('auth_areas');
        localStorage.removeItem('auth_signature');

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

    const getErrorStatus = (error: unknown): number | undefined => {
        if (typeof error !== 'object' || error === null || !('status' in error)) {
            return undefined;
        }

        const status = (error as { status?: unknown }).status;
        return typeof status === 'number' ? status : undefined;
    };

    const persistAuthState = (response: LoginResponse) => {
        const user = {
            id: response.id,
            nombre: response.nombre,
            correo: response.correo,
            rol: response.rol,
            facultad: response.facultad,
            sede: response.sede
        };

        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_role', JSON.stringify(response.rol));
        localStorage.setItem('auth_components', JSON.stringify(response.componentes || []));

        if (response.facultad) {
            localStorage.setItem('auth_faculties', JSON.stringify([response.facultad]));
        } else {
            localStorage.removeItem('auth_faculties');
        }

        if (response.sede) {
            localStorage.setItem('auth_sede', JSON.stringify(response.sede));
        } else {
            localStorage.removeItem('auth_sede');
        }

        if (response.espacios_permitidos) {
            localStorage.setItem('auth_areas', JSON.stringify(response.espacios_permitidos));
        } else {
            localStorage.removeItem('auth_areas');
        }

        if ('signature' in response && response.signature) {
            const signature = String(response.signature);
            localStorage.setItem('auth_signature', signature);
            authSignatureRef.current = signature;
        }

        setState({
            token: response.token,
            user,
            role: response.rol,
            components: response.componentes || [],
            faculties: response.facultad ? [response.facultad] : undefined,
            areas: response.espacios_permitidos,
            isAuthenticated: true,
            isLoading: false,
        });
    };

    const persistSessionUserState = (response: SessionUserResponse) => {
        const user = {
            id: response.id,
            nombre: response.nombre,
            correo: response.correo,
            rol: response.rol,
            facultad: response.facultad,
            sede: response.sede
        };

        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_role', JSON.stringify(response.rol));
        localStorage.setItem('auth_components', JSON.stringify(response.componentes || []));

        if (response.facultad) {
            localStorage.setItem('auth_faculties', JSON.stringify([response.facultad]));
        } else {
            localStorage.removeItem('auth_faculties');
        }

        if (response.sede) {
            localStorage.setItem('auth_sede', JSON.stringify(response.sede));
        } else {
            localStorage.removeItem('auth_sede');
        }

        if (response.espacios_permitidos) {
            localStorage.setItem('auth_areas', JSON.stringify(response.espacios_permitidos));
        } else {
            localStorage.removeItem('auth_areas');
        }

        if (response.signature) {
            localStorage.setItem('auth_signature', response.signature);
            authSignatureRef.current = response.signature;
        }

        setState({
            token: response.token,
            user,
            role: response.rol,
            components: response.componentes || [],
            faculties: response.facultad ? [response.facultad] : undefined,
            areas: response.espacios_permitidos,
            isAuthenticated: true,
            isLoading: false,
        });
    };

    const login = async (payload: LoginPayload): Promise<LoginResponse> => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // Limpiar cache de sesiones anteriores antes de hacer login
            const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
            cacheKeys.forEach(key => localStorage.removeItem(key));

            const response: LoginResponse = await authService.login(payload);

            localStorage.removeItem('auth_signature');
            authSignatureRef.current = '';
            persistAuthState(response);

            return response;
        } catch (error: unknown) {
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
        clearAuthState();
    };

    useEffect(() => {
        const tryHydrateFromSession = async () => {
            if (state.isLoading) {
                return;
            }

            setState(prev => ({ ...prev, isLoading: true }));
            try {
                const response = await authService.getAuthenticatedUser({ suppressErrorLog: true });
                persistSessionUserState(response);
            } catch (error: unknown) {
                const status = getErrorStatus(error);
                if (status === 401 || status === 403) {
                    clearAuthState();
                    return;
                }

                const storedToken = localStorage.getItem('auth_token');
                const storedUser = localStorage.getItem('auth_user');

                // En recargas o errores transitorios de red/backend, conservar sesión local
                // para no expulsar al usuario al login inesperadamente.
                if (storedToken && storedUser) {
                    setState(prev => ({
                        ...prev,
                        isAuthenticated: true,
                        isLoading: false,
                    }));
                    return;
                }

                // Si no existe estado local utilizable, limpiar autenticación.
                clearAuthState();
            } finally {
                setIsSessionHydrated(true);
            }
        };

        void tryHydrateFromSession();
        // Ejecutar una sola vez al montar para recuperar sesión OAuth.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Uso de useMemo para evitar recalcular permisos en cada render y disminuir complejidad de hasPermission y hasEditPermission
    // Mapa de componentes por nombre para acceso rápido
    const componentsByName = useMemo(() => {
        const map = new Map<string, (typeof state.components)[number]>();
        for (const c of state.components) {
            map.set(c.nombre, c);
        }
        return map;
    }, [state.components]);

    // Set de componentes editables para acceso rápido en hasEditPermission
    const editableComponents = useMemo(() => {
        const set = new Set<string>();
        for (const c of state.components) {
            if (c.permiso?.toUpperCase() === 'EDITAR') {
                set.add(c.nombre);
            }
        }
        return set;
    }, [state.components]);

    const hasPermission = (componentName: string): boolean => {
        return componentsByName.has(componentName);
    };

    const hasEditPermission = (componentName: string): boolean => {
        return editableComponents.has(componentName);
    };

    useEffect(() => {
        if (!isSessionHydrated || !state.isAuthenticated) {
            return;
        }

        let isCancelled = false;

        const syncSessionAuthState = async () => {
            try {
                const response = await authService.getSessionAuthState(authSignatureRef.current || undefined, { suppressErrorLog: true });
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
            } catch (error: unknown) {
                const status = getErrorStatus(error);
                if (status === 401 || status === 403) {
                    if (!isCancelled) {
                        clearAuthState();
                    }
                    return;
                }
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
    }, [isSessionHydrated, state.isAuthenticated]);

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

export const useAuthOptional = () => useContext(AuthContext);
