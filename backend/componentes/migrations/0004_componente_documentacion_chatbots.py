from django.db import migrations

NOMBRE = 'Gestión de Documentación de Chatbots'
DESCRIPCION = (
    'Subir y administrar los documentos y las preguntas-respuestas de los chatbots de la '
    'seccional, sin poder crear, editar ni eliminar los chatbots'
)


def crear_componente(apps, schema_editor):
    Componente = apps.get_model('componentes', 'Componente')
    Componente.objects.get_or_create(nombre=NOMBRE, defaults={'descripcion': DESCRIPCION})


def eliminar_componente(apps, schema_editor):
    Componente = apps.get_model('componentes', 'Componente')
    Componente.objects.filter(nombre=NOMBRE).delete()


class Migration(migrations.Migration):
    """Registra el componente que da permiso solo para cargar documentación de los chatbots.

    No asigna el componente a ningún rol ni usuario: los permisos se otorgan desde
    Gestión de Roles / Componentes. Quien ya tiene «Gestión de Chatbots» conserva todo.
    """

    dependencies = [
        ('componentes', '0003_componenteusuario'),
    ]

    operations = [
        migrations.RunPython(crear_componente, eliminar_componente),
    ]
