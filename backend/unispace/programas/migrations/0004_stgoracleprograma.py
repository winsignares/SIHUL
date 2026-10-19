from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('programas', '0003_alter_programa_activo'),
    ]

    operations = [
        migrations.CreateModel(
            name='StgOraclePrograma',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_system', models.CharField(db_index=True, default='ORACLE_SIU', max_length=50)),
                ('external_id', models.CharField(db_index=True, max_length=50)),
                ('id_programa_oracle', models.CharField(blank=True, db_index=True, max_length=50, null=True)),
                ('id_sede_oracle', models.CharField(blank=True, db_index=True, max_length=50, null=True)),
                ('nombre_sede_oracle', models.CharField(blank=True, max_length=255, null=True)),
                ('id_facultad_oracle', models.CharField(blank=True, db_index=True, max_length=50, null=True)),
                ('nombre_facultad_oracle', models.CharField(blank=True, max_length=255, null=True)),
                ('nombre_programa', models.CharField(max_length=255)),
                ('periodo_academico', models.CharField(blank=True, db_index=True, max_length=50, null=True)),
                ('raw_data', models.JSONField(blank=True, default=dict)),
                ('row_hash', models.CharField(db_index=True, max_length=64)),
                ('estado_registro', models.CharField(db_index=True, default='valido', max_length=30)),
                ('fecha_carga', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['external_id'],
            },
        ),
        migrations.AddConstraint(
            model_name='stgoracleprograma',
            constraint=models.UniqueConstraint(
                condition=models.Q(source_system__isnull=False)
                & models.Q(external_id__isnull=False)
                & ~models.Q(external_id=''),
                fields=('source_system', 'external_id'),
                name='uq_stg_oracle_prog_source_external',
            ),
        ),
    ]
