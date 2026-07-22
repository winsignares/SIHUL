# Autenticación y sistema de permisos (RBAC dinámico por componente)

Ver también [APPS_DJANGO.md](APPS_DJANGO.md) para el listado general de apps del backend.

SIHUL **no usa JWT**: usa sesiones de Django sobre un modelo `Usuario` custom (`AUTH_USER_MODEL = 'usuarios.Usuario'`, login por `correo`).

- **`SessionUsuarioAuthentication`** (`mysite/seccional_auth.py`): clase de autenticación DRF que resuelve `request.user` leyendo `request.session['user_id']`. Es la primera clase en `REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES`.
- **Modelo de permisos**:
  - `Rol`: nombre libre (`admin`, `admin_global`, `docente`, `estudiante`, `supervisor_general`, y los roles financieros: `funcionario`, `contabilidad`, `tesoreria`, `auditoria`, `direccion_financiera`, `rectoria`, `admin_financiero`, `proveedor`).
  - `Componente`: una "pantalla" o funcionalidad con nombre libre (ej. "Gestión de Facturas").
  - `ComponenteRol`: asigna un `Componente` a un `Rol` con `permiso` = `VER` o `EDITAR`.
  - `ComponenteUsuario`: **override individual** — permite ajustar el permiso de un componente para un usuario puntual sin tocar su rol.
- **Endpoint de sesión** (`mysite/auth_views.py`):
  - `user_view`: construye la lista de componentes efectivos del usuario (combinando `ComponenteRol` + overrides), calcula `espacios_permitidos`, genera/reutiliza un **token secreto de sesión** (`secrets.token_urlsafe(32)`) y una **firma** (`_session_signature`, hash corto sobre componentes+rol) que el frontend usa para detectar cambios de permisos sin volver a pedir todo.
  - `logout_view`, `login_success` (redirección tras login OAuth Microsoft).
- **Filtrado multi-sede/seccional**:
  - `SedeFilterMiddleware` (`mysite/middleware.py`): adjunta `request.sede`/`request.sede_id`/`request.seccional`/`request.user_obj` en cada request autenticado.
  - `SeccionalMixin` (`mysite/seccional_auth.py`): mixin para ViewSets DRF que filtra automáticamente los querysets por la seccional del usuario (excepto admins globales/sistema) y completa `sede`/`seccional` al crear registros.
- **Helpers y permisos DRF**: `mysite/auth_helpers.py` (funciones puras: `is_admin_global`, `is_admin_sistema`, `has_any_role`, etc.) usadas por las clases de permiso en `mysite/permissions.py` (`IsAdminGlobal`, `IsAdminSistema`, `IsCoordinador`, `IsDocente`, `IsEstudiante`, `IsSupervisorGeneral`, `IsAuthenticatedReadOnlyOrAdminWrite`...).
- **Microsoft OAuth** (opcional, solo si `MICROSOFT_CLIENT_ID`/`SECRET` están configurados): vía `django-allauth` + adaptador custom `mysite/social_adapter.py`.

> Nota: los documentos `../ARQUITECTURA_COMPLETA_ANALISIS.md` y `../REFERENCIA_RAPIDA.md` explican este mismo flujo con más diagramas y ejemplos de queries; este documento es el resumen técnico ligado directamente al código fuente actual.

Ver también [../documentacion_frontend/ENRUTAMIENTO_DINAMICO.md](../documentacion_frontend/ENRUTAMIENTO_DINAMICO.md) para cómo el frontend consume este sistema de componentes/permisos.
