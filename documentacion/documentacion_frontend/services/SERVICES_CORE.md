# Core (`frontend/src/core/`)

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md) y [HOOKS_PATRON_CACHE.md](HOOKS_PATRON_CACHE.md).

Los módulos base de los que dependen todos los `services/`.

## `apiClient.ts` (211 líneas)

Cliente HTTP centralizado. Clase `ApiClient`, instancia exportada como `apiClient`.

- `baseURL` resuelto por `resolveApiBaseUrl(import.meta.env.VITE_API_URL)` (ver `backendUrl.ts`).
- Headers automáticos: `Content-Type: application/json` (salvo `FormData`), `Authorization: Bearer {auth_token}` desde `localStorage`.
- `credentials: 'include'` en todas las peticiones (cookies de sesión, usado por el flujo OAuth Microsoft).
- Métodos: `get`, `post`, `put`, `patch`, `delete`, `postFormData`, `getBlob`, `postBlob`.
- Config extendida por llamada: `requiresAuth` (default `true`; si `false`, no fuerza redirect en 401), `suppressErrorLog` (evita loggear/reportar el error — útil en llamadas "opcionales" de hidratación de sesión o en endpoints donde un 404 es esperado).
- Un `204` retorna `{}`.
- Integra `beginApiRequest()`/`endRequest()` de `apiActivity.ts` para trackear peticiones pendientes globalmente, y `handleApiError` de `errorHandler.ts` para respuestas no-ok.
- No cachea nada — el cache vive en la capa de hooks (`sessionCache.ts`), no aquí.

## `endpoints.ts` (176 líneas)

Objeto `ENDPOINTS` con rutas centralizadas por dominio (`USUARIOS`, `ROLES`, `SEDES`, `FACULTADES`, `PROGRAMAS`, `PERIODOS`, `GRUPOS`, `ASIGNATURAS`, `ESPACIOS`, `RECURSOS`, `ESPACIO_RECURSO`, `PRESTAMOS`, `HORARIOS`, `HORARIOS_FUSIONADOS`, `AUTH`, `RESERVAS`, `DASHBOARD`, `NOTIFICACIONES`, `REPORTES`, `BUSQUEDA`). Ver nota de adopción parcial en [SERVICES_INDICE.md](SERVICES_INDICE.md).

## `backendUrl.ts` (34 líneas)

- `resolveBackendBaseUrl(rawUrl)`: si hay `VITE_API_URL` configurado y no es localhost (o si el navegador sí está en localhost), lo usa; si no, cae a `window.location.origin`. Limpia el sufijo `/api`.
- `resolveApiBaseUrl(rawUrl)`: añade `/api` al resultado anterior (o retorna `/api` si no hay base).
- Usado por `apiClient.ts`, `authService.ts` (para `getMicrosoftLoginUrl`), `backendHealth.ts`, `ocupacionSemanalAPI.ts`, `useReportes.ts`.

## `errorHandler.ts` (159 líneas)

- `handleApiError(response, { redirectOn401 })`: parsea el body de error (string/array/objeto DRF con `non_field_errors` o campo específico), arma un `ApiError { message, status, errors }`.
- Casos especiales por status:
  - `401` (si `redirectOn401`): limpia estado de auth (`clearAuthClientState`), limpia `db.cerrarSesion()` (import dinámico para evitar ciclo con la capa legacy), navega a `/login` vía History API + `PopStateEvent('popstate')` (evita un full reload; cae a `window.location.href` si falla).
  - `403` → "No tienes permisos...".
  - `404` → "Recurso no encontrado".
  - `422` → "Datos de validación incorrectos".
  - `500` → "Error interno del servidor" (si no hay mensaje del servidor).
- `formatValidationErrors(errors)`: formatea errores de campo para mostrar en la UI.

## `sessionCache.ts` (112 líneas) — el corazón del patrón de cache del proyecto

Documentado en detalle en [HOOKS_PATRON_CACHE.md](HOOKS_PATRON_CACHE.md). Resumen técnico:

- `CACHE_TTL_MS = 30 * 60 * 1000` (30 min), `CACHE_PREFIX = 'sihul_cache_'`.
- `getSessionCacheData<T>(key, token)`: lee de `localStorage`, valida que el `token` coincida (invalida cache al cambiar de sesión) y que no haya expirado el TTL.
- `setSessionCacheData<T>(key, token, data)`: guarda `{ token, data, timestamp }`; si supera `MAX_CACHE_SIZE_BYTES` (~4MB estimado por `JSON.stringify(data).length * 2`), no cachea silenciosamente; si `localStorage` lanza `QuotaExceededError`, limpia todo el cache.
- `clearSessionCache(key?)`: borra una clave o todas las que empiecen con el prefijo.
- `clearSessionCacheByPrefix(prefix)`: borra todas las claves que empiecen con `sihul_cache_{prefix}`.
- Auto-cleanup al cargar el módulo: si `localStorage` está lleno o no disponible, limpia todo el cache proactivamente.

## `apiActivity.ts` (151 líneas)

Sistema de estado global (pub/sub simple, sin librería) para trackear actividad de red:

- `beginApiRequest()` / callback `endRequest()`: incrementa/decrementa `pendingRequests`.
- `reportApiError(error)`: si detecta 2+ fallos de red consecutivos (`TypeError` sin response, es decir backend inalcanzable), marca `backendUnreachable = true`.
- `reportBackendReachable()`: si veníamos de `backendUnreachable`, entra en `backendRecovering` y **recarga la página completa tras 1.5s** para forzar que toda la UI re-consulte datos frescos tras una caída del backend.
- `trackedFetch(input, init)`: wrapper de `fetch` nativo (no pasa por `apiClient`) que añade el Bearer token, trackea la petición y reporta reachability. Usado en llamadas puntuales que necesitan `fetch` crudo (descargas de PDF/Excel con streaming de blob, endpoints públicos de préstamos con PUT directo).
- Expone `subscribeApiActivity`/`getApiActivitySnapshot`, consumidos probablemente por un banner global de estado (fuera del alcance de hooks/services).

## `backendHealth.ts` (56 líneas)

- `startBackendHealthWatcher()`: arranca un polling perezoso (`PING_INTERVAL_MS = 5000`) que **solo hace ping real si `backendUnreachable` está activo** (para no generar tráfico innecesario en el caso normal). Hace `HEAD` a `{apiUrl}/` con `AbortController` (timeout 10s). Cualquier respuesta HTTP (incluso 401/403/404) cuenta como "backend vivo".

## `clearStaleState.ts` (48 líneas)

- `clearAuthClientState()`: borra claves específicas de auth (`auth_token`, `auth_user`, `auth_role`, `auth_components`, `auth_faculties`, `auth_areas`, `auth_sede`, `auth_signature`, `auth_is_public`) más todo lo que empiece con `cache_` o `sihul_cache_`. Usado por `errorHandler.ts` en el flujo de 401.
- `clearStaleClientState()`: borra **todo** `localStorage` salvo `theme`, y limpia `sessionStorage` completo — función de "reset total" para depurar bugs de cache/sesión corrupta.
