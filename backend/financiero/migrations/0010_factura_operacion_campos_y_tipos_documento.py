from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0009_tipocuenta_catalogo_unico'),
    ]

    operations = [
        migrations.AddField(
            model_name='factura',
            name='consecutivo_operacion',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='factura',
            name='numero_operacion_contable',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='documentoadjunto',
            name='tipo_documento',
            field=models.CharField(
                choices=[
                    ('Factura', 'Factura'),
                    ('Orden de Compra', 'Orden de Compra'),
                    ('Contrato', 'Contrato'),
                    ('Acta de Entrega', 'Acta de Entrega'),
                    ('Certificado de Disponibilidad', 'Certificado de Disponibilidad'),
                    ('RUT Proveedor', 'RUT Proveedor'),
                    ('Certificación Bancaria', 'Certificación Bancaria'),
                    ('Informe Técnico', 'Informe Técnico'),
                    ('Soporte Adicional', 'Soporte Adicional'),
                    ('Soporte Operacion', 'Soporte Operacion'),
                    ('Soporte Causacion Seven', 'Soporte Causacion Seven'),
                    ('Archivo Plano Bancario', 'Archivo Plano Bancario'),
                    ('Comprobante de Pago', 'Comprobante de Pago'),
                ],
                max_length=50,
            ),
        ),
    ]
