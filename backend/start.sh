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
python manage.py shell -c "from mysite.management.commands.seeders.roles_seeder import create_roles; from django.core.management.base import BaseCommand; c=BaseCommand(); create_roles(c.stdout, c.style)"
python manage.py shell -c "from mysite.management.commands.seeders.componentes_seeder import create_componentes; from django.core.management.base import BaseCommand; c=BaseCommand(); create_componentes(c.stdout, c.style)"
python manage.py shell -c "from mysite.management.commands.seeders.componentes_rol_seeder import create_componentes_rol; from django.core.management.base import BaseCommand; c=BaseCommand(); create_componentes_rol(c.stdout, c.style)"
python manage.py shell -c "from mysite.management.commands.seeders.financiero_seeder import create_financiero_data; from django.core.management.base import BaseCommand; c=BaseCommand(); create_financiero_data(c.stdout, c.style)"
python manage.py shell -c "from mysite.management.commands.seeders.espacios_seeder import create_espacios_fisicos; from django.core.management.base import BaseCommand; c=BaseCommand(); create_espacios_fisicos(c.stdout, c.style)"
python manage.py shell -c "from mysite.management.commands.seeders.tipos_espacio_seeder import create_tipos_espacio; from django.core.management.base import BaseCommand; c=BaseCommand(); create_tipos_espacio(c.stdout, c.style)"
python manage.py shell -c "from mysite.management.commands.seeders.recursos_seeder import create_recursos; from django.core.management.base import BaseCommand; c=BaseCommand(); create_recursos(c.stdout, c.style)"
python manage.py shell -c "from mysite.management.commands.seeders.tipos_actividad_seeder import create_tipos_actividad; from django.core.management.base import BaseCommand; c=BaseCommand(); create_tipos_actividad(c.stdout, c.style)"


echo "=========================================="
echo "Backend listo - Iniciando servidor..."
echo "=========================================="

exec python manage.py runserver 0.0.0.0:8000
