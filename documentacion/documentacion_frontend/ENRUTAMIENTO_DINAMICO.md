# Enrutamiento dinámico basado en componentes/roles

Ver también [ESTRUCTURA_Y_STACK.md](ESTRUCTURA_Y_STACK.md) y [../documentacion_backend/AUTENTICACION_Y_PERMISOS.md](../documentacion_backend/AUTENTICACION_Y_PERMISOS.md) (contraparte backend de este sistema).

Este es el patrón arquitectónico central del frontend (documentado también, con más diagramas, en `../ARQUITECTURA_COMPLETA_ANALISIS.md` y `../REFERENCIA_RAPIDA.md`).

## `context/AuthContext.tsx`

- Estado persistido en `localStorage` (no `sessionStorage`): `auth_token`, `auth_user`, `auth_role`, `auth_components`, `auth_faculties`, `auth_sede`, `auth_areas`, `auth_signature`.
- `login()`: llama a `authService.login`, limpia cachés previas y persiste el nuevo estado.
- Al montar, hidrata la sesión existente vía `authService.getAuthenticatedUser()` — soporta tanto login OAuth (redirect) como refresco de página.
- `hasPermission(componentName)` / `hasEditPermission(componentName)`: búsquedas O(1) contra `Map`/`Set` memoizados.
- **Sincronización periódica cada 7 segundos**: llama a `authService.getSessionAuthState(signature)`; si el backend indica `changed: true`, actualiza rol/componentes en caliente sin recargar la página. Solo corre si la pestaña está visible, y también se dispara al recuperar el foco.

## `config/componentRoutes.ts`

- `COMPONENT_ROUTES`: diccionario nombre-de-componente-exacto → ruta frontend. Cubre todo el módulo académico y todo el financiero (un dashboard/vista por cada rol: funcionario, contabilidad, tesorería, auditoría, dirección financiera, rectoría, admin financiero, proveedor).
- `COMPONENT_ICONS`: mismo mapeo pero a íconos Lucide.
- `getRouteForComponent()`: resuelve ruta exacta; si no hay coincidencia, aplica heurísticas de texto normalizado para inferir a qué dashboard financiero pertenece un componente nuevo no registrado explícitamente; como último recurso genera una ruta dinámica `/componentes/{slug}` resuelta por `pages/shared/DynamicComponentPage.tsx`.

## `router/AppRouter.tsx`

- `ProtectedRoute`: bloquea acceso si el usuario no está autenticado o si `!hasPermission(requiredComponent)`, mostrando "Acceso Denegado".
- Calcula `homeRoute` según rol + componentes existentes, con precedencia especial para roles financieros (`admin_financiero` > `rectoria` > `direccion_financiera` > `tesoreria` > `auditoria` > `contabilidad` > `proveedor` > `funcionario`).
- Usa `context/financialRoleUtils.ts` (`normalizeFinancialRole`/`resolveCanonicalFinancialRole`) para mapear el rol crudo del backend a un rol canónico financiero y proteger rutas sensibles (`/financiero/rectoria/*`, `/financiero/direccion-financiera/*`, `/financiero/admin-financiero/*`) con una verificación adicional además de `ProtectedRoute`.
- Todas las páginas se cargan con `lazy()` + `Suspense` (code-splitting).
