from django.db import migrations
from django.core.management import call_command


def seed_initial_data(apps, schema_editor):
    """
    Carga todos los datos iniciales en el orden correcto
    """
    # 1. Roles
    call_command('seed_roles')
    
    # 2. Componentes
    call_command('seed_components')
    
    # 3. Facultades
    call_command('seed_facultades')
    
    # 4. Usuarios
    call_command('seed_users')


def reverse_seed(apps, schema_editor):
    """
    Función para revertir la migración (opcional)
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0002_usuario_facultad_usuario_idx_usuario_facultad'),
        ('componentes', '0001_initial'),
        ('facultades', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_initial_data, reverse_seed),
    ]
