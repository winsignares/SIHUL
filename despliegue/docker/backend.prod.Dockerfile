# ============================================
# BACKEND DJANGO — IMAGEN DE PRODUCCIÓN
# Contexto de build: raíz del repositorio
#   docker build -f despliegue/docker/backend.prod.Dockerfile -t sihul-backend:TAG .
# Diferencias con backend.Dockerfile (desarrollo):
#   - multi-stage: sin compiladores en la imagen final
#   - usuario sin privilegios
#   - NO ejecuta migrate/collectstatic al arrancar (lo hace el job "release")
#   - procesos de gunicorn configurables por variables de entorno
#   - recicla procesos (max-requests) para contener el crecimiento de memoria
# ============================================

FROM python:3.11-slim AS builder
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_DEFAULT_TIMEOUT=100 PIP_RETRIES=8
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential gcc libpq-dev libssl-dev libffi-dev \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --prefix=/install -r /tmp/requirements.txt


FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    # Módulo WSGI configurable: cambia a config.wsgi:application tras la reorganización del backend
    DJANGO_WSGI=mysite.wsgi:application \
    GUNICORN_WORKERS=2 \
    GUNICORN_THREADS=4 \
    GUNICORN_TIMEOUT=60 \
    GUNICORN_MAX_REQUESTS=800

RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 app \
    && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin app

COPY --from=builder /install /usr/local
WORKDIR /app
COPY --chown=app:app backend/ .
# Directorios con dueño correcto: un volumen nuevo hereda este dueño al montarse.
RUN mkdir -p /app/staticfiles /app/media && chown -R app:app /app/staticfiles /app/media

USER app
EXPOSE 8000

CMD ["sh", "-c", "exec gunicorn \"$DJANGO_WSGI\" --bind 0.0.0.0:8000 --workers \"$GUNICORN_WORKERS\" --worker-class gthread --threads \"$GUNICORN_THREADS\" --timeout \"$GUNICORN_TIMEOUT\" --max-requests \"$GUNICORN_MAX_REQUESTS\" --max-requests-jitter 100 --access-logfile - --error-logfile -"]
