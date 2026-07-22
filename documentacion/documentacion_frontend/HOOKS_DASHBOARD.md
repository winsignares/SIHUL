# Hooks: Dashboard (`frontend/src/hooks/dashboard/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_DASHBOARD.md](PAGINAS_DASHBOARD.md) y [SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md](SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md).

## `useDashboardHome.ts` (298 líneas)

Usado en `pages/dashboard/DashboardHome.tsx`.

- Llama en paralelo: `facultadService.list()`, `programaService.listarProgramas()`, `espacioHorariosService.getAllDisponiblesWithHorarios()`, `asignaturaService.list()`, `obtenerEstadisticasDashboard()` (`services/dashboard/dashboardAPI.ts`), `ocupacionSemanalService.getOcupacionSemanal()`, `periodoService.listarPeriodos()`.
- Cache: clave `dashboard-home` vía `sessionCache` (ver [HOOKS_PATRON_CACHE.md](HOOKS_PATRON_CACHE.md)).
- Usa datos por defecto de `services/dashboard.data.ts` (mock estático de iconos/labels) que se sobreescriben con los datos reales una vez llegan.

## `useSupervisorDashboard.ts` (155 líneas)

Usado en `pages/dashboard/SupervisorGeneralHome.tsx`.

- Llama `supervisorDashboardService.getMetricas()` y `getMetricasRecursos()` (`services/dashboard/supervisorDashboardAPI.ts`).
- Sin cache de `sessionCache` — recarga siempre al montar.

## `useConsultorDocente.ts` / `useConsultorEstudiante.ts` (37 líneas cada uno, prácticamente idénticos)

Usados en `pages/dashboard/ConsultorDocenteHome.tsx` / `ConsultorEstudianteHome.tsx`.

- Delegan en `useMiHorario()` (ver [HOOKS_HORARIOS.md](HOOKS_HORARIOS.md)) y calculan estadísticas derivadas (materias, horas, grupos) con `useMemo`.

## `usePublicDashboard.ts` (71 líneas)

Usado en `pages/dashboard/PublicDashboard.tsx`.

- Solo navegación estática (`quickAccessItems`), sin llamadas API.
