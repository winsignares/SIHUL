# Services: Préstamos y Reporte

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_ESPACIOS.md](HOOKS_ESPACIOS.md) y [HOOKS_REPORTE.md](HOOKS_REPORTE.md).

## `services/prestamos/prestamoAPI.ts`

`prestamoService`: `listarPrestamos({ includeOcurrencias? })`, `listarTodosPrestamosAdmin()`, `listarPrestamosSupervisor()` (GET `/prestamos/supervisor/espacios-prestamos/`), `listarPrestamosPorUsuario(usuarioId)` (filtra en cliente), `obtenerPrestamo(id)`, `crearPrestamo`, `actualizarPrestamo`, `eliminarPrestamo`. Todos sobre `/prestamos/espacios/`.

Maneja lógica de recurrencia compleja (`buildRecurrencePayload`: frecuencia `daily/weekly/monthly/yearly/weekdays`, fin de repetición por fecha/conteo/nunca). Al crear/actualizar/eliminar llama `notifyPrestamosChanged()` de `prestamosChanges.ts`.

## `services/prestamos/prestamosChanges.ts`

No es un cliente API: pub/sub simple. `notifyPrestamosChanged()` limpia el cache `prestamos-espacios-admin`, dispara `CustomEvent('sihul:prestamos-changed')` y escribe un timestamp en `localStorage['sihul_prestamos_changed_at']` para sincronizar entre pestañas vía el evento `storage`.

## `services/prestamos/prestamosPublicAPI.ts` (417 líneas)

`prestamosPublicAPI`: `listarTiposActividad`, `listarEspaciosDisponibles(fecha, horaInicio, horaFin, sede_id?)`, `crearSolicitud`, `listarPrestamosPublicos`, `listarMisSolicitudes(identificacion, correo)` (filtra en cliente por correo+identificación normalizados), `actualizarSolicitud`, `obtenerSolicitud(id)`, `eliminarSolicitud(id)`. Base `/prestamos/publicos/` y `/prestamos/public/...`. Mismo manejo de recurrencia que `prestamoAPI.ts`. Es el servicio consumido por el flujo público de reserva de espacios (sin login).

## `services/prestamos/tipoActividadAPI.ts`

`tipoActividadService`: `listarTiposActividad`, `crearTipoActividad` sobre `/prestamos/tipos-actividad/`.

## `services/reporte/` (4 archivos, todos clases con instancia singleton exportada — patrón distinto al resto, que usa objetos literales)

- `capacidadAPI.ts` → `capacidadService.getCapacidad(semanaOffset, estadoHorario)`: GET `/espacios/reporte/capacidad/`.
- `disponibilidadAPI.ts` → `disponibilidadService.getDisponibilidad(semanaOffset, estadoHorario)`: GET `/espacios/reporte/disponibilidad/`.
- `ocupacionSemanalAPI.ts` → `ocupacionSemanalService`: `getOcupacionSemanal(tipoEspacioId?, semanaOffset)` (GET `/espacios/ocupacion/semanal/`), `getTiposEspacio()`, `generarPDFOcupacion(...)` (usa `trackedFetch` crudo, no `apiClient`, porque maneja el blob de descarga manualmente con un enlace `<a>` + `URL.createObjectURL`).
- `reporteOcupacionAPI.ts` → `reporteOcupacionService.getOcupacionReporte(semanaOffset, estadoHorario)`: GET `/espacios/reporte/ocupacion/`.

Todos aceptan `estado_horario: 'aprobado'|'pendiente'|'todos'` como filtro — patrón consistente en todo el módulo de reportes/ocupación.

## `services/publicServices.ts`

`publicServices`: `verifyRecaptcha(token)` (POST `/prestamos/public/recaptcha/`), más 4 stubs (`consultaHorario`, `disponibilidadEspacios`, `prestamo`, `asistenteVirtual`) que **probablemente no reflejan los endpoints reales usados** — los flujos públicos reales de esas 4 áreas usan servicios más específicos (`prestamosPublicAPI`, `espacioHorariosService`, `chatbotAPI`). Verificar vigencia antes de documentar como fuente de verdad.
