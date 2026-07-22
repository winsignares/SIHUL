# `settings.py` — puntos relevantes (`backend/mysite/settings.py`)

Ver también [APPS_DJANGO.md](APPS_DJANGO.md).

- Base de datos: PostgreSQL vía `DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_HOST` (default `db`)/`DB_PORT`.
- `INSTALLED_APPS`: todas las apps de dominio listadas en [APPS_DJANGO.md](APPS_DJANGO.md) + `rest_framework`, `corsheaders`, `django_filters`, apps `django.contrib.*`, y condicionalmente `allauth.*`.
- `MIDDLEWARE`: stack estándar + `corsheaders` + `SedeFilterMiddleware` al final.
- CORS/CSRF configurables por variable de entorno (default incluye `localhost:5173` y `sihul.unilibre.edu.co`).
- Nombre de cookie de sesión/CSRF configurable — permite que el stack de test (`sihul_test_sessionid`) conviva con producción en el mismo host.
- Almacenamiento de documentos financieros: `MEDIA_ROOT` (`FINANCIERO_DOCUMENT_ROOT`, default `/tmp/sihul_uploads`) + `FINANCIERO_DOCUMENT_NETWORK_ROOT/USER/PASSWORD` para copiar a un NAS SMB institucional.
- `ETL_PERIODO`: periodo académico activo usado como filtro por los comandos ETL de Oracle (default `20261`).
- `CHATBOT_FASTAPI_URL`: URL interna al servicio FastAPI del chatbot (`http://chatbot:8001/api/v1` en Docker).
