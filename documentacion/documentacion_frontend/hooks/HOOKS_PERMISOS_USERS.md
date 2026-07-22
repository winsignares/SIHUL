# Hooks: Permisos y Usuarios (`frontend/src/hooks/permisos/`, `frontend/src/hooks/users/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_REPORTES_PERMISOS_USUARIOS.md](PAGINAS_REPORTES_PERMISOS_USUARIOS.md) y [SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md](SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md).

## `hooks/permisos/useGestionRoles.ts` (149 líneas)

Usado en `pages/permisos/GestionRoles.tsx`. CRUD de roles + paginación local (5 por página) + búsqueda.

- Servicio: `rolService` (`services/users/authService.ts`).
- Cache: `permisos-gestion-roles-v3`. Al mutar, también limpia el cache homónimo usado por `gestionAcademica` (`gestion-academica-roles-v3`) y dispara `ROLES_UPDATED_EVENT`.
- **Existen dos hooks de roles independientes** (este y el `loadRoles` embebido en `useGestionUsuarios.ts`, ver [HOOKS_GESTION_ACADEMICA.md](HOOKS_GESTION_ACADEMICA.md)) que se sincronizan solo vía evento global, sin compartir código.

## `hooks/permisos/useComponentesRoles.ts` (279 líneas)

Usado en `pages/permisos/ComponentesRoles.tsx`. Gestiona asignaciones componente↔rol↔permiso (`VER`/`EDITAR`) — es la UI del sistema RBAC dinámico documentado en [../documentacion_backend/AUTENTICACION_Y_PERMISOS.md](../documentacion_backend/AUTENTICACION_Y_PERMISOS.md).

- Servicios: `componenteService`, `componenteRolService` (`services/componentes/componentesAPI.ts`), `rolService`.
- Cache: `permisos-componentes-roles`.

## `hooks/users/useLogin.ts` (159 líneas)

Usado en `pages/users/Login.tsx`.

- Implementa **lockout de 120 segundos tras HTTP 429** (persistido en `localStorage['login_lockout_until']`, con cuenta regresiva en vivo).
- Acceso público (`handlePublicAccess`): limpia todo `localStorage` y marca `auth_is_public`.
- Login Microsoft: `authService.getMicrosoftLoginUrl()`.
- Depende de `context/AuthContext` (`login`, `isAuthenticated`, `role`, `components`).

## `hooks/users/useAjustes.ts` (285 líneas)

Usado en `pages/users/Ajustes.tsx`. Perfil de usuario + cambio de contraseña + espacios permitidos (si el rol supervisa espacios).

- Servicios: `userService`, `authService` (`getAuthenticatedUser`, `changePassword`), `espacioPermitidoService.listByUsuario`.
- Sincroniza `localStorage['auth_user']` tras guardar cambios.

## `hooks/users/useRegister.ts` (215 líneas)

Usado en `pages/users/Register.tsx`. Registro público con validaciones de formulario (nombre, correo, confirmación de correo/password, sede).

- Servicios: `sedeService.listarSedes()` (con fallback hardcodeado de 12 sedes si falla el fetch), `userService.crearUsuario()` (el usuario se crea sin `rol_id`, pendiente de asignación por un admin).

## `hooks/users/useNotificaciones.ts`

Documentado en [HOOKS_CHATBOT_NOTIFICACIONES.md](HOOKS_CHATBOT_NOTIFICACIONES.md).
