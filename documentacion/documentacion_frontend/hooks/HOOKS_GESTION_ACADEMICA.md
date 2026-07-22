# Hooks: Gestión Académica (`frontend/src/hooks/gestionAcademica/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_GESTION_ACADEMICA.md](PAGINAS_GESTION_ACADEMICA.md) y [SERVICES_ACADEMICO.md](SERVICES_ACADEMICO.md).

El dominio más grande de `hooks/` (17 archivos). **Aviso importante**: conviven dos generaciones de hooks.

## Deuda técnica: hooks legacy sobre datos mock

Estos hooks usan `services/database.ts` (`db`, un simulador de backend sobre `localStorage` de una fase previa del proyecto), no el backend Django real:

- `useHorariosAcademicos.ts` — usado en `pages/gestionAcademica/HorariosAcademicos.tsx`.
- `useAsignacionAutomatica.ts` (694 líneas) — usado en `pages/gestionAcademica/AsignacionAutomatica.tsx`. Importa/parsea Excel-CSV con `exceljs`, ejecuta un algoritmo de asignación automática de espacios (ordena por capacidad, calcula coincidencia de recursos ≥30%, detecta conflictos de horario) y persiste todo en `db`, no en el backend real. Genera también una plantilla de descarga.

Ver también `hooks/horarios/useVisualizacionHorarios.ts` y `hooks/espacios/useSupervisorSalonHome.ts` (mismo patrón, documentados en sus respectivos archivos). Recomendación: tratar estas páginas como pendientes de migración al backend real antes de considerarlas completamente funcionales en producción.

## Hooks reales (sobre backend Django)

### `useCrearHorarios.ts` (817 líneas) — el hook más complejo del dominio académico

Usado en `pages/gestionAcademica/CrearHorarios.tsx`.

- Estado: catálogos (`facultades`, `programas`, `grupos`, `espacios`, `asignaturas`, `asignaturasPrograma`, `docentes`, `periodos`, `todosLosHorarios`), 9 filtros independientes, vista (`lista|asignar`), modal de asignación con `diasSeleccionados`/`horasPorDia`.
- Servicios: `facultadService`, `programaService`, `espacioService`, `asignaturaService`, `asignaturaProgramaService`, `userService.listarDocentes`, `periodoService`, `grupoService`, `horarioService.listExtendidos`, `solicitudEspacioService`.
- Carga progresiva en 3 fases (catálogos pequeños → grupos → horarios pesados) con cache por `userScope` (rol + usuario + facultad).
- Valida conflictos de horario vía el sub-hook `useValidacionHorarios.ts`.
- Notifica cambios con el evento global `horariosUpdated` y limpia cache con `clearSessionCacheByPrefix` (`gestion-academica-crear-horarios`, `gestion-academica-centro-horarios-v2`).

### `useGestionUsuarios.ts` (840 líneas)

Usado en `pages/gestionAcademica/GestionUsuarios.tsx`. CRUD de usuarios con roles/facultades/sedes/espacios permitidos (individual o por tipo de espacio).

- Servicios: `userService`, `rolService` (`services/users/authService.ts`), `espacioService`/`espacioPermitidoService`, `facultadService`, `sedeService`.
- Cache multi-clave (usuarios, roles, facultades, espacios, sedes, tipos de espacio), cada una con su propio evento de invalidación (`ROLES_UPDATED_EVENT`, `ESPACIOS_UPDATED_EVENT`, `SEDES_UPDATED_EVENT`, `ACADEMIC_CATALOG_UPDATED_EVENT`), incluyendo un listener en `window.addEventListener('focus', ...)` para refrescar catálogos al recuperar el foco.

> Nota: existe un segundo hook de roles independiente, `hooks/permisos/useGestionRoles.ts` (ver [HOOKS_PERMISOS_USERS.md](HOOKS_PERMISOS_USERS.md)), que se sincroniza con este vía el evento `ROLES_UPDATED_EVENT` — no comparten código.

### Resto de hooks del dominio

Mismo patrón de CRUD + `sessionCache` + servicios homónimos: `useAsignaturas.ts`, `useCentroHorarios.ts`, `useDocentes.ts`, `useEspaciosFisicos.ts`, `useEstadoRecursos.ts`, `useFacultadesPrograms.ts`, `useGestionRecursos.ts`, `useGrupos.ts`, `useGruposFusion.ts`, `usePeriodosAcademicos.ts`, `useSedes.ts`, `useSolicitudesEspacio.ts`.

### `useValidacionHorarios.ts`

Sub-hook consumido por `useCrearHorarios.ts` para detectar conflictos de horario (docente/grupo/espacio ocupado en el mismo bloque).

### `paginacion.ts` — utilidades, no un hook

Módulo de funciones puras reusado por casi todos los hooks paginados del proyecto: `PAGE_SIZE_DEFAULT`, `getPageNumbers`, `getPageSlice`, `getTotalPages`, `normalizePage`, `hasNextPageWindow`, `hasPrevPageWindow`, `getTargetPageForNextWindow`/`PrevWindow`. Usado también por `useGestionUsuarios`, `usePrestamosEspacios`, `useAperturaCierre`, `useCrearHorarios`, entre otros.
