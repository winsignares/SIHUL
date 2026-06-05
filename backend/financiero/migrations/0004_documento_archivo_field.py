from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0003_proveedor_usuario'),
    ]

    operations = [
        migrations.AddField(
            model_name='documentoadjunto',
            name='archivo',
            field=models.FileField(blank=True, null=True, upload_to='documentos_financiero/%Y/%m/'),
        ),
        migrations.AlterField(
            model_name='documentoadjunto',
            name='url_storage',
            field=models.CharField(blank=True, max_length=500),
        ),
    ]
