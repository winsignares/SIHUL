#!/bin/sh
# Script de inicio del backend Django
# Ejecuta migraciones y seeders automáticamente antes de iniciar el servidor

echo "=========================================="
echo "SIHUL Backend - Iniciando servicio..."
echo "=========================================="

# Esperar a que la base de datos esté disponible
echo "⏳ Esperando base de datos..."
while ! python -c "import socket; socket.create_connection(('db', 5432), timeout=1)" 2>/dev/null; do
    sleep 1
done
echo "✅ Base de datos disponible"

# Ejecutar migraciones
echo "🔄 Ejecutando migraciones..."
python manage.py migrate --noinput

# Ejecutar seeders de datos iniciales (idempotente)
echo "🌱 Cargando datos iniciales..."
python manage.py seed_initial_data

echo "=========================================="
echo "✅ Backend listo - Iniciando servidor..."
echo "=========================================="

# Iniciar el servidor
exec python manage.py runserver 0.0.0.0:8000
