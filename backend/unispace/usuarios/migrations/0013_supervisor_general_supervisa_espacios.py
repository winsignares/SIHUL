from django.db import migrations


def marcar_supervisor_general(apps, schema_editor):
    """
    Antes, el rol «supervisor_general» contaba como supervisor de espacios por su nombre, aunque su
    casilla no estuviera marcada. Ahora solo decide la casilla (Rol.supervisa_espacios); se marca en
    ese rol para que no cambie nada para quien ya lo usa. Desde Gestión de Roles se puede desmarcar.
    """
    Rol = apps.get_model('usuarios', 'Rol')
    Rol.objects.filter(nombre__iexact='supervisor_general', supervisa_espacios=False).update(supervisa_espacios=True)


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0012_usuario_origen'),
    ]

    operations = [
        migrations.RunPython(marcar_supervisor_general, migrations.RunPython.noop),
    ]
