# Services legacy — deuda técnica

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_GESTION_ACADEMICA.md](HOOKS_GESTION_ACADEMICA.md), [HOOKS_HORARIOS.md](HOOKS_HORARIOS.md) y [HOOKS_ESPACIOS.md](HOOKS_ESPACIOS.md).

Estos archivos son código de una fase previa del proyecto, cuando el backend Django real todavía no existía y se simulaba con `localStorage`:

- `services/database.ts` — clase `Database` (`db`), simula el backend completo sobre `localStorage`.
- `services/auth.ts` — clase `AuthService` legacy, no usa `apiClient`. No se detectaron consumidores en los hooks activos revisados; probablemente vestigial (reemplazado por `services/users/authService.ts`, ver [SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md](SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md)).
- `services/complete-data.ts` — datos mock/seed usados por `database.ts`. Sin consumidores activos detectados fuera de la capa legacy.
- `services/cache/cacheService.ts` — sistema de cache pre-`sessionCache`, usado solo por `hooks/cache/useCacheInvalidation.ts` (ver [HOOKS_PATRON_CACHE.md](HOOKS_PATRON_CACHE.md)).
- `services/dashboard.data.ts` — mock estático de labels/iconos por defecto; **este sí sigue en uso activo** como valores por defecto en `hooks/dashboard/useDashboardHome.ts`, sobreescritos cuando llegan los datos reales.

## Páginas activas que todavía dependen de `db` (parcial o totalmente)

Estas páginas están en producción pero su hook asociado consulta datos simulados en `localStorage` en vez del backend real:

| Página | Hook | Detalle |
|---|---|---|
| `pages/gestionAcademica/HorariosAcademicos.tsx` | `hooks/gestionAcademica/useHorariosAcademicos.ts` | Totalmente sobre `db`. |
| `pages/gestionAcademica/AsignacionAutomatica.tsx` | `hooks/gestionAcademica/useAsignacionAutomatica.ts` | Algoritmo de asignación automática completo corre en cliente y persiste en `db`. |
| `pages/horarios/VisualizacionHorarios.tsx` | `hooks/horarios/useVisualizacionHorarios.ts` | Lee `db` + `localStorage.getItem('horariosCompletos')` directamente. |
| `pages/espacios/SupervisorSalonHome.tsx` | `hooks/espacios/useSupervisorSalonHome.ts` | Mezcla `db` con servicios reales (`espacioService`, `espacioRecursoService`). |

**Recomendación**: tratar estas 4 páginas como pendientes de migración a backend real antes de asumir que su comportamiento es representativo del resto del sistema. Cualquier bug reportado en ellas debería primero descartar si la causa es el uso de datos mock desincronizados del backend.

`services/database.ts` (`db`) también es importado por `hooks/dashboard/useDashboardHome.ts`, `hooks/dashboard/useSupervisorDashboard.ts`, `hooks/prestamos/usePlazasDisponibles.ts` y `context/UserContext.tsx` — verificar en cada caso si el import está realmente en uso o es residual antes de asumir dependencia funcional.
