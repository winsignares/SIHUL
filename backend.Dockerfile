# ============================================
# DOCKERFILE - BACKEND DJANGO
# ============================================

FROM python:3.11-slim

# Variables de entorno para Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema para PostgreSQL y cryptography
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libpq-dev \
    libssl-dev \
    libffi-dev \
    python3-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias Python
COPY backend/requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar código del backend
COPY backend/ .

# Exponer puerto Django
EXPOSE 8000

# Script de inicio con espera de base de datos y migraciones
CMD until pg_isready -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER}; do \
      echo "Waiting for database..."; \
      sleep 2; \
    done && \
    echo "Database is ready!" && \
    python manage.py migrate --noinput && \
    python manage.py runserver 0.0.0.0:8000
