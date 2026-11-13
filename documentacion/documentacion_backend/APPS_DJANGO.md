# Apps Django del backend (`backend/`)

Django 5.2.7 + Django REST Framework, sirviendo tanto la API académica como el módulo financiero. Ver también [../documentacion_oracle/INTEGRACION_ETL_ORACLE.md](../documentacion_oracle/INTEGRACION_ETL_ORACLE.md) para el ETL, y [../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md](../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md) para la app puente `chatbot`.

## Stack y dependencias clave (`backend/requirements.txt`)

- `Django==5.2.7`, `djangorestframework==3.15.2`, `django-filter`, `django-cors-headers==4.6.0`.
- `django-allauth==65.2.0` → login social con Microsoft (OAuth), opcional.
- `psycopg2-binary==2.9.10` → driver PostgreSQL (base de datos operativa).
- `oracledb>=2.0.0` → driver Oracle, usado **solo** por los comandos ETL.
- `smbprotocol==1.15.0` → acceso a NAS compartido para documentos financieros.
- `reportlab`, `pypdf`, `openpyxl`, `Pillow` → generación de PDF/Excel/imágenes (reportes, facturas).
- `gunicorn` (producción), `werkzeug`, `cryptography`, `requests`.

Proyecto Django raíz: `backend/nucleo/` (contiene `settings.py`, `urls.py`, y no es una app de dominio sino el núcleo transversal: autenticación de sesión, permisos, middleware, seeders).

Los ViewSets DRF de cada app están en `<app>/viewsets.py` (sedes, facultades, programas, grupos, asignaturas, espacios, horario, usuarios y recursos) y se registran en el router de `config/urls.py`.

## Apps Django

Las apps se agrupan por dominio en `backend/<dominio>/<app>/`, cada una con su `models.py`/`views.py`/`urls.py` estándar. El nombre interno de cada app (`label`) no cambió, por lo que las migraciones, las tablas y las referencias de modelo (`'usuarios.Usuario'`) siguen igual; solo cambia la ruta de importación (por ejemplo `from identidad.usuarios.models import Usuario`). Ver [../general/ARQUITECTURA_OBJETIVO.md](../general/ARQUITECTURA_OBJETIVO.md).

| Dominio (carpeta) | Apps |
|---|---|
| `identidad/` | `usuarios`, `componentes` |
| `academico/` | `sedes`, `facultades`, `programas`, `asignaturas`, `grupos`, `periodos`, `horario` |
| `instalaciones/` | `espacios`, `recursos`, `prestamos` |
| (en la raíz de `backend/`) | `config`, `nucleo`, `chatbot`, `notificaciones`, `financiero` |

| App | Responsabilidad |
|---|---|
| `config` | Proyecto Django: `settings.py`, `urls.py`, `wsgi.py` y `asgi.py`. |
| `nucleo` | Núcleo transversal: autenticación de sesión custom (`seccional_auth.py`), helpers de roles (`auth_helpers.py`), permisos DRF (`permissions.py`), middleware de sede (`middleware.py`), vistas de auth (`auth_views.py`), adaptador OAuth (`social_adapter.py`), filtro Oracle por seccional (`oracle_seccional_filter.py`), seeders (`management/commands/seed_initial_data.py` + `seeders/*`). |
| `usuarios` | Modelo `Usuario` (custom, login por `correo`), `Rol`, staging Oracle de docentes/estudiantes, comandos ETL relacionados. `sesion.py`: inicio de sesión con bloqueo por intentos, estado de la sesión y cambio de contraseña, sin depender de la petición HTTP. |
| `componentes` | Sistema de permisos dinámico: `Componente`, `ComponenteRol`, `ComponenteUsuario`. Ver [AUTENTICACION_Y_PERMISOS.md](AUTENTICACION_Y_PERMISOS.md). |
| `sedes` | `Sede`, `Seccional` (Bogotá, Cali, Barranquilla, Cúcuta, Cartagena, Pereira, El Socorro, Virtual, Nacional) + ETL. |
| `facultades` | Facultades académicas. |
| `programas` | Programas académicos + ETL Oracle. |
| `periodos` | Periodos académicos (usado también como filtro global `ETL_PERIODO`). |
| `grupos` | Grupos académicos + staging Oracle. |
| `asignaturas` | Asignaturas y su relación con programas + ETL. |
| `horario` | Núcleo de horarios académicos, ETL Oracle, reportes de horarios sin espacio asignado. `exportaciones.py`: archivos PDF y Excel de horarios (por grupo y por docente; también la descarga de Mi horario). |
| `espacios` | Espacios físicos (aulas, laboratorios), `EspacioPermitido` (autorización de supervisores), ETL Oracle. `reportes/` (paquete): cálculos de los reportes (ocupación semanal, ocupación por jornada, más usados, disponibilidad y capacidad, con la semana y la carga de datos en `_semana.py`) sin depender de la petición. `reportes_pdf.py`: los PDF de esos reportes a partir de los datos ya calculados. |
| `recursos` | Recursos/equipos asociados a espacios. |
| `prestamos` | Préstamos de espacios/recursos, lógica de disponibilidad (`availability.py`). |
| `chatbot` | App puente Django ↔ servicio FastAPI: `api_views.py`/`api_urls.py` actúan de proxy hacia `CHATBOT_FASTAPI_URL`. |
| `notificaciones` | Notificaciones vía señales Django (paquete `signals/`, un módulo por dominio), consumidas por el frontend con polling cada 30s. Ver `backend/notificaciones/README.md` para el detalle completo de tipos de evento y prioridades. |
| `financiero` | Módulo de facturación institucional. Ver [MODULO_FINANCIERO.md](MODULO_FINANCIERO.md). `flujo_factura/` (paquete, uno por quién actúa): pasos del flujo de la factura (crear, radicar, causar, alistar, auditoría, Dirección Financiera, Rectoría, control y registro del pago, devolución y corrección), con su historial y notificaciones. `archivos.py`: archivos que genera el módulo (expediente consolidado con portada, archivo plano convertido a PDF, reporte financiero en Excel y PDF). |

## Documentos relacionados en esta carpeta

- [AUTENTICACION_Y_PERMISOS.md](AUTENTICACION_Y_PERMISOS.md) — RBAC dinámico por componente, sesiones, OAuth.
- [CONFIGURACION_SETTINGS.md](CONFIGURACION_SETTINGS.md) — `settings.py`: base de datos, apps instaladas, middleware, variables de entorno.
- [MODULO_FINANCIERO.md](MODULO_FINANCIERO.md) — modelo de facturación institucional.
- [TESTS_Y_SEEDERS.md](TESTS_Y_SEEDERS.md) — tests existentes y seeders de datos.
