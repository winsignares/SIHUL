from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0012_fix_encoding_estados'),
    ]

    operations = [
        migrations.AddField(
            model_name='factura',
            name='identificacion_factura',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.CreateModel(
            name='ItemFactura',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('descripcion', models.CharField(max_length=500)),
                ('cantidad', models.DecimalField(decimal_places=2, default=1, max_digits=10)),
                ('valor_unitario', models.DecimalField(decimal_places=2, max_digits=18)),
                ('porcentaje_iva', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('valor_subtotal', models.DecimalField(decimal_places=2, max_digits=18)),
                ('valor_iva', models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ('valor_total', models.DecimalField(decimal_places=2, max_digits=18)),
                ('orden', models.IntegerField(default=1)),
                ('factura', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='financiero.factura')),
            ],
            options={
                'verbose_name': 'Item de Factura',
                'verbose_name_plural': 'Items de Factura',
                'ordering': ['orden'],
                'indexes': [models.Index(fields=['factura'], name='idx_item_factura')],
            },
        ),
    ]
