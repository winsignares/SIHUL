from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0018_remove_factura_descripcion'),
    ]

    operations = [
        migrations.AlterField(
            model_name='itemfactura',
            name='descripcion',
            field=models.TextField(),
        ),
    ]
