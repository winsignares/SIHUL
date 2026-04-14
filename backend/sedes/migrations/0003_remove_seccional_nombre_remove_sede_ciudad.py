# Generated manually to align Sede/Seccional schema simplification.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('sedes', '0002_seccional_sede_seccional'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='seccional',
            name='nombre',
        ),
        migrations.RemoveField(
            model_name='sede',
            name='ciudad',
        ),
    ]
