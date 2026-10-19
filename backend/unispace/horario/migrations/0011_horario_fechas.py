from django.db import migrations, models
import django.db.models.expressions


class Migration(migrations.Migration):

    dependencies = [
        ('horario', '0010_alter_stgoraclehorario_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='horario',
            name='fecha_inicio',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='horario',
            name='fecha_fin',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='stgoraclehorario',
            name='fec_inicio_oracle',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='stgoraclehorario',
            name='fec_fin_oracle',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddConstraint(
            model_name='horario',
            constraint=models.CheckConstraint(
                check=models.Q(('fecha_inicio__isnull', True))
                | models.Q(('fecha_fin__isnull', True))
                | models.Q(('fecha_fin__gte', django.db.models.expressions.F('fecha_inicio'))),
                name='chk_horario_fechas',
            ),
        ),
    ]
