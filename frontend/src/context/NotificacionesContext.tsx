import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { obtenerEstadisticas } from '../services/notificaciones/notificacionesAPI';

interface NotificacionesContextType {
    contadorNoLeidas: number;
    actualizarContador: () => Promise<void>;
}

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [contadorNoLeidas, setContadorNoLeidas] = useState(0);

    /**
     * Actualiza el contador de notificaciones no leídas
     */
    const actualizarContador = useCallback(async () => {
        if (!user?.id || !isAuthenticated) {
            setContadorNoLeidas(0);
            return;
        }

        try {
            const stats = await obtenerEstadisticas(user.id);
            setContadorNoLeidas(stats.no_leidas);
        } catch (error) {
            console.error('Error al actualizar contador de notificaciones:', error);
        }
    }, [user?.id, isAuthenticated]);

    /**
     * Polling automático cada 30 segundos
     */
    useEffect(() => {
        if (!isAuthenticated || !user?.id) {
            setContadorNoLeidas(0);
            return;
        }

        // Carga inicial
        actualizarContador();

        // Polling cada 30 segundos
        const interval = setInterval(actualizarContador, 30000);

        return () => clearInterval(interval);
    }, [actualizarContador, isAuthenticated, user?.id]);

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
