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

Proyecto Django raíz: `backend/mysite/` (contiene `settings.py`, `urls.py`, y no es una app de dominio sino el núcleo transversal: autenticación de sesión, permisos, middleware, seeders).

## Apps Django

Cada app vive en `backend/<app>/` con su `models.py`/`views.py`/`urls.py` estándar.

| App | Responsabilidad |
|---|---|
| `mysite` | Núcleo transversal: settings, urls raíz, autenticación de sesión custom (`seccional_auth.py`), helpers de roles (`auth_helpers.py`), permisos DRF (`permissions.py`), middleware de sede (`middleware.py`), vistas de auth (`auth_views.py`), adaptador OAuth (`social_adapter.py`), filtro Oracle por seccional (`oracle_seccional_filter.py`), seeders (`management/commands/seed_all.py` + `seeders/*`). |
| `usuarios` | Modelo `Usuario` (custom, login por `correo`), `Rol`, staging Oracle de docentes/estudiantes, comandos ETL relacionados. |
| `componentes` | Sistema de permisos dinámico: `Componente`, `ComponenteRol`, `ComponenteUsuario`. Ver [AUTENTICACION_Y_PERMISOS.md](AUTENTICACION_Y_PERMISOS.md). |
| `sedes` | `Sede`, `Seccional` (Bogotá, Cali, Barranquilla, Cúcuta, Cartagena, Pereira, El Socorro, Virtual, Nacional) + ETL. |
| `facultades` | Facultades académicas. |
| `programas` | Programas académicos + ETL Oracle. |
| `periodos` | Periodos académicos (usado también como filtro global `ETL_PERIODO`). |
| `grupos` | Grupos académicos + staging Oracle. |
| `asignaturas` | Asignaturas y su relación con programas + ETL. |
| `horario` | Núcleo de horarios académicos, ETL Oracle, reportes de horarios sin espacio asignado. |
| `espacios` | Espacios físicos (aulas, laboratorios), `EspacioPermitido` (autorización de supervisores), ETL Oracle. |
| `recursos` | Recursos/equipos asociados a espacios. |
| `prestamos` | Préstamos de espacios/recursos, lógica de disponibilidad (`availability.py`). |
| `chatbot` | App puente Django ↔ servicio FastAPI: `api_views.py`/`api_urls.py` actúan de proxy hacia `CHATBOT_FASTAPI_URL`. |
| `notificaciones` | Notificaciones vía señales Django (`signals.py`), consumidas por el frontend con polling cada 30s. Ver `backend/notificaciones/README.md` para el detalle completo de tipos de evento y prioridades. |
| `financiero` | Módulo de facturación institucional. Ver [MODULO_FINANCIERO.md](MODULO_FINANCIERO.md). |

## Documentos relacionados en esta carpeta

- [AUTENTICACION_Y_PERMISOS.md](AUTENTICACION_Y_PERMISOS.md) — RBAC dinámico por componente, sesiones, OAuth.
- [CONFIGURACION_SETTINGS.md](CONFIGURACION_SETTINGS.md) — `settings.py`: base de datos, apps instaladas, middleware, variables de entorno.
- [MODULO_FINANCIERO.md](MODULO_FINANCIERO.md) — modelo de facturación institucional.
- [TESTS_Y_SEEDERS.md](TESTS_Y_SEEDERS.md) — tests existentes y seeders de datos.
