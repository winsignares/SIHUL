from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0016_merge_0015_financiero'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pais',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=120, unique=True)),
                ('codigo_iso', models.CharField(max_length=3, unique=True)),
                ('activo', models.BooleanField(default=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_modificacion', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'País',
                'verbose_name_plural': 'Países',
                'ordering': ['nombre'],
            },
        ),
        migrations.CreateModel(
            name='DepartamentoGeografico',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=120)),
                ('codigo', models.CharField(blank=True, max_length=10, null=True)),
                ('activo', models.BooleanField(default=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_modificacion', models.DateTimeField(auto_now=True)),
                ('pais', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='departamentos_geograficos', to='financiero.pais')),
            ],
            options={
                'verbose_name': 'Departamento geográfico',
                'verbose_name_plural': 'Departamentos geográficos',
                'ordering': ['nombre'],
            },
        ),
        migrations.CreateModel(
            name='Ciudad',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=120)),
                ('activo', models.BooleanField(default=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_modificacion', models.DateTimeField(auto_now=True)),
                ('departamento', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ciudades', to='financiero.departamentogeografico')),
            ],
            options={
                'verbose_name': 'Ciudad',
                'verbose_name_plural': 'Ciudades',
                'ordering': ['nombre'],
            },
        ),
        migrations.AddIndex(
            model_name='pais',
            index=models.Index(fields=['nombre'], name='idx_pais_nombre'),
        ),
        migrations.AddIndex(
            model_name='pais',
            index=models.Index(fields=['activo'], name='idx_pais_activo'),
        ),
        migrations.AddIndex(
            model_name='departamentogeografico',
            index=models.Index(fields=['nombre'], name='idx_geo_departamento_nombre'),
        ),
        migrations.AddIndex(
            model_name='departamentogeografico',
            index=models.Index(fields=['activo'], name='idx_geo_departamento_activo'),
        ),
        migrations.AddConstraint(
            model_name='departamentogeografico',
            constraint=models.UniqueConstraint(fields=('pais', 'nombre'), name='uq_geo_departamento_pais_nombre'),
        ),
        migrations.AddIndex(
            model_name='ciudad',
            index=models.Index(fields=['nombre'], name='idx_ciudad_nombre'),
        ),
        migrations.AddIndex(
            model_name='ciudad',
            index=models.Index(fields=['activo'], name='idx_ciudad_activo'),
        ),
        migrations.AddConstraint(
            model_name='ciudad',
            constraint=models.UniqueConstraint(fields=('departamento', 'nombre'), name='uq_ciudad_departamento_nombre'),
        ),
    ]
