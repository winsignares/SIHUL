from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0014_documentoadjunto_nas_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='factura',
            name='ciclo_documental_actual',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name='documentoadjunto',
            name='ciclo_documental',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name='documentoadjunto',
            name='contenido_archivo',
            field=models.BinaryField(blank=True, editable=False, null=True),
        ),
        migrations.CreateModel(
            name='DocumentoUnificado',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('scope', models.CharField(default='all', max_length=50)),
                ('ciclo_documental', models.PositiveIntegerField(default=1)),
                ('nombre_archivo', models.CharField(max_length=255)),
                ('tipo_mime', models.CharField(default='application/pdf', max_length=100)),
                ('tamano_bytes', models.BigIntegerField(blank=True, null=True)),
                ('contenido_archivo', models.BinaryField(blank=True, editable=False, null=True)),
                ('hash_archivo', models.CharField(blank=True, max_length=255, null=True)),
                ('fecha_generacion', models.DateTimeField(auto_now=True)),
                ('nas_relative_path', models.CharField(blank=True, help_text='Ruta relativa dentro del NAS (desde la raíz configurada) del PDF unificado.', max_length=500, null=True)),
                ('nas_storage_status', models.CharField(blank=True, help_text='Estado de copia al NAS del PDF unificado: stored, failed, skipped, disabled', max_length=20, null=True)),
                ('factura', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='documentos_unificados', to='financiero.factura')),
            ],
            options={
                'verbose_name': 'Documento Unificado',
                'verbose_name_plural': 'Documentos Unificados',
                'indexes': [
                    models.Index(fields=['factura', 'scope'], name='idx_doc_unificado_fact_scope'),
                    models.Index(fields=['factura', 'ciclo_documental'], name='idx_doc_unificado_fact_ciclo'),
                ],
                'constraints': [
                    models.UniqueConstraint(fields=('factura', 'scope', 'ciclo_documental'), name='uniq_doc_unificado_fact_scope_ciclo'),
                ],
            },
        ),
    ]
