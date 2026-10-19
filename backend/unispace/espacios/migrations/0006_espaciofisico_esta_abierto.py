from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('espacios', '0005_tipoespacio_alter_espaciofisico_tipo'),
    ]

    operations = [
        migrations.AddField(
            model_name='espaciofisico',
            name='esta_abierto',
            field=models.BooleanField(default=True),
        ),
    ]
