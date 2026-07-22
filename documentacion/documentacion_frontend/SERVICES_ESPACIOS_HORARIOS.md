# Services: Espacios y Horarios

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_ESPACIOS.md](HOOKS_ESPACIOS.md) y [HOOKS_HORARIOS.md](HOOKS_HORARIOS.md).

## `services/espacios/espaciosAPI.ts` (459 líneas — el service más grande fuera de financiero)

- `espacioService`: CRUD completo + `listTipos()`, `getEstado(id)`, `getHorario(id)`, `cambiarEstado(id, estado)` (PUT `/espacios/{id}/estado/`), `cambiarApertura(id, bool)` / `abrirSalon` / `cerrarSalon` (POST `/espacios/{id}/abrir|cerrar/`).
- `espacioPermitidoService`: CRUD de asignación espacio↔usuario supervisor, `listByUsuario(usuario_id)`.
- `espacioHorariosService`: endpoints "bulk" para pantallas públicas/supervisor con horarios embebidos: `getAllWithHorarios`, `getAllDisponiblesWithHorarios` (ambos `requiresAuth: false`), `getSupervisorHorarios(usuarioId)`, `getSupervisorDisponiblesHorarios(usuarioId)`.
- `aperturaCierreService.getProximos()`: GET `/espacios/apertura-cierre/proximos/?user_id=`.
- Alias: `export const espaciosAPI = espacioService`.

## `services/horarios/horariosAPI.ts` (482 líneas)

- `horarioService`: CRUD sobre `/horarios/`, más:
  - `createConFlujoSolicitud` (alias de `create` — el backend decide internamente si crea el horario directo o como solicitud pendiente, según el rol del usuario).
  - `listExtendidos({ includePending?, estado? })`: GET `/horarios/list/extendidos/` con query `estado_horario` o `include_pending=1`.
  - `miHorario(usuarioId)` / `miHorarioEstudiante(usuarioId)`: GET `/horarios/mi-horario/` y `/horarios/mi-horario-estudiante/`.
  - Exportaciones: `exportarPdfPrograma/Docente`, `exportarExcelPrograma/Docente` (POST con `{ horarios }` en el body, retorna Blob), `exportarPdfUsuario/exportarExcelUsuario` (GET con query `usuario_id`).
  - `horariosPorPeriodo(periodoId, estado?)`: GET `/horarios/por-periodo/?periodo_id=&estado=` (con `suppressErrorLog: true`, porque frecuentemente no hay horarios para el período consultado).
- `horarioFusionadoService`: CRUD sobre `/horarios-fusionados/`. Los "horarios fusionados" son grupos combinados que comparten espacio/horario — se crean automáticamente en el backend vía señal cuando se crea un `Horario` con múltiples grupos.

## `services/horarios/asignacionEspaciosService.ts`

`asignacionEspaciosService`: `getHorariosSinEspacio(filters)` (GET `/horarios/sin-espacio/` con 9 filtros posibles en query), `getEspaciosDisponiblesPorHorario(params)` (GET `/espacios/disponibles/por-horario/`), `asignarEspacioHorario(payload)` / `actualizarEspacioHorario` (alias, POST `/horarios/asignar-espacio/`).

## `services/horarios/solicitudEspacioAPI.ts`

`solicitudEspacioService`: `list(estado?)` / `listPendientes()` (filtran en cliente sobre GET `/solicitudes-espacio/` — no hay filtro server-side por estado), `aprobar(payload)` (POST `/solicitudes-espacio/aprobar/`), `rechazar(payload)`.
