from django.db import migrations, models
import django.db.models.deletion
from django.db.models import Q


class Migration(migrations.Migration):

    dependencies = [
        ('sedes', '0003_remove_seccional_nombre_remove_sede_ciudad'),
    ]

    operations = [
        migrations.AddField(
            model_name='sede',
            name='external_id',
            field=models.CharField(blank=True, db_index=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='sede',
            name='source_system',
            field=models.CharField(blank=True, db_index=True, max_length=50, null=True),
        ),
        migrations.AddConstraint(
            model_name='sede',
            constraint=models.UniqueConstraint(
                condition=Q(('external_id__isnull', False), ('source_system__isnull', False)),
                fields=('source_system', 'external_id'),
                name='uq_sede_source_external',
            ),
        ),
        migrations.CreateModel(
            name='OracleSyncRun',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_system', models.CharField(db_index=True, default='ORACLE_SIU', max_length=50)),
                ('run_type', models.CharField(choices=[('sedes', 'Sedes'), ('facultades', 'Facultades'), ('full', 'Full')], default='full', max_length=20)),
                ('dry_run', models.BooleanField(default=True)),
                ('status', models.CharField(choices=[('running', 'Running'), ('success', 'Success'), ('partial', 'Partial'), ('failed', 'Failed')], default='running', max_length=20)),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                ('report', models.JSONField(blank=True, default=dict)),
            ],
            options={
                'ordering': ['-started_at'],
            },
        ),
        migrations.CreateModel(
            name='StgOracleSede',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_system', models.CharField(db_index=True, default='ORACLE_SIU', max_length=50)),
                ('external_id', models.CharField(db_index=True, max_length=50)),
                ('nombre_sede', models.CharField(max_length=255)),
                ('raw_data', models.JSONField(blank=True, default=dict)),
                ('row_hash', models.CharField(db_index=True, max_length=64)),
                ('fecha_carga', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['external_id'],
                'constraints': [models.UniqueConstraint(fields=('source_system', 'external_id'), name='uq_stg_oracle_sede_source_external')],
            },
        ),
        migrations.CreateModel(
            name='StgOracleFacultad',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_system', models.CharField(db_index=True, default='ORACLE_SIU', max_length=50)),
                ('external_id', models.CharField(db_index=True, max_length=50)),
                ('id_sede_oracle', models.CharField(blank=True, db_index=True, max_length=50, null=True)),
                ('nombre_sede_oracle', models.CharField(blank=True, max_length=255, null=True)),
                ('nombre_facultad', models.CharField(max_length=255)),
                ('raw_data', models.JSONField(blank=True, default=dict)),
                ('row_hash', models.CharField(db_index=True, max_length=64)),
                ('fecha_carga', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['external_id'],
                'constraints': [models.UniqueConstraint(fields=('source_system', 'external_id'), name='uq_stg_oracle_fac_source_external')],
            },
        ),
        migrations.CreateModel(
            name='MapOracleSedeSeccional',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_system', models.CharField(db_index=True, default='ORACLE_SIU', max_length=50)),
                ('external_id_oracle', models.CharField(db_index=True, max_length=50)),
                ('nombre_oracle', models.CharField(max_length=255)),
                ('metodo_asignacion', models.CharField(choices=[('automatico', 'Automatico'), ('manual', 'Manual'), ('pendiente', 'Pendiente')], default='pendiente', max_length=20)),
                ('estado', models.CharField(choices=[('mapped', 'Mapped'), ('pending', 'Pending'), ('conflict', 'Conflict')], default='pending', max_length=20)),
                ('confianza', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('observaciones', models.TextField(blank=True, default='')),
                ('ultimo_hash_oracle', models.CharField(blank=True, default='', max_length=64)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('sede', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='mapeos_oracle', to='sedes.sede')),
                ('seccional', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='mapeos_oracle', to='sedes.seccional')),
            ],
            options={
                'ordering': ['external_id_oracle'],
                'constraints': [models.UniqueConstraint(fields=('source_system', 'external_id_oracle'), name='uq_map_oracle_sede_source_external')],
            },
        ),
        migrations.CreateModel(
            name='OracleSyncIssue',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_system', models.CharField(db_index=True, default='ORACLE_SIU', max_length=50)),
                ('issue_type', models.CharField(max_length=100)),
                ('severity', models.CharField(choices=[('info', 'Info'), ('warning', 'Warning'), ('error', 'Error')], default='warning', max_length=20)),
                ('external_id', models.CharField(blank=True, db_index=True, default='', max_length=50)),
                ('message', models.TextField()),
                ('payload', models.JSONField(blank=True, default=dict)),
                ('resolved', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('run', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='issues', to='sedes.oraclesyncrun')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
