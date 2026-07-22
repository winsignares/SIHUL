# Hooks: Espacios (`frontend/src/hooks/espacios/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_HORARIOS_ESPACIOS_PRESTAMOS.md](PAGINAS_HORARIOS_ESPACIOS_PRESTAMOS.md) y [SERVICES_ESPACIOS_HORARIOS.md](SERVICES_ESPACIOS_HORARIOS.md).

## `useConsultaEspacios.ts` — orquestador

Usado en `pages/espacios/ConsultaEspacios.tsx`. Combina varios sub-hooks del mismo directorio:

- `useConsultaEspaciosFiltros` — filtros de búsqueda/tipo/apertura/sede/período/ocupación.
- `useConsultaEspaciosDatos` — fetch de espacios/horarios/préstamos.
- `useConsultaEspaciosPaginacion`.
- `useConsultaEspaciosSeleccion` — selección de rango para crear una solicitud.
- `useConsultaEspaciosExport` — exportar cronograma a PDF/Excel.
- `useConsultaEspaciosPeriodos` — búsqueda de horarios por período académico.

Expone ~50 propiedades combinadas: filtros, `vistaActual` (`tarjetas|cronograma`), `filteredEspacios`, `paginatedEspacios`, `getOcupacionPorHora`, `getConflictoEnRango`, `horarios`, `prestamos`, exportación, selección por arrastre (`isDragging`, `seleccionRango`, `iniciarSeleccion`...), `verCronogramaIndividual`/`volverALista`.

## `usePrestamosEspacios.ts` (737 líneas)

Usado en `pages/espacios/PrestamosEspacios.tsx`. CRUD administrativo completo de préstamos de espacios.

- Estado: filtros (búsqueda/estado/fecha), diálogos, paginación, `prestamos`.
- Expone: `aprobarSolicitud`, `rechazarSolicitud`, `iniciarEdicion`/`guardarEdicion`/`cancelarEdicion`, `eliminarSolicitud`.
- Servicios: `prestamoService` (`services/prestamos/prestamoAPI.ts`), `prestamosPublicAPI` (`services/prestamos/prestamosPublicAPI.ts`).
- Distingue préstamos "públicos" de "autenticados" por convención de ID (`auth-123` / `public-123`, función `parseUniqueId`).
- Sincronización cross-tab: escucha el evento `storage` con clave `PRESTAMOS_CHANGED_STORAGE_KEY` y el evento custom `PRESTAMOS_CHANGED_EVENT`, más polling cada 15s (`PRESTAMOS_SYNC_INTERVAL_MS`) mientras la pestaña está visible.

## `useAperturaCierre.ts` (684 líneas)

Gestión de apertura/cierre de salones para supervisores.

- Servicios: `aperturaCierreService`, `espacioService`, `espacioRecursoService`.
- Auto-refresh cada 30 segundos.
- Notificaciones toast escalonadas (15/5/1 min para apertura; 10/5/1 min para cierre) con deduplicación vía `useRef<Set<string>>`.

## `useSupervisorSalonHome.ts` (524 líneas) — parcialmente legacy

> **Deuda técnica**: usa `db` (mock sobre `localStorage`, `services/database.ts`) mezclado con servicios reales (`espacioService`, `espacioRecursoService`). Usado en `pages/espacios/SupervisorSalonHome.tsx`. Ver [SERVICES_LEGACY.md](SERVICES_LEGACY.md).

## `hooks/cache/useCacheInvalidation.ts`

Ver [HOOKS_PATRON_CACHE.md](HOOKS_PATRON_CACHE.md) — sistema de cache legacy específico de espacios, separado de `sessionCache`.
