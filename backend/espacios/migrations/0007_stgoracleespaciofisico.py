from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('espacios', '0006_espaciofisico_esta_abierto'),
    ]

    operations = [
        migrations.CreateModel(
            name='StgOracleEspacioFisico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_system', models.CharField(db_index=True, default='ORACLE_SIU', max_length=50)),
                ('external_id', models.CharField(db_index=True, max_length=100)),
                ('ident_aula_oracle', models.CharField(blank=True, db_index=True, max_length=10, null=True)),
                ('bloque_oracle', models.CharField(blank=True, max_length=22, null=True)),
                ('nombre_espacio_oracle', models.CharField(blank=True, max_length=60, null=True)),
                ('tipo_espacio_oracle', models.CharField(blank=True, db_index=True, max_length=6, null=True)),
                ('id_sede_oracle', models.CharField(blank=True, db_index=True, max_length=20, null=True)),
                ('nombre_sede_oracle', models.CharField(blank=True, max_length=50, null=True)),
                ('nombre_facultad_oracle', models.CharField(blank=True, max_length=250, null=True)),
                ('raw_data', models.JSONField(blank=True, default=dict)),
                ('row_hash', models.CharField(db_index=True, max_length=64)),
                ('estado_registro', models.CharField(db_index=True, default='valido', max_length=30)),
                ('fecha_carga', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['external_id'],
                'constraints': [
                    models.UniqueConstraint(fields=('source_system', 'external_id'), name='uq_stg_oracle_espacio_source_external'),
                ],
            },
        ),
    ]
