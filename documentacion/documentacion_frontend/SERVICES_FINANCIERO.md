# Services: Financiero (`frontend/src/services/financiero/`)

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_FINANCIERO.md](HOOKS_FINANCIERO.md) y [../documentacion_backend/MODULO_FINANCIERO.md](../documentacion_backend/MODULO_FINANCIERO.md).

El módulo con más archivos y con la arquitectura más consistente del frontend: 11 servicios de dominio + una base compartida.

## Base compartida

- `financiero/core/shared.ts` (13 líneas): define `API_BASE = '/financiero'` y `buildQueryString(params)`, helper genérico de query string usado por todos los servicios financieros.
- `financiero/core/index.ts`: solo re-exporta `shared.ts`.
- `financiero/index.ts`: barrel que reexporta los 11 servicios de dominio.

Confirmación: el service financiero refleja la enorme complejidad del backend — es, con diferencia, el dominio con más acciones de negocio (transiciones de estado) expuestas como funciones dedicadas, no solo CRUD genérico.

## `financiero/facturas/facturasAPI.ts` (183 líneas) — el service más grande y complejo del frontend

`facturasService` expone ~25 funciones, reflejando el flujo de aprobación de facturas paso a paso:

- **CRUD base**: `getAll(params)` (paginado con filtros arbitrarios vía `buildQueryString`), `getById`, `create`, `update` (PATCH).
- **Transiciones de flujo** (cada una un POST a una acción del ViewSet DRF, patrón `/{id}/{accion}/`): `radicar`, `causar` (soporta `FormData` si adjunta `soporte_causacion: File`), `alistar`, `enviarDireccionFinanciera`, `cargarDireccionFinanciera`, `enviarRectoria`, `autorizarRectoria`, `rechazarRectoria` (requiere `motivo`), `generarNumeroConfirmacion`, `confirmarControlPago`, `registrarPagoAplicado` (FormData con comprobante bancario), `generarComprobante`, `detenerEnTesoreria`, `aprobarAuditoria`, `rechazarAuditoria`, `rechazar` (genérico, con `destino: 'funcionario'|'radicacion'|'proveedor'` — permite devolver la factura a distintas etapas), `completarRegistro` (PATCH), `corregir` (PATCH tras devolución).
- **Consultas especializadas**: `getByEstado(estado)`, `getPendientes()`, `getEstadisticas()`, `getSeguimiento(id)`, `getNumeroSugerido()` (autogenera consecutivo).
- **Descargas**: `descargarComprobantePdf(id)` → Blob, `getDocumentosConsolidados(id, opts)` → Blob (con query `scope`/`descargar`/`doc_id`), `getDocumentosHistorialZip(id, opts)` → Blob ZIP.

Los nombres de los métodos confirman el ciclo de vida de una factura (coincide con lo observado en `useContabilidadMisPendientes.ts`): **Recepción y Registro → Radicación → Causación → Cargue Formal → Autorización Rectoría → Control Previo → Alistamiento → Control de Pago Bancario → Tesorería (ajustes internos) → Envío a Dirección Financiera → Corrección Dirección Financiera → Pago Aplicado**. Ver el flujo de ~18 estados documentado en [../documentacion_backend/MODULO_FINANCIERO.md](../documentacion_backend/MODULO_FINANCIERO.md).

## `financiero/proveedores/proveedoresAPI.ts`

`proveedoresService`: `getAll`, `getById`, `create`, `update`, `delete`, `getMiPerfil(nit?)` (perfil del proveedor autenticado), `getMisFacturas(proveedorId, params?)` (filtra facturas por proveedor), `crearConUsuario(data)` (POST `/financiero/proveedores/crear_con_usuario/` — crea usuario + proveedor en una sola transacción, usado por `admin_financiero` al dar de alta un proveedor).

## `financiero/catalogos-proveedores/catalogosProveedoresAPI.ts`

`catalogosProveedoresService`: catálogos geográficos/bancarios de solo lectura para formularios de proveedor: `getPaises`, `getDepartamentos({pais_id?, ciudad_id?})`, `getCiudades({pais_id?, departamento_id?})`, `getBancos`, `getTiposCuenta`.

## `financiero/departamentos/departamentosAPI.ts`

`departamentosService`: `getAll`, `getById`, `getAreasSolicitantes()` (GET `/financiero/departamentos/areas_solicitantes/` — subconjunto de departamentos que pueden generar solicitudes de compra/factura).

## `financiero/cuentas-contables/cuentasContablesAPI.ts` y `financiero/centros-costo/centrosCostoAPI.ts`

Ambos: CRUD simple (`getAll`, `getById`, `create`, `update`, `delete`) — catálogos contables de soporte para la clasificación de facturas (PUC y centros de costo, ver [../documentacion_backend/MODULO_FINANCIERO.md](../documentacion_backend/MODULO_FINANCIERO.md)).

## `financiero/parametros-sla/parametrosSlaAPI.ts`

`parametrosSlaService`: `listar()`, `getResumenProceso()` (calcula en cliente: suma de `dias_maximos` de todas las etapas SLA, si todas aplican días hábiles, y cantidad de etapas). Es el catálogo de tiempos máximos por etapa que alimenta el cálculo de riesgo (`dias_transcurridos`) visto en los hooks de "Mis Pendientes" (ver [HOOKS_FINANCIERO.md](HOOKS_FINANCIERO.md)).

## `financiero/documentos/documentosAPI.ts`

`documentosService`: `getByFactura(facturaId)`, `upload(facturaId, file, tipoDocumento)` (arma `FormData` con metadata: nombre truncado a 100 caracteres, tamaño, tipo MIME), `delete(id)`.

## `financiero/historial/historialAPI.ts`

`historialService`: `getAll(params?)`, `getByFactura(facturaId)` — historial de auditoría/trazabilidad de cambios de estado de una factura (equivalente frontend de `HistorialFactura` en el backend).

## `financiero/comentarios/comentariosAPI.ts`

`comentariosService`: `getByFactura(facturaId)`, `create(facturaId, comentario, tipo)`, `delete(id)` — sistema de comentarios/notas internas sobre una factura.

## `financiero/reportes/reportesAPI.ts` (122 líneas — combina 3 sub-servicios)

- `reportesFinancieroService`: `getDashboardAdmin()` (GET `/financiero/reportes/dashboard_admin/` — retorna `resumen` con KPIs globales, `distribucion_estados`, `alertas` de facturas en riesgo, `actividades` recientes), `exportar(payload)` (POST → Blob, exporta en `Excel|PDF` con filtros de fecha/estado/proveedor), `listarGenerados(params?)`.
- `parametrosSlaAdminService`: variante admin de SLA con `actualizar(id, data)` (PATCH) — a diferencia de `parametrosSlaService` (solo lectura), este permite editar los días máximos por etapa.
- `parametrosFinancieroService`: catálogo de parámetros de configuración general del módulo financiero (`categoria: general|sla|autorizacion|email|sistema|reportes`), con `listar(categoria?)` y `actualizar(id, data)`.
