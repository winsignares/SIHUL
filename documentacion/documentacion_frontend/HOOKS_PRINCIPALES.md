# Hooks transversales (`frontend/src/hooks/*.ts`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md).

Hooks sueltos en la raíz de `hooks/`, usados a través de todo el proyecto (no pertenecen a un dominio específico).

## `useIsMobile.ts`

- Estado: `isMobile: boolean` (`window.innerWidth < 768`, con listener de `resize`).
- Expone: `isMobile` (booleano puro).
- No llama servicios.
- El hook responsivo más usado del proyecto: consumido en 39 archivos, entre ellos `layouts/AdminDashboard.tsx` y prácticamente todas las páginas de `gestionAcademica/`, `horarios/`, `espacios/`, `prestamos/`, `reporte/`, `users/`, `chatbot/`, `dashboard/`. Documentado también en [RESPONSIVE_UPDATES.md](RESPONSIVE_UPDATES.md).

## `useAdminDashboard.ts` (698 líneas)

El hook que arma el sidebar del panel autenticado. Único consumidor: `layouts/AdminDashboard.tsx`.

- Estado: `isSidebarCollapsed` (fijo en `true`), `isSidebarHovered`, `notificacionesSinLeer` (actualmente hardcodeado a `3`, no viene del backend — pendiente de conectar a `useNotificaciones`).
- Expone: `user`, `role`, `userName`, `userRole`, `userFacultyName`, `isSidebarCollapsed`, `isSidebarHovered`, `setIsSidebarHovered`, `shouldShowExpanded`, `notificacionesSinLeer`, `menuSections` (`MenuSection[]`), `handleLogout`, `location`, `isPublicAccess`.
- No llama servicios API — construye el menú en memoria a partir de `useAuth()` (`user`, `role`, `components`, `logout`) y de `config/componentRoutes.ts` (`getRouteForComponent`, `getIconForComponent`) + `context/financialRoleUtils.ts` (`resolveCanonicalFinancialRole`).
- Agrupa los componentes autorizados del usuario en secciones (`Principal`, `Gestión de Espacios`, `Académico`, `Gestión Académica`, `Asistente Virtual`, `Reportes`, `Administración`, `Módulos Asignados`).
- **Los roles financieros tienen ramas de menú completamente hardcodeadas** (`admin_financiero`, `rectoria`, `direccion_financiera`, `tesoreria`, `auditoria`, `funcionario`, `proveedor`, `contabilidad`), cada una con su propio árbol de menú fijo en vez de derivarlo de `components` como el resto de roles. Ver [../documentacion_backend/AUTENTICACION_Y_PERMISOS.md](../documentacion_backend/AUTENTICACION_Y_PERMISOS.md) para el modelo backend de componentes/roles.

## `useErrorHandler.ts`

Dos hooks pequeños:
- `useErrorHandler()`: estado `error`, funciones `handleError`, `clearError`.
- `useAsyncError()`: permite relanzar errores asíncronos para que los capture un Error Boundary de React.

No llama servicios.

## `useRoutes.ts`

- Define `routesByRole` (mapa estático rol → rutas) y el hook `useRoutes()`.
- Sin estado propio; usa `useUser()` de `context/UserContext`.
- Expone: `currentRole`, `getHomeRouteByRole(roleCode)`, `canAccessRoute(path, role)`, `protectedRoutes`.
- Depende de `context/roleUtils.ts` (`normalizeRole`).
- Complementa a `router/AppRouter.tsx` y `config/componentRoutes.ts` — ver [ENRUTAMIENTO_DINAMICO.md](ENRUTAMIENTO_DINAMICO.md) para la lógica principal de enrutamiento.
