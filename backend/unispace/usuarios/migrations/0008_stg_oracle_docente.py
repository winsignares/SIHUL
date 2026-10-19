from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0007_fix_admin_log_user_fk'),
    ]

    operations = [
        migrations.CreateModel(
            name='StgOracleDocente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_system', models.CharField(db_index=True, default='ORACLE_SIU', max_length=50)),
                ('external_id', models.CharField(db_index=True, max_length=100)),
                ('id_docente_oracle', models.CharField(blank=True, db_index=True, max_length=100, null=True)),
                ('tipo_documento', models.CharField(blank=True, max_length=30, null=True)),
                ('numero_documento', models.CharField(blank=True, db_index=True, max_length=100, null=True)),
                ('nombres', models.CharField(blank=True, max_length=501, null=True)),
                ('apellidos', models.CharField(blank=True, max_length=501, null=True)),
                ('nombre_completo', models.CharField(blank=True, max_length=501, null=True)),
                ('correo_institucional', models.CharField(blank=True, db_index=True, max_length=150, null=True)),
                ('correo_personal', models.CharField(blank=True, max_length=150, null=True)),
                ('id_sede_oracle', models.CharField(blank=True, db_index=True, max_length=50, null=True)),
                ('nombre_sede_oracle', models.CharField(blank=True, max_length=255, null=True)),
                ('id_facultad_oracle', models.CharField(blank=True, db_index=True, max_length=50, null=True)),
                ('nombre_facultad_oracle', models.CharField(blank=True, max_length=255, null=True)),
                ('periodo_academico', models.CharField(blank=True, db_index=True, max_length=50, null=True)),
                ('estado_docente', models.CharField(blank=True, db_index=True, max_length=50, null=True)),
                ('raw_data', models.JSONField(blank=True, default=dict)),
                ('row_hash', models.CharField(db_index=True, max_length=64)),
                ('estado_registro', models.CharField(db_index=True, default='valido', max_length=30)),
                ('fecha_carga', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['external_id'],
                'constraints': [
                    models.UniqueConstraint(fields=('source_system', 'external_id'), name='uq_stg_oracle_doc_source_external'),
                ],
            },
        ),
    ]
