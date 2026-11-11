# Plan de reestructuración (SOLID / Clean Architecture)

Objetivo: que los cambios futuros sean fáciles y que el sistema soporte más usuarios, **sin cambiar la lógica de negocio
ni el funcionamiento de los módulos**. Se avanza por fases pequeñas, cada una en su propio PR hacia `develop`, con
pruebas de caracterización antes de mover lógica.

Diagnóstico hecho sobre `develop` (noviembre de 2026), con mediciones en el entorno local.

## 1. Diagnóstico

### 1.1 Rutas sin `/api`

El backend publicaba dos juegos de rutas: las de `/api/...` (las que usa el frontend) y unas rutas heredadas sin prefijo
(`sedes/`, `espacios/`, `horario/`, `prestamos/`, `chatbot/`, …) con vistas de función propias. El proxy solo reenvía al
backend `/api/`, `/media/`, `/accounts/`, el panel de administración y cuatro rutas de sesión
(`/api/usuarios/login|logout|session-auth-state|change-password/`, que se reescriben a `/usuarios/<ruta>/`).
Las rutas heredadas no eran alcanzables, pero había que mantener sus reglas de acceso alineadas con las de `/api`.

### 1.2 Duplicados

- Funciones definidas dos veces en el mismo archivo (`horario/views.py`).
- Las mismas funciones copiadas en dos módulos: validación de contraseña, respuesta de «usuario sin seccional», cálculo
  de horas por jornada (reportes de espacios y ocupación semanal) y la regla de documentos sensibles de financiero.
- `espacios/api_adapters.py` y `horario/api_adapters.py`: funciones de una línea que solo reenvían a otra vista.
- El usuario de la sesión se lee dos veces por petición (middleware y autenticación de DRF).

### 1.3 Capas mezcladas

Las vistas concentran reglas de negocio, consultas y armado de archivos:

| Dónde | Qué hay mezclado |
|---|---|
| `mysite/api_views.py` | 18 ViewSets de 9 apps; `UsuarioViewSet` incluye inicio de sesión, bloqueo por intentos y cambio de contraseña |
| `espacios/views.py`, `espacios/api_views.py` | cálculo de ocupación, disponibilidad y capacidad, y generación de PDF |
| `horario/views.py` | generación de PDF y Excel de horarios |
| `prestamos/serializers.py`, `privacidad.py`, `availability.py` | aprobación, recurrencia y privacidad repartidas entre serializer y módulos |
| `financiero/views.py` | flujo de estados de la factura, permisos por rol y manejo de archivos |
| `chatbot/views.py` | llamada HTTP al servicio RAG dentro de la vista |

### 1.4 Consultas y tamaño de respuesta (entorno local)

| Endpoint | Consultas | Tiempo | Tamaño | Causa |
|---|---:|---:|---:|---|
| `GET /api/espacios/ocupacion/semanal/` | 1 714 | ~2,8 s | 42 KB | por cada espacio y día: horarios y préstamos por separado |
| `GET /api/espacios/` | 101 | ~260 ms | 31 KB | `recursos_con_estado` ignoraba la precarga del listado |
| `GET /api/sedes/` | 21 | — | 3 KB | ciudad de la seccional sin `select_related` |
| `GET /api/chatbot/conversaciones/` | 18 | — | 6 KB | anexos (M2M) sin `prefetch_related` |
| `GET /api/prestamos/espacios/` | 14 | — | 3 KB | tipo de espacio y periodo sin `select_related` |
| `GET /api/horarios/list/extendidos/` | 4 | ~130–190 ms | 608 KB | sin paginar |
| `GET /api/horarios/` | 4 | ~120–160 ms | 300 KB | sin paginar |

El resto de los listados que usa el frontend está entre 4 y 10 consultas. Los N+1 crecen con los datos: cada fila más
suma una o más consultas.

### 1.5 Escalabilidad

- Conexión nueva a la base de datos en cada petición (sin `CONN_MAX_AGE`).
- Sesiones en la tabla `django_session` aunque ya hay Redis (`cached_db` evitaría una consulta por petición).
- Listados grandes sin paginar.
- La pregunta al asistente es una llamada síncrona del backend al servicio RAG: mientras responde, ocupa un hilo del
  backend.

### 1.6 Frontend

- `services/` → `hooks/` → `pages/` ya separa capas, pero hay páginas de más de 1 000 líneas (`ConsultaEspacios.tsx`,
  `RegistrarFactura.tsx`, `EnviarFactura.tsx`, `PrestamosEspacios.tsx`, `CentroHorarios.tsx`).
