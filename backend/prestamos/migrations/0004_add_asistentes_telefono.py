from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('prestamos', '0003_auto_20251130_0224'),
    ]

    operations = [
        migrations.AddField(
            model_name='prestamoespacio',
            name='asistentes',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='prestamoespacio',
            name='telefono',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
    ]
