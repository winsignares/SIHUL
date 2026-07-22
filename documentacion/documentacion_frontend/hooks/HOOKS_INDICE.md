# Hooks del frontend (`frontend/src/hooks/`) — índice

Ver también [ESTRUCTURA_Y_STACK.md](ESTRUCTURA_Y_STACK.md) y [SERVICES_INDICE.md](SERVICES_INDICE.md) (los hooks de datos consumen los services documentados ahí).

`frontend/src/hooks/` está organizado por dominio, más un puñado de hooks transversales sueltos en la raíz de la carpeta. Documentación dividida en:

- [HOOKS_PATRON_CACHE.md](HOOKS_PATRON_CACHE.md) — el patrón de cache que comparten casi todos los hooks de datos (`core/sessionCache.ts`) y el sistema legacy (`hooks/cache/`, `services/cache/cacheService.ts`).
- [HOOKS_PRINCIPALES.md](HOOKS_PRINCIPALES.md) — hooks transversales usados en todo el proyecto: `useIsMobile`, `useAdminDashboard`, `useErrorHandler`, `useRoutes`.
- [HOOKS_CHATBOT_NOTIFICACIONES.md](HOOKS_CHATBOT_NOTIFICACIONES.md) — `useAsistentesVirtuales` (chatbot) y `useNotificaciones`.
- [HOOKS_DASHBOARD.md](HOOKS_DASHBOARD.md) — `hooks/dashboard/`.
- [HOOKS_ESPACIOS.md](HOOKS_ESPACIOS.md) — `hooks/espacios/`.
- [HOOKS_GESTION_ACADEMICA.md](HOOKS_GESTION_ACADEMICA.md) — `hooks/gestionAcademica/` (el dominio más grande, incluye advertencia de hooks legacy sobre datos mock).
- [HOOKS_HORARIOS.md](HOOKS_HORARIOS.md) — `hooks/horarios/`.
- [HOOKS_PERMISOS_USERS.md](HOOKS_PERMISOS_USERS.md) — `hooks/permisos/` y `hooks/users/`.
- [HOOKS_REPORTE.md](HOOKS_REPORTE.md) — `hooks/reporte/`.
- [HOOKS_FINANCIERO.md](HOOKS_FINANCIERO.md) — `hooks/financiero/` (8 perfiles de rol).

## Regla de diseño transversal: `{ force?: boolean }`

Casi todas las funciones de carga de datos (`loadX`/`cargarX`) en los hooks de este proyecto aceptan un parámetro opcional `{ force?: boolean }` para forzar un refetch saltándose el cache. Es la convención estándar a seguir si se agrega un hook nuevo con fetching de datos.
