from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0013_itemfactura_identificacion_factura'),
    ]

    operations = [
        migrations.AddField(
            model_name='documentoadjunto',
            name='nas_relative_path',
            field=models.CharField(
                blank=True,
                null=True,
                max_length=500,
                help_text='Ruta relativa dentro del NAS (desde la raíz configurada). Ejemplo: facturas/2026/06/FAC-000123/documentos_especificos/001_rut.pdf',
            ),
        ),
        migrations.AddField(
            model_name='documentoadjunto',
            name='nas_storage_status',
            field=models.CharField(
                blank=True,
                null=True,
                max_length=20,
                help_text='Estado de copia al NAS: stored, failed, skipped, disabled',
            ),
        ),
    ]
