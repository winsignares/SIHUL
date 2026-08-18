#!/bin/sh
set -e

# Script de inicio del backend Django.
# Ejecuta migraciones y seeders antes de iniciar el servidor.

echo "=========================================="
echo "SIHUL Backend - Iniciando servicio..."
echo "=========================================="

echo "Esperando base de datos..."
while ! python -c "import socket; socket.create_connection(('db', 5432), timeout=1)" 2>/dev/null; do
    sleep 1
done
echo "Base de datos disponible"

echo "Ejecutando migraciones..."
python manage.py migrate --noinput

echo "Cargando datos iniciales..."
python manage.py seed_initial_data

echo "Recolectando archivos estaticos..."
python manage.py collectstatic --noinput

echo "=========================================="
echo "Backend listo - Iniciando servidor..."
echo "=========================================="

exec gunicorn mysite.wsgi:application --bind 0.0.0.0:8000 --workers 3 --worker-class gthread --threads 4 --timeout 60
