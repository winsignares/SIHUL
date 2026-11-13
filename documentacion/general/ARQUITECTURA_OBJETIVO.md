# Arquitectura objetivo de SIHUL

Documento de decisiones. Describe hacia dónde se lleva el sistema y en qué orden, sin cambiar todavía el código. Cada paso de la
hoja de ruta (sección 8) se hace en un PR propio hacia `develop`, sin apilar PR y con la suite completa de pruebas en verde.

## 1. Decisiones tomadas

| # | Decisión | Detalle |
|---|---|---|
| 1 | **Monolito modular** | Un solo despliegue de Django, con límites claros entre dominios. No se separa en microservicios. |
| 2 | **Dominios en vez de una app por tabla** | Las 16 apps de la raíz se agrupan en 6 dominios (sección 3). |
| 3 | **Archivos cortos por recurso** | Un error en un endpoint se corrige en un archivo pequeño (sección 4). |
| 4 | **Un solo origen público** | El frontend habla con un único dominio. El chat de preguntas va por una ruta que nginx envía directo al servicio del chatbot; la gestión del chatbot pasa por Django (sección 5). |
| 5 | **Oracle como fuente de lectura** | Los datos académicos vienen de las vistas de Oracle y SIHUL conserva lo que él mismo escribe. Se diseña en [documentacion_oracle/INVENTARIO_VISTAS_Y_ESTRATEGIA.md](../documentacion_oracle/INVENTARIO_VISTAS_Y_ESTRATEGIA.md). |
| 6 | **Escalar horizontalmente** | Varias copias del backend deben poder atender cualquier petición (sección 6). |
| 7 | **Módulo de asistencia con ubicación** | Se prepara como un dominio nuevo, separado del resto (sección 7). |

## 2. Qué hay hoy

- **Backend:** 16 apps en la raíz de `backend/`. `financiero` concentra 49 archivos de código en una sola app y `mysite` 60.
- **Servicios desplegados:** `db` (PostgreSQL), `redis`, `backend` (Django), `chatbot` (FastAPI), `frontend` y un trabajo de
  `release` que corre las migraciones.
- **Trabajo pesado:** no hay un proceso en segundo plano. Las cargas desde Oracle son comandos de `manage.py` y las
  exportaciones se generan dentro de la petición.
- **Frontend:** organizado por `features/` (chatbot, dashboard, espacios, financiero, gestionAcademica, horarios, permisos,
  prestamos, reporte, users) y solo consume la API del backend.

## 3. Dominios

El nombre interno de cada app (`label`) **no cambia**: así las migraciones y las tablas siguen iguales. Solo se mueve el
código a una carpeta de dominio y se declara el `label` en su `AppConfig`.

| Dominio | Apps actuales que lo forman | Responsabilidad |
|---|---|---|
| `identidad` | `usuarios`, `componentes` | Cuentas, roles, permisos por componente, sesiones |
| `academico` | `sedes`, `facultades`, `programas`, `asignaturas`, `grupos`, `periodos`, `horario` | Estructura académica y horarios |
| `instalaciones` | `espacios`, `recursos`, `prestamos` | Espacios físicos, recursos y préstamos (el nombre del dominio evita repetir el de la app `espacios`) |
| `financiero` | `financiero` (se parte por subdominio) | Facturas, proveedores, flujo de aprobación, catálogos |
| `chatbot` | `chatbot` | Gestión de asistentes, documentos y conversaciones |
| `notificaciones` | `notificaciones` | Avisos a los usuarios |
| `integraciones/oracle` | (nuevo) | Lectura de las vistas de Oracle (ver documento de Oracle) |
| `asistencia` | (nuevo, futuro) | Asistencia con ubicación en prácticas |

`mysite` queda como proyecto de configuración (ajustes, rutas raíz, utilidades transversales) y se le sacan las piezas que
son de un dominio.

### Subdominios de `financiero`

`catalogos` (bancos, ciudades, cuentas, centros de costo), `proveedores`, `facturas` (registro, archivos, historial),
`flujo` (contabilidad, tesorería, auditoría, dirección, rectoría, devolución), `sla` y `usuarios_financieros`.

## 4. Estructura dentro de un dominio

```
dominio/
  apps.py
  modelos/        un archivo por entidad o grupo pequeño de entidades
  api/<recurso>/  listar.py · crear.py · actualizar.py · acciones.py   (solo HTTP: validar, llamar al servicio, responder)
  servicios/      reglas de negocio, sin HTTP ni consultas sueltas
  repositorios/   consultas a la base de datos
  tests/
```

