# Services: Usuarios/Auth, Notificaciones y Dashboard

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_PERMISOS_USERS.md](HOOKS_PERMISOS_USERS.md), [HOOKS_CHATBOT_NOTIFICACIONES.md](HOOKS_CHATBOT_NOTIFICACIONES.md) y [HOOKS_DASHBOARD.md](HOOKS_DASHBOARD.md).

## `services/users/authService.ts` (481 líneas) — el servicio real de usuarios/auth

- `authService`: `getMicrosoftLoginUrl()` (retorna URL absoluta al backend, no pasa por `apiClient`), `login(payload)` (POST `/usuarios/login/`, `requiresAuth: false`), `logout()` (GET `/auth/logout/`), `getAuthenticatedUser(options?)` (GET `/auth/user/`, usado para hidratar sesión vía cookie/OAuth), `changePassword`, `getProfile()` (lee `auth_user` de `localStorage` para resolver el ID), `getSessionAuthState(since?)` (GET `/usuarios/session-auth-state/?since=`, sincroniza rol/componentes si cambiaron desde la última firma conocida — es la optimización que consume `AuthContext` cada 7 segundos, ver [ENRUTAMIENTO_DINAMICO.md](ENRUTAMIENTO_DINAMICO.md)).
- `userService`: `listarUsuarios`, `listarDocentes` (GET `/usuarios/docentes/`), `obtenerUsuario(id)`, `crearUsuario`, `actualizarUsuario`, `eliminarUsuario` sobre `/usuarios/`.
- `rolService`: CRUD sobre `/roles/`.

> Este archivo es el servicio de auth real del proyecto — `services/auth.ts` (la clase `AuthService` legacy) es un vestigio no usado en el flujo real. Ver [SERVICES_LEGACY.md](SERVICES_LEGACY.md).

## `services/users/settingsService.ts`

Puramente local (no llama al backend): gestiona preferencias en `localStorage` (`notificaciones_preferencias`, `sistema_config`, `theme`) — notificaciones, idioma/timezone/formato de fecha-hora, tema claro/oscuro. Expone `getAllSettings`, `saveAllSettings`, `resetToDefaults`, `clearAllSettings`.

## `services/notificaciones/notificacionesAPI.ts`

Funciones sueltas, no un objeto de servicio: `crearNotificacion`, `actualizarNotificacion`, `eliminarNotificacion`, `obtenerNotificacion`, `listarNotificaciones(params?)`, `obtenerMisNotificaciones(params)` (paginado, con filtros de búsqueda/tipo/prioridad/tiempo/categoría), `obtenerMisNotificacionesPaginadas`, `obtenerEstadisticas(id_usuario)`, `marcarComoLeida(id)`, `marcarTodasComoLeidas(id_usuario)`, más helpers: `obtenerNotificacionesNoLeidas`, `contarNotificacionesNoLeidas`, `tieneNotificacionesNoLeidas`, `obtenerNotificacionesRecientes`, `obtenerNotificacionesPorPrioridad`. Todos sobre base `/notificaciones`. También exporta un `default` con todo agrupado. Ver `backend/notificaciones/README.md` para el catálogo completo de tipos de evento en el backend.

## `services/dashboard/dashboardAPI.ts`

No es un cliente API típico — agrega lógica de negocio en el frontend:

- `obtenerEstadisticasOcupacion()`: calcula ocupación semanal por franja horaria a partir de `prestamoService.listarPrestamos()` + `espacioService.list()`, sin endpoint de backend dedicado (todo el cálculo de solapamiento de horarios ocurre en JS).
- `obtenerActividadesRecientes()`: transforma `listarNotificaciones()` en un feed de actividad con colores por tipo.
- `obtenerEstadisticasDashboard()`: combina ambos en paralelo.

## `services/dashboard/supervisorDashboardAPI.ts`

`supervisorDashboardService`: `getMetricas()` (cuenta espacios por estado desde `espacioPermitidoService.listByUsuario`), `getAperturaCierre()` (GET `/espacios/apertura-cierre/proximos/?user_id=`), `getDisponibilidad()`, `getMetricasRecursos()` (itera recursos de cada espacio permitido). Resuelve `userId` leyendo `localStorage['auth_user']`/`['user']` directamente, en vez de recibirlo como parámetro.
