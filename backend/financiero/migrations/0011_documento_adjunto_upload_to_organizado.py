from django.db import migrations, models

import financiero.facturas.upload_paths


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0010_factura_operacion_campos_y_tipos_documento'),
    ]

    operations = [
        migrations.AlterField(
            model_name='documentoadjunto',
            name='archivo',
            field=models.FileField(blank=True, null=True, upload_to=financiero.facturas.upload_paths.documento_financiero_upload_to),
        ),
    ]