Reglas de dependencia (solo hacia abajo):

1. `api` llama a `servicios`.
2. `servicios` llama a `repositorios` y a los servicios públicos de otros dominios.
3. `repositorios` solo conocen los modelos de su propio dominio.
4. Un dominio **no** importa los modelos de otro dominio: pide el dato por un servicio público.

Objetivo práctico: ningún archivo de `api/` pasa de unas 100 líneas, de modo que un endpoint con un error se localiza y se
corrige en un solo archivo.

### Frontend

Se refleja la misma división: `features/<dominio>/` con `pages`, `components`, `hooks`, `services` y `models`, y una carpeta
`shared/` para lo transversal. En `financiero` hoy las páginas se organizan por rol (`admin_financiero`, `auditoria`,
`tesoreria`…); pasan a organizarse por capacidad (facturas, proveedores, SLA, flujo) y el rol solo decide qué se muestra.

## 5. Un solo origen público

| Ruta pública | Destino | Uso |
|---|---|---|
| `/api/...` | Django | Toda la API de la aplicación, incluida la gestión del chatbot |
| `/chatbot-api/v1/directo/preguntas` | FastAPI (chatbot), exactamente esa ruta | Pregunta al asistente con un token corto que emite Django |
| el resto del servicio del chatbot | no se publica | Solo accesible dentro de la red interna |

Django sigue siendo la puerta de autenticación (emite el token y valida permisos). El chat directo queda desactivado hasta
configurar `CHATBOT_TOKEN_SECRET`; si se desactiva, el frontend vuelve a preguntar por Django sin cambios.

## 6. Escalar horizontalmente

| Requisito | Estado hoy | Qué falta |
|---|---|---|
| Backend sin estado local | Sesiones en la base de datos; archivos subidos en un volumen local | Sesiones en Redis; archivos en almacenamiento compartido |
| Migraciones fuera del arranque | Existe el trabajo `release` | — |
| Límites por usuario en Redis | Existe en el chatbot | Extenderlo a los endpoints costosos del backend |
| Trabajo en segundo plano | No existe | Cola de tareas con un proceso trabajador (exportaciones, notificaciones, sincronizaciones) |
| Conexiones a la base | Conexiones persistentes configurables | Un agrupador de conexiones cuando haya varias copias |
| Chequeos de salud | Parciales | `liveness` y `readiness` por servicio, para que el balanceador saque una copia que falla |

## 7. Asistencia con ubicación (prácticas)

Dominio nuevo `asistencia`, independiente del resto.

- **Lugares de práctica:** nombre, coordenadas, radio permitido y horario.
- **Evento de asistencia:** el estudiante confirma al llegar; el servidor valida distancia y precisión de la lectura.
- **Seguimiento mientras la página está abierta:** se reportan posiciones; si sale del radio fuera de horario se genera una
  notificación al responsable.
- **Límite de la versión web:** el navegador solo entrega la ubicación mientras la página está abierta. El seguimiento con la
  pantalla apagada requiere una aplicación instalada. Se deja el modelo de datos y la API listos para ambos casos.
- **Protección de datos:** consentimiento explícito, finalidad limitada, conservación acotada y acceso restringido (Ley 1581 de
  2012). La ubicación nunca se registra fuera del horario de la práctica.

## 8. Hoja de ruta

Un PR por paso, sin apilar. **Oracle se deja para el final:** primero se ordena todo lo demás y después se define la lectura de
las vistas (decisión del 13 de noviembre de 2026).

1. Este documento y el de Oracle (sin código).
2. Reagrupar el backend por dominio conservando los `label` y las migraciones (`identidad`, `academico`, `instalaciones`).
3. Partir `financiero` (backend y frontend) por subdominio y capacidad.
4. Archivos cortos por recurso en `api/` (un dominio por PR).
5. Cola de tareas, sesiones en Redis y almacenamiento compartido.
6. Dominio `asistencia` (backend y frontend).
7. **Oracle** (último): comando de solo lectura para confirmar las columnas reales de las vistas, interfaz de la fuente académica
   (local y Oracle) detrás de un interruptor, lectura bajo demanda de docentes y estudiantes, después horarios, grupos y
   espacios, y retiro de la carga programada.
