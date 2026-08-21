from django.db import migrations, models


def actualizar_regimenes_existentes(apps, schema_editor):
    Proveedor = apps.get_model('financiero', 'Proveedor')
    Proveedor.objects.filter(regimen_tributario='No responsable').update(
        regimen_tributario='No Responsable IVA'
    )
    Proveedor.objects.filter(regimen_tributario='Gran Contribuyente').update(
        regimen_tributario='Régimen Tributario Especial'
    )


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0021_actualizar_catalogos_bancarios'),
    ]

    operations = [
        migrations.RunPython(actualizar_regimenes_existentes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='proveedor',
            name='tipo_proveedor',
            field=models.CharField(
                choices=[('Bienes', 'Bienes'), ('Servicios', 'Servicios')],
                max_length=50,
            ),
        ),
        migrations.AlterField(
            model_name='proveedor',
            name='regimen_tributario',
            field=models.CharField(
                blank=True,
                choices=[
                    ('Responsable IVA', 'Responsable IVA'),
                    ('No Responsable IVA', 'No Responsable IVA'),
                    ('Régimen Simple de Tributación', 'Régimen Simple de Tributación'),
                    ('Régimen Tributario Especial', 'Régimen Tributario Especial'),
                ],
                max_length=50,
                null=True,
            ),
        ),
    ]
