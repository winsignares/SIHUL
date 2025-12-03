/**
 * Servicio de caché para almacenar datos en localStorage
 */

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface EspaciosCache {
    espacios: any[];
    horarios: any[];
    timestamp: number;
}

const CACHE_KEYS = {
    ESPACIOS_PUBLICOS: 'cache_espacios_publicos',
    ESPACIOS_SUPERVISOR: (userId: number) => `cache_espacios_supervisor_${userId}`,
    ESPACIOS_OTROS: 'cache_espacios_otros'
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos en milisegundos

/**
 * Obtiene espacios del caché
 */
export const getEspaciosFromCache = (cacheKey: string): EspaciosCache | null => {
    try {
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;

        const entry: CacheEntry<EspaciosCache> = JSON.parse(cached);
        const now = Date.now();

        // Verificar si el caché ha expirado
        if (now - entry.timestamp > CACHE_DURATION) {
            localStorage.removeItem(cacheKey);
            return null;
        }

        return entry.data;
    } catch (error) {
        console.error('Error reading from cache:', error);
        return null;
    }
};

/**
 * Guarda espacios en el caché
 */
export const setEspaciosInCache = (cacheKey: string, espacios: any[], horarios: any[]): void => {
    try {
        const entry: CacheEntry<EspaciosCache> = {
            data: {
                espacios,
                horarios,
                timestamp: Date.now()
            },
            timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
        console.error('Error writing to cache:', error);
    }
};

/**
 * Limpia el caché de espacios
 */
export const clearEspaciosCache = (cacheKey: string): void => {
    try {
        localStorage.removeItem(cacheKey);
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};

/**
 * Obtiene la clave de caché según el usuario
 */
export const getCacheKey = (user: any): string => {
    if (!user?.id) {
        // Usuario público
        return CACHE_KEYS.ESPACIOS_PUBLICOS;
    } else if (String(user.rol) === 'supervisor_general') {
        // Supervisor general
        return CACHE_KEYS.ESPACIOS_SUPERVISOR(user.id);
    } else {
        // Otros roles
        return CACHE_KEYS.ESPACIOS_OTROS;
    }
};

/**
 * Obtiene el hash de los espacios (para detectar cambios)
 */
export const getEspaciosHash = (espacios: any[]): string => {
    try {
        return String(espacios.length);
    } catch {
        return '';
    }
};

/**
 * Invalida todos los cachés
 */
export const invalidateAllCaches = (): void => {
    try {
        Object.values(CACHE_KEYS).forEach(key => {
            if (typeof key === 'string') {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.error('Error invalidating caches:', error);
    }
};
