from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('financiero', '0017_geografia_proveedores'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='factura',
            name='descripcion',
        ),
    ]
