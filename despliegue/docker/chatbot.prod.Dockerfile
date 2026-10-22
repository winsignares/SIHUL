# ============================================
# CHATBOT FASTAPI + RAG — IMAGEN DE PRODUCCIÓN
# Contexto de build: raíz del repositorio
#   docker build -f despliegue/docker/chatbot.prod.Dockerfile -t sihul-chatbot:TAG .
# Sin --reload, sin código montado y con usuario sin privilegios.
# ============================================

FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=100 \
    PIP_RETRIES=8 \
    UVICORN_WORKERS=1

RUN groupadd --gid 10001 app \
    && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin app

WORKDIR /app
COPY chatbot/requirements.txt .
RUN pip install -r requirements.txt

COPY --chown=app:app chatbot/ .

USER app
EXPOSE 8001

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers \"$UVICORN_WORKERS\""]
