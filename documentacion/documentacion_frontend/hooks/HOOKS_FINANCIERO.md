# Hooks: Financiero (`frontend/src/hooks/financiero/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_CHATBOT_FINANCIERO.md](PAGINAS_CHATBOT_FINANCIERO.md), [SERVICES_FINANCIERO.md](SERVICES_FINANCIERO.md) y [../documentacion_backend/MODULO_FINANCIERO.md](../documentacion_backend/MODULO_FINANCIERO.md).

Estructura repetida por cada uno de los 8 perfiles financieros: `admin_financiero`, `auditoria`, `contabilidad`, `direccion_financiera`, `funcionario`, `proveedor`, `rectoria`, `tesoreria`.

## Hooks de navegación (`{perfil}/index.ts` + `{perfil}/index/use{Perfil}Dashboard.ts`)

Se repiten idénticos en los 8 perfiles — son simplemente **routers de tabs internos**, sin llamadas API:

- Calculan `activeView` a partir del `pathname` (`useLocation`).
- Exponen `onNavigate(menu)`, que hace `navigate(routes[menu])`.

Ejemplo real: `useAdminFinancieroDashboard.ts` (32 líneas).

## Hooks de negocio (uno por pantalla, con fetching real)

No usan `sessionCache` (a diferencia del resto del proyecto) — recargan siempre al montar. Todos consumen el barrel `services/financiero/index.ts` para acceder a `facturasService`, `documentosService`, `comentariosService`, `historialService`, etc. (ver [SERVICES_FINANCIERO.md](SERVICES_FINANCIERO.md)).

- **`useFuncionarioHome.ts`** (129 líneas): stats (recibidas/pendientes/registradas/en revisión) + actividad reciente. Servicio: `facturasService` (`getAll`, `getEstadisticas`, `getPendientes`).
- **`useContabilidadMisPendientes.ts`** (146 líneas): lista de facturas en estado `Registrada` (excluye `Corrección Funcionario`), con documentos adjuntos por factura y cálculo de nivel de riesgo SLA (`SLA_DIAS_CONTABILIDAD = 12`, niveles verde/amarillo/naranja/vencido). `accionRequerida(factura)` decide la acción disponible según `etapa_actual` del backend. Servicios: `facturasService`, `documentosService`.
- Resto de hooks del mismo patrón (uno por pantalla): `useContabilidadCausarFacturas`, `useContabilidadRadicarFacturas`, `useContabilidadHome`, `useConfirmacionPagos`, `useEnviarRectoria`, `useDireccionFinancieraHome`, `useMisPendientes` (existe duplicado con el mismo nombre en las carpetas `direccion_financiera/` y `rectoria/` — no comparten código), `useRevisarPagos`, `useProveedorHome`, `useAutorizarPagos`, `useRectoriaHome`, `useAuditoriaDashboard`.

## Notas de arquitectura

- El flujo de una factura (ver [../documentacion_backend/MODULO_FINANCIERO.md](../documentacion_backend/MODULO_FINANCIERO.md)) se refleja directamente en los nombres de las acciones que exponen estos hooks (radicar, causar, alistar, enviar a Dirección Financiera, enviar a Rectoría, autorizar, registrar pago aplicado, etc.).
- El cálculo de riesgo SLA en el frontend (ej. `SLA_DIAS_CONTABILIDAD` en `useContabilidadMisPendientes.ts`) se alimenta del catálogo `parametrosSlaService` (ver [SERVICES_FINANCIERO.md](SERVICES_FINANCIERO.md)), que define los días máximos por etapa.
