from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0004_documento_archivo_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='factura',
            name='numero_confirmacion',
            field=models.CharField(blank=True, max_length=50, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name='factura',
            name='estado',
            field=models.CharField(
                choices=[
                    ('Recibida', 'Recibida'),
                    ('Registrada', 'Registrada'),
                    ('Radicada', 'Radicada'),
                    ('Causada', 'Causada'),
                    ('Alistada', 'Alistada'),
                    ('Aprobada Auditoría', 'Aprobada Auditoría'),
                    ('Rechazada Auditoría', 'Rechazada Auditoría'),
                    ('Cargada', 'Cargada'),
                    ('Revisada Dir. Financiera', 'Revisada Dir. Financiera'),
                    ('Enviada Rectoría', 'Enviada Rectoría'),
                    ('Autorizada', 'Autorizada'),
                    ('Rechazada por Rectoría', 'Rechazada por Rectoría'),
                    ('Rechazada', 'Rechazada'),
                    ('Pago Aplicado', 'Pago Aplicado'),
                    ('Pagada', 'Pagada'),
                    ('Devuelta', 'Devuelta'),
                    ('Detenida', 'Detenida'),
                    ('Anulada', 'Anulada'),
                ],
                default='Recibida',
                max_length=50,
            ),
        ),
    ]
