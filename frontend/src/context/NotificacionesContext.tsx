/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuthOptional } from './AuthContext';
import { obtenerEstadisticas } from '../services/notificaciones/notificacionesAPI';

interface NotificacionesContextType {
    contadorNoLeidas: number;
    actualizarContador: () => Promise<void>;
}

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
    const auth = useAuthOptional();
    const user = auth?.user;
    const isAuthenticated = auth?.isAuthenticated ?? false;
    const isAuthLoading = auth?.isLoading ?? false;
    const [contadorNoLeidas, setContadorNoLeidas] = useState(0);

    /**
     * Actualiza el contador de notificaciones no leídas
     */
    const actualizarContador = useCallback(async () => {
        if (!user?.id || !isAuthenticated || isAuthLoading) {
            setContadorNoLeidas(0);
            return;
        }

        try {
            const stats = await obtenerEstadisticas(user.id, { suppressErrorLog: true });
            setContadorNoLeidas(stats.no_leidas);
        } catch (error: unknown) {
            const status = typeof error === 'object' && error !== null && 'status' in error
                ? (error as { status?: unknown }).status
                : undefined;

            if (status === 401 || status === 403) {
                setContadorNoLeidas(0);
                return;
            }

            console.error('Error al actualizar contador de notificaciones:', error);
        }
    }, [user?.id, isAuthenticated, isAuthLoading]);

    /**
     * Polling automático cada 30 segundos
     */
    useEffect(() => {
        if (!isAuthenticated || !user?.id || isAuthLoading) {
            setContadorNoLeidas(0);
            return;
        }

        // Carga inicial
        actualizarContador();

        // Polling cada 30 segundos
        const interval = setInterval(actualizarContador, 30000);

        return () => clearInterval(interval);
    }, [actualizarContador, isAuthenticated, user?.id, isAuthLoading]);

    return (
        <NotificacionesContext.Provider value={{ contadorNoLeidas, actualizarContador }}>
            {children}
        </NotificacionesContext.Provider>
    );
}

export function useNotificacionesContext() {
    const context = useContext(NotificacionesContext);
    if (context === undefined) {
        throw new Error('useNotificacionesContext must be used within a NotificacionesProvider');
    }
    return context;
}