- Algunas llamadas usan `trackedFetch` con la ruta escrita a mano en vez de `apiClient`.
- `tsc` reporta errores previos que no bloquean `vite build`.

### 1.7 Chatbot (FastAPI)

Ya está organizado en `routers/`, `services/`, `schemas/` y `models/`, y es asíncrono. `chat_service.py` mezcla búsqueda,
armado de contexto y llamada al modelo. No tiene pruebas automatizadas.

## 2. Arquitectura objetivo (Django, sin reescribir)

```
<app>/
  models.py         entidades
  selectores.py     consultas de lectura con sus select_related / prefetch_related
  servicios/        casos de uso: reglas de negocio, transacciones, notificaciones
  api/              ViewSets y serializers delgados: validan la forma y llaman a servicios
  alcance.py        reglas de acceso (ya existe en espacios; privacidad.py en préstamos)
```

- La vista no consulta ni decide reglas; el serializer no decide permisos ni estados.
- Los servicios no reciben `request`: reciben el usuario y los datos, así se prueban sin HTTP.
- Las dependencias van hacia adentro: `api` → `servicios` → `selectores` / `models`.
- En el chatbot, el proveedor del modelo de lenguaje queda detrás de una interfaz para poder simularlo en pruebas.

## 3. Fases (ordenadas por riesgo)

| Fase | Contenido | Riesgo |
|---|---|---|
| 1 | Retirar rutas y vistas sin `/api`; unificar duplicados idénticos; prueba que exige que toda ruta esté bajo un prefijo publicado | Muy bajo |
| 2 | N+1 de bajo riesgo en espacios, sedes, conversaciones y préstamos, con pruebas que exigen que las consultas no crezcan con las filas | Bajo |
| 3 | Ocupación semanal y reportes de espacios: cargar la semana en pocas consultas y agrupar en memoria; extraer el cálculo a un módulo propio con pruebas de caracterización de la respuesta actual | Medio |
| 4 | Casos de uso de préstamos y de inicio de sesión; ViewSets de `mysite/api_views.py` a cada app; retirar `api_adapters.py` | Medio |
| 5 | Exportaciones PDF/Excel de horarios y reportes a módulos propios | Medio-bajo |
| 6 | Financiero: el flujo de estados de la factura en un servicio | Medio-alto |
| 7 | Configuración: conexiones persistentes, sesión en caché, ajuste del pool del chatbot | Bajo, requiere revisar el servidor |
| 8 | Paginación de listados grandes (backend y frontend) | Medio: cambia la forma de la respuesta |
| 9 | Frontend: todas las llamadas por `apiClient`, dividir páginas grandes, `tsc` sin errores, rutas con carga diferida | Bajo-medio |
| 10 | Chatbot: pruebas de caracterización y luego separar búsqueda, contexto y proveedor del modelo | Bajo después de las pruebas |

Cada fase:
1. Rama nueva desde `develop` (`refactor/`, `chore/`, `fix/` o `docs/`).
2. Pruebas de caracterización antes de mover lógica.
3. Suite completa del backend en verde; `npm run build` sin errores nuevos de `tsc`.
4. Verificación en el entorno local (comparar respuestas de la API antes y después).
5. PR hacia `develop`. Una fase que depende de otra espera a que la anterior se integre.

## 4. Decisiones pendientes

Estos puntos cambiarían un comportamiento visible y por eso no forman parte de ninguna fase hasta decidirlos:

- Exportar el horario individual (PDF/Excel): hoy incluye horarios en cualquier estado. ¿Solo aprobados?
- Aprobar o rechazar solicitudes públicas desde la pantalla de préstamos de espacios llama a rutas que no existen bajo
  `/api`. ¿Se corrige el frontend para usar `/api/prestamos/publicos/<id>/`?
- ~~Rol `admin_global` sin ser superusuario: ¿ve todas las seccionales o solo la suya?~~ Decidido: ve todas, como el
  superusuario (`auth_helpers.ve_todas_las_seccionales`).
- ~~Permiso EDITAR en «Gestión de Usuarios» para quien no es administrador: ¿qué personas puede gestionar?~~
  Decidido: las de su seccional, sin roles ni cuentas de administración y sin cambiar su propio rol, estado ni
  seccional; con VER consulta la lista de su seccional (`usuarios/gestion.py`).
- Paginación de los listados grandes (cambia la respuesta y el frontend).
- Ajustes de configuración del servidor (fase 7).
- Separar el chat del asistente del resto del backend para que no comparta hilos.
