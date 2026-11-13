import type { PrestamoEspacioUI as PrestamoEspacio } from '../../../models';

export const PRESTAMOS_CACHE_KEY = 'prestamos-espacios';
export const PRESTAMOS_SYNC_INTERVAL_MS = 15_000;

export const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error && typeof error === 'object' && 'message' in error) {
        const msg = (error as { message?: unknown }).message;
        if (typeof msg === 'string' && msg.trim()) {
            return msg;
        }
    }
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return fallback;
};

// Helper para extraer el ID numérico y el tipo de préstamo del ID único
export const parseUniqueId = (uniqueId: string): { tipo: 'autenticado' | 'publico', id: number } | null => {
    const match = uniqueId.match(/^(auth|public)-(\d+)$/);
    if (!match) {
        // Compatibilidad con IDs legados sin prefijo.
        const numericId = Number.parseInt(uniqueId, 10);
        if (Number.isInteger(numericId) && numericId > 0) {
            return { tipo: 'autenticado', id: numericId };
        }
        return null;
    }
    
    return {
        tipo: match[1] === 'auth' ? 'autenticado' : 'publico',
        id: parseInt(match[2])
    };
};

export const normalizarEstado = (estado: PrestamoEspacio['estado']) => {
    return estado.charAt(0).toUpperCase() + estado.slice(1);
};
