from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('horario', '0004_horario_estado_solicitudespacios'),
    ]

    operations = [
        migrations.CreateModel(
            name='StgOracleHorario',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_system', models.CharField(db_index=True, default='ORACLE_SIU', max_length=50)),
                ('external_id', models.CharField(db_index=True, max_length=120)),
                ('id_grupo_oracle', models.CharField(blank=True, db_index=True, max_length=22, null=True)),
                ('programa_oracle', models.CharField(blank=True, db_index=True, max_length=5, null=True)),
                ('id_asignatura_oracle', models.CharField(blank=True, db_index=True, max_length=20, null=True)),
                ('nombre_grupo_oracle', models.CharField(blank=True, max_length=20, null=True)),
                ('periodo_oracle', models.CharField(blank=True, db_index=True, max_length=5, null=True)),
                ('cantidad_estudiantes_oracle', models.IntegerField(blank=True, null=True)),
                ('asignatura_oracle', models.CharField(blank=True, max_length=255, null=True)),
                ('nombre_programa_oracle', models.CharField(blank=True, max_length=273, null=True)),
                ('id_sede_oracle', models.CharField(blank=True, db_index=True, max_length=20, null=True)),
                ('nombre_sede_oracle', models.CharField(blank=True, max_length=50, null=True)),
                ('num_identificacion_docente', models.CharField(blank=True, db_index=True, max_length=30, null=True)),
                ('nombre_docente_oracle', models.CharField(blank=True, max_length=501, null=True)),
                ('apellidos_docente_oracle', models.CharField(blank=True, max_length=501, null=True)),
                ('nom_aula_oracle', models.CharField(blank=True, max_length=60, null=True)),
                ('hor_inicio_raw', models.TextField(blank=True, null=True)),
                ('hor_fin_raw', models.TextField(blank=True, null=True)),
                ('raw_data', models.JSONField(blank=True, default=dict)),
                ('row_hash', models.CharField(db_index=True, max_length=64)),
                ('estado_registro', models.CharField(db_index=True, default='valido', max_length=30)),
                ('fecha_carga', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['external_id'],
                'constraints': [
                    models.UniqueConstraint(fields=('source_system', 'external_id'), name='uq_stg_oracle_horario_source_external'),
                ],
            },
        ),
    ]
