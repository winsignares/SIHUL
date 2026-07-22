# Patrón de cache en los hooks

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md) y [SERVICES_CORE.md](SERVICES_CORE.md) (`core/sessionCache.ts` es la pieza base).

Coexisten **dos sistemas de cache** en el proyecto:

## 1. Sistema dominante: `core/sessionCache.ts`

Usado por ~20+ hooks de datos (`dashboard/`, `gestionAcademica/`, `horarios/`, `espacios/`, `prestamos/`, `reporte/`, `permisos/`, `chatbot/`). Patrón típico repetido en cada hook:

```ts
const CACHE_KEY = 'dominio-especifico';
const activeToken = localStorage.getItem('auth_token');
const cached = force ? null : getSessionCacheData<T>(CACHE_KEY, activeToken);
if (cached) { setState(cached); return; }
// ... fetch real ...
setSessionCacheData(CACHE_KEY, activeToken, data);
```

Características:
- TTL fijo de 30 minutos (`CACHE_TTL_MS` en `core/sessionCache.ts`).
- Claves con prefijo `sihul_cache_` en `localStorage`.
- El cache se asocia al `token` de sesión: si cambia (nuevo login), se invalida automáticamente.
- Muchos hooks usan una clave compuesta por `userScope` (rol + id de usuario + facultad) para no mezclar cache entre usuarios distintos con el mismo rol.

### Invalidación por eventos globales (`window` custom events)

- `academic-catalog-updated`
- `espacios-updated`
- `sedes-updated`
- `roles-updated` (`ROLES_UPDATED_EVENT`)
- `horariosUpdated`
- `sihul:prestamos-changed` (definido en `services/prestamos/prestamosChanges.ts`, con sincronización cross-tab vía `storage` event + `localStorage['sihul_prestamos_changed_at']`)

### `clearSessionCacheByPrefix(prefix)`

Permite invalidar varias claves relacionadas de una vez (ej. `useCrearHorarios.ts` limpia `gestion-academica-crear-horarios` y `gestion-academica-centro-horarios-v2` al guardar un horario nuevo).

## 2. Sistema legacy: `hooks/cache/useCacheInvalidation.ts` + `services/cache/cacheService.ts`

Precede al sistema de `sessionCache`. Solo expone `invalidateEspaciosCache()`, que resuelve una clave de cache por usuario y la limpia. Vive aparte de `sessionCache` y no comparte código con él — al leer o modificar código de gestión de espacios, verificar cuál de los dos sistemas está en juego.

## Hooks financieros: sin cache

Los hooks de `hooks/financiero/` (ver [HOOKS_FINANCIERO.md](HOOKS_FINANCIERO.md)) son la excepción: **no usan `sessionCache`**, recargan datos siempre al montar el componente.
