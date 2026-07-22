# Hooks: Horarios (`frontend/src/hooks/horarios/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_HORARIOS_ESPACIOS_PRESTAMOS.md](PAGINAS_HORARIOS_ESPACIOS_PRESTAMOS.md) y [SERVICES_ESPACIOS_HORARIOS.md](SERVICES_ESPACIOS_HORARIOS.md).

## `useMiHorario.ts` (207 líneas)

Usado en `pages/horarios/MiHorario.tsx`, y consumido indirectamente por `useConsultorDocente`/`useConsultorEstudiante` (ver [HOOKS_DASHBOARD.md](HOOKS_DASHBOARD.md)). Horario personal de docente/estudiante.

- Servicio: `horarioService.miHorario(userId)` / `miHorarioEstudiante(userId)`, más exportación PDF/Excel (`exportarPdfUsuario`, `exportarExcelUsuario`).
- Cache por `userScope` (rol + id de usuario).

## `useConsultaHorario.ts` (291 líneas) y `useConsultaHorarios.ts` (170 líneas)

Dos hooks distintos con nombres casi idénticos:
- `useConsultaHorario.ts` (singular): vista dual programa/docente con modales.
- `useConsultaHorarios.ts` (plural): tabla filtrable simple.

Ambos llaman `horarioService.listExtendidos()` y `periodoActivoService.getPeriodoActivo()`; el singular además usa `programaService`/`userService.listarDocentes()`. Usados en las páginas de consulta de horarios (público y `pages/horarios/ConsultaHorarios.tsx` respectivamente — verificar cuál exacto en cada página al usarlos).

## `useVisualizacionHorarios.ts` (196 líneas) — legacy

> **Deuda técnica**: usa `db.getFacultades/getProgramas/...` (`services/database.ts`) y lee horarios directamente de `localStorage.getItem('horariosCompletos')`, no del backend. Usado en `pages/horarios/VisualizacionHorarios.tsx`. Ver [SERVICES_LEGACY.md](SERVICES_LEGACY.md).

## `useAsignacionEspaciosSeccional.ts` (312 líneas)

Usado en `pages/gestionAcademica/AsignacionEspaciosSeccionalPage.tsx`. Asigna espacios a horarios sin espacio, filtrado por la seccional del usuario.

- Servicio: `asignacionEspaciosService` (`services/horarios/asignacionEspaciosService.ts`), más `programaService`, `grupoService`, `asignaturaService`, `periodoService`.
- Cache de filtros y de horarios por `seccionalId + periodoId`.
