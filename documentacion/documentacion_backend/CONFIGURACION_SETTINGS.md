# `settings.py` — puntos relevantes (`backend/config/settings.py`)

Ver también [APPS_DJANGO.md](APPS_DJANGO.md).

- Base de datos: PostgreSQL vía `DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_HOST` (default `db`)/`DB_PORT`.
- `INSTALLED_APPS`: todas las apps de dominio listadas en [APPS_DJANGO.md](APPS_DJANGO.md) + `rest_framework`, `corsheaders`, `django_filters`, apps `django.contrib.*`, y condicionalmente `allauth.*`.
- `MIDDLEWARE`: stack estándar + `GZipJSONMiddleware` (`nucleo/compresion.py`, comprime con gzip solo las respuestas JSON) + `corsheaders` + `SedeFilterMiddleware` al final.
- Escalabilidad (apagada por defecto, el comportamiento de siempre): `DB_CONN_MAX_AGE` (segundos de conexión persistente, 0 por defecto; en producción 60) y `DB_CONN_HEALTH_CHECKS=true`; `SESSION_CACHED_DB=true` sirve la sesión desde la caché Redis (requiere `REDIS_URL`) sin dejar de guardarla en la base. Antes de activar las conexiones persistentes, `max_connections` de PostgreSQL debe cubrir `GUNICORN_WORKERS` x `GUNICORN_THREADS` (más los workers del chatbot y los comandos de gestión). El chatbot usa `DB_POOL_SIZE` (5) y `DB_MAX_OVERFLOW` (10).
- CORS/CSRF configurables por variable de entorno (default incluye `localhost:5173` y `sihul.unilibre.edu.co`).
- Nombre de cookie de sesión/CSRF configurable — permite que el stack de test (`sihul_test_sessionid`) conviva con producción en el mismo host.
- Almacenamiento de documentos financieros: `MEDIA_ROOT` (`FINANCIERO_DOCUMENT_ROOT`, default `/tmp/sihul_uploads`) + `FINANCIERO_DOCUMENT_NETWORK_ROOT/USER/PASSWORD` para copiar a un NAS SMB institucional.
- `ETL_PERIODO`: periodo académico activo usado como filtro por los comandos ETL de Oracle (default `20261`).
- `CHATBOT_FASTAPI_URL`: URL interna al servicio FastAPI del chatbot (`http://chatbot:8001/api/v1` en Docker).
