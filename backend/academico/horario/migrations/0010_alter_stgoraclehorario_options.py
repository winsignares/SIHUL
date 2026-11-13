from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('horario', '0009_horario_oracle_external_id'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='stgoraclehorario',
            options={'ordering': ['fecha_carga', 'id']},
        ),
    ]
