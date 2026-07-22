# Services del frontend (`frontend/src/services/`) — índice

Ver también [ESTRUCTURA_Y_STACK.md](ESTRUCTURA_Y_STACK.md) y [HOOKS_INDICE.md](HOOKS_INDICE.md) (los hooks consumen estos services).

`frontend/src/services/` contiene los clientes API por dominio, organizados en subcarpetas. Documentación dividida en:

- [SERVICES_CORE.md](SERVICES_CORE.md) — los 8 módulos base de `frontend/src/core/` de los que dependen todos los services (`apiClient`, `endpoints`, `backendUrl`, `errorHandler`, `sessionCache`, `apiActivity`, `backendHealth`, `clearStaleState`).
- [SERVICES_LEGACY.md](SERVICES_LEGACY.md) — capa mock (`database.ts`, `auth.ts`, `complete-data.ts`, `cacheService.ts`) que precede al backend real; deuda técnica visible.
- [SERVICES_ACADEMICO.md](SERVICES_ACADEMICO.md) — asignaturas, componentes, facultades, grupos, periodos, programas, sedes, recursos.
- [SERVICES_ESPACIOS_HORARIOS.md](SERVICES_ESPACIOS_HORARIOS.md) — espacios, horarios, solicitudes de espacio, asignación de espacios.
- [SERVICES_PRESTAMOS_REPORTE.md](SERVICES_PRESTAMOS_REPORTE.md) — préstamos (admin/público) y reportes de ocupación/capacidad/disponibilidad.
- [SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md](SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md) — usuarios/auth, notificaciones, dashboard, configuración local.
- [SERVICES_CHATBOT.md](SERVICES_CHATBOT.md) — cliente del chatbot (proxy hacia el backend Django).
- [SERVICES_FINANCIERO.md](SERVICES_FINANCIERO.md) — los 11 servicios del módulo financiero.

## Patrón base común

Todos los servicios "reales" (no legacy) importan `apiClient` desde `core/apiClient.ts` y llaman a `apiClient.get/post/put/patch/delete/postFormData/getBlob/postBlob`. Ninguno usa `fetch` crudo salvo casos puntuales de descarga de blobs vía `trackedFetch` (`core/apiActivity.ts`).

Patrón típico de transformación backend↔frontend: cada servicio suele definir una interfaz `XApi` (relaciones como `number` planas, ej. `programa: number`) y una interfaz pública `X` (con sufijo `_id`, ej. `programa_id: number`), más una función `toFrontendX(apiObj): X` de normalización. Ejemplos: `toFrontendAsignaturaPrograma`, `toFrontendHorario`, `toFrontendPrestamo`, `toFrontendGrupo`, `toFrontendSede`, `toFrontendFacultad`, `toFrontendComponenteRol`, `toFrontendUsuario`.

## `core/endpoints.ts`: convención parcialmente adoptada

Existe un objeto `ENDPOINTS` centralizado en `core/endpoints.ts`, pero la mayoría de los servicios **no lo usan** — construyen las rutas como strings literales directamente en cada llamada (`apiClient.get('/asignaturas/')`). Antes de asumir que las rutas están centralizadas ahí, verificar con un grep si el servicio en cuestión lo importa.
