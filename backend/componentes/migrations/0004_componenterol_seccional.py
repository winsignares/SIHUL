from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('sedes', '0004_oracle_staging_mapping_and_external_fields'),
        ('componentes', '0003_componenteusuario'),
    ]

    operations = [
        migrations.AddField(
            model_name='componenterol',
            name='seccional',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='componentes_rol', to='sedes.seccional'),
        ),
        migrations.AddConstraint(
            model_name='componenterol',
            constraint=models.UniqueConstraint(fields=('componente', 'rol', 'seccional'), name='uniq_componente_rol_seccional'),
        ),
    ]
