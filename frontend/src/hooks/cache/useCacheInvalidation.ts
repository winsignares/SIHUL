import { useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { clearEspaciosCache, getCacheKey } from '../../services/cache/cacheService';

/**
 * Hook para manejar invalidación de caché de espacios
 * Úsalo cuando se agregue un nuevo espacio o haya cambios importantes
 */
export const useCacheInvalidation = () => {
    const { user } = useAuth();

    const invalidateEspaciosCache = useCallback(() => {
        console.log('[useCacheInvalidation] Invalidando caché de espacios');
        const cacheKey = getCacheKey(user);
        clearEspaciosCache(cacheKey);
    }, [user]);

    return { invalidateEspaciosCache };
};
