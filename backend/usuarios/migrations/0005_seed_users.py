from django.db import migrations
from django.core.management import call_command


def seed_users(apps, schema_editor):
    """
    Carga usuarios después de que se haya agregado el campo sede
    """
    call_command('seed_users')


def reverse_seed(apps, schema_editor):
    """
    Función para revertir la migración (opcional)
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0004_usuario_sede_usuario_idx_usuario_sede'),
    ]

    operations = [
        migrations.RunPython(seed_users, reverse_seed),
    ]
