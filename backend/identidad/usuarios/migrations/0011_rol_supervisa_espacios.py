from django.db import migrations, models


def marcar_supervisor_general(apps, schema_editor):
    Rol = apps.get_model('usuarios', 'Rol')
    Rol.objects.filter(nombre='supervisor_general').update(supervisa_espacios=True)


def desmarcar_supervisor_general(apps, schema_editor):
    Rol = apps.get_model('usuarios', 'Rol')
    Rol.objects.filter(nombre='supervisor_general').update(supervisa_espacios=False)


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0010_stgoracleestudiante_id_sede_oracle'),
    ]

    operations = [
        migrations.AddField(
            model_name='rol',
            name='supervisa_espacios',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(marcar_supervisor_general, desmarcar_supervisor_general),
    ]
