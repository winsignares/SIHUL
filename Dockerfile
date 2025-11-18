# Usar una imagen base ligera de Python 3.11
FROM python:3.11-slim

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias del sistema necesarias para cryptography y PostgreSQL
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libpq-dev \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar el archivo de requerimientos e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto de los archivos de la app al contenedor
COPY . .

# Exponer el puerto que usará Django (runserver)
EXPOSE 8000

# Comando por defecto para iniciar la aplicación Django en 0.0.0.0:8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]