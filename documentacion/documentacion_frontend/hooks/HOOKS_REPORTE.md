# Hooks: Reporte (`frontend/src/hooks/reporte/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_REPORTES_PERMISOS_USUARIOS.md](PAGINAS_REPORTES_PERMISOS_USUARIOS.md) y [SERVICES_PRESTAMOS_REPORTE.md](SERVICES_PRESTAMOS_REPORTE.md).

## `useReportes.ts` (876 líneas) — el hook más grande de `reporte/`

Usado en `pages/reporte/Reportes.tsx`. Combina 5 tipos de reporte en un solo hook: ocupación, horarios-docente, horarios-programa, disponibilidad, capacidad.

- Servicios: `reporteOcupacionService`, `disponibilidadService`, `capacidadService` (los tres en `services/reporte/`), `horarioService.listExtendidos`, `programaService`, `periodoActivoService`, `userService.listarDocentes`.
- Exportación PDF vía backend (`/espacios/reporte/{ocupacion,disponibilidad,capacidad}/pdf/`, `/horarios/exportar-pdf{,-docente}/`) usando `trackedFetch` de `core/apiActivity.ts` **directamente**, no `apiClient` (ver [SERVICES_CORE.md](SERVICES_CORE.md)). Exportación Excel local con `exceljs` para los reportes sin endpoint backend dedicado.
- Cache por `estadoReporte` (aprobado/pendiente/todos) y por `userScope`.
- Filtra programas visibles según facultad si el rol es `planeacion_facultad` — lógica hardcodeada por nombre de facultad, marcada explícitamente como "demo" en el código fuente.

## `useOcupacionSemanal.ts` (251 líneas)

Usado en `pages/reporte/OcupacionSemanal.tsx`. Dashboard de ocupación semanal por tipo de espacio.

- Servicios: `ocupacionSemanalService`, `periodoActivoService`.
- Cache en 3 claves separadas (período, tipos, data-por-tipo-y-período).

## `useConsultaOcupacion.ts` y `useConsultaReportes.ts`

Variantes adicionales para roles de consulta/rol restringido. Mismos servicios de `services/reporte/`. Usados en `pages/reporte/ConsultaOcupacion.tsx` y `pages/reporte/ConsultaReportes.tsx`.
