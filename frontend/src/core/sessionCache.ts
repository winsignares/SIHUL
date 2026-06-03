type SessionCacheEntry<T> = {
    token: string | null;
    data: T;
    timestamp: number;
};

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos
const CACHE_PREFIX = 'sihul_cache_';

function getStorageKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
}

export function getSessionCacheData<T>(key: string, token: string | null): T | null {
    try {
        const storageKey = getStorageKey(key);
        const stored = localStorage.getItem(storageKey);

        if (!stored) {
            return null;
        }

        const entry = JSON.parse(stored) as SessionCacheEntry<T>;

        // Verificar token
        if (entry.token !== token) {
            localStorage.removeItem(storageKey);
            return null;
        }

        // Verificar TTL
        const now = Date.now();
        if (now - entry.timestamp > CACHE_TTL_MS) {
            localStorage.removeItem(storageKey);
            return null;
        }

        return entry.data;
    } catch {
        return null;
    }
}

const MAX_CACHE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB limit for safety

function estimateSize(data: unknown): number {
    return JSON.stringify(data).length * 2; // rough estimate
}

export function setSessionCacheData<T>(key: string, token: string | null, data: T): void {
    try {
        const storageKey = getStorageKey(key);

        // Check data size before saving
        if (estimateSize(data) > MAX_CACHE_SIZE_BYTES) {
            // Data too large for localStorage, skip caching silently
            return;
        }

        const entry: SessionCacheEntry<T> = {
            token,
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded, clearing old cache entries');
            // Clear all cache entries to free up space
            clearSessionCache();
        } else {
            console.warn('Error saving to session cache:', error);
        }
    }
}

export function clearSessionCache(key?: string): void {
    if (key) {
        localStorage.removeItem(getStorageKey(key));
        return;
    }

    // Limpiar todas las claves con nuestro prefijo
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(k);
        }
    }
}

// Auto-cleanup on module load if storage is near limit
(function cleanupOldCache() {
    try {
        const testKey = `${CACHE_PREFIX}_test_`;
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
    } catch {
        // Storage is full or unavailable, clear old entries
        clearSessionCache();
    }
})();