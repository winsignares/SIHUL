type SessionCacheEntry<T> = {
    token: string | null;
    data: T;
};

const sessionCacheStore = new Map<string, SessionCacheEntry<unknown>>();

export function getSessionCacheData<T>(key: string, token: string | null): T | null {
    const entry = sessionCacheStore.get(key) as SessionCacheEntry<T> | undefined;
    if (!entry) {
        return null;
    }

    if (entry.token !== token) {
        sessionCacheStore.delete(key);
        return null;
    }

    return entry.data;
}

export function setSessionCacheData<T>(key: string, token: string | null, data: T): void {
    sessionCacheStore.set(key, {
        token,
        data
    });
}

export function clearSessionCache(key?: string): void {
    if (key) {
        sessionCacheStore.delete(key);
        return;
    }

    sessionCacheStore.clear();
}