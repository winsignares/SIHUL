# Services: dominio académico

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_GESTION_ACADEMICA.md](HOOKS_GESTION_ACADEMICA.md) y [HOOKS_PERMISOS_USERS.md](HOOKS_PERMISOS_USERS.md).

## `services/asignaturas/asignaturaAPI.ts`

- `asignaturaService`: `create`, `update`, `delete`, `get(id)`, `list()` sobre `/asignaturas/`.
- `asignaturaProgramaService`: `create`, `update`, `delete`, `get(id)`, `list(programa_id?)` (filtra en cliente si se pasa `programa_id`) sobre `/asignaturas-programa/`.

## `services/componentes/componentesAPI.ts`

Cliente del sistema RBAC dinámico (ver [../documentacion_backend/AUTENTICACION_Y_PERMISOS.md](../documentacion_backend/AUTENTICACION_Y_PERMISOS.md)).

- `componenteService`: `create`, `list`, `get(id)`, `update`, `delete` sobre `/componentes/`.
- `componenteRolService`: CRUD sobre `/componentes/roles/` (permiso `VER`/`EDITAR`).
- `componenteUsuarioService`: `list(usuarioId?)`, `create`, `update`, `delete` sobre `/componentes/usuarios/` (asignación directa de componente a usuario, independiente del rol).

## `services/facultades/facultadesAPI.ts`

`facultadService`: `create`, `update`, `delete`, `get(id)`, `list()` sobre `/facultades/`.

## `services/grupos/gruposAPI.ts`

`grupoService`: `create`, `update` (PATCH parcial), `delete`, `get(id)`, `list()` sobre `/grupos/`.

## `services/periodos/periodoAPI.ts`

`periodoService`: `listarPeriodos`, `obtenerPeriodo(id)`, `crearPeriodo`, `actualizarPeriodo`, `eliminarPeriodo`, `copiarPeriodo(origenId, nuevoPeriodo)` (POST `/periodos/copy/` — clona un período y migra sus grupos), `periodoPorRangoFechas(inicio, fin)` (GET `/periodos/rango-fechas/`, `suppressErrorLog: true`).

## `services/periodos/periodoActivoAPI.ts`

`periodoActivoService.getPeriodoActivo()`: GET `/periodos/activo/`, retorna `null` en error (try/catch interno, no propaga excepción). Es el servicio de "período activo" que casi todos los demás hooks consultan para mostrar el período académico vigente.

## `services/programas/programaAPI.ts`

`programaService`: `listarProgramas`, `obtenerPrograma(id)`, `crearPrograma`, `actualizarPrograma`, `eliminarPrograma` sobre `/programas/`.

## `services/sedes/sedeAPI.ts`

`sedeService`: `listarSeccionales()` (GET `/seccionales/`), `listarSedes`, `obtenerSede(id)`, `crearSede`, `actualizarSede`, `eliminarSede` sobre `/sedes/`. El modelo `Sede` tiene compatibilidad dual `ciudad`/`seccional_ciudad` (alias legacy).

## `services/recursos/recursoAPI.ts`

- `recursoService`: `listarRecursos` (normaliza array/`{recursos}`/`{results}`), `obtenerRecurso(id)`, `crearRecurso`, `actualizarRecurso` (PATCH), `eliminarRecurso` sobre `/recursos/`.
- `espacioRecursoService`: gestiona la relación N:M espacio↔recurso con estado (`disponible|no_disponible|en_mantenimiento`). Endpoints `/espacios-recursos/` y `/espacios-recursos/por-ids/{espacioId}/{recursoId}/`. `listarPorEspacio(espacioId)` combina `listarEspacioRecursos()` + `listarRecursos()` en cliente para enriquecer con nombre. Consumido intensivamente por `useAperturaCierre.ts` y `useSupervisorSalonHome.ts` (ver [HOOKS_ESPACIOS.md](HOOKS_ESPACIOS.md)) para el checklist de revisión de recursos al cerrar un salón.

## `services/espacios/tipoEspacioAPI.ts`

`tipoEspacioService`: `crearTipoEspacio`, `listarTiposEspacio`, `obtenerTipoEspacio(id)` sobre `/tipos-espacio/`.
