from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0008_stg_oracle_docente'),
    ]

    operations = [
        migrations.CreateModel(
            name='StgOracleEstudiante',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_system', models.CharField(db_index=True, default='ORACLE_SIU', max_length=50)),
                ('external_id', models.CharField(db_index=True, max_length=100)),
                ('tipo_identificacion', models.CharField(blank=True, max_length=6, null=True)),
                ('id_estudiante_oracle', models.CharField(blank=True, db_index=True, max_length=30, null=True)),
                ('codigo_estudiante_oracle', models.CharField(blank=True, db_index=True, max_length=12, null=True)),
                ('nombres', models.CharField(blank=True, max_length=501, null=True)),
                ('apellidos', models.CharField(blank=True, max_length=501, null=True)),
                ('nombre_completo', models.CharField(blank=True, max_length=501, null=True)),
                ('semestre_oracle', models.IntegerField(blank=True, null=True)),
                ('periodo_academico', models.CharField(blank=True, db_index=True, max_length=5, null=True)),
                ('programa_oracle', models.CharField(blank=True, max_length=250, null=True)),
                ('raw_data', models.JSONField(blank=True, default=dict)),
                ('row_hash', models.CharField(db_index=True, max_length=64)),
                ('estado_registro', models.CharField(db_index=True, default='valido', max_length=30)),
                ('fecha_carga', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['external_id'],
                'constraints': [
                    models.UniqueConstraint(fields=('source_system', 'external_id'), name='uq_stg_oracle_est_source_external'),
                ],
            },
        ),
    ]
