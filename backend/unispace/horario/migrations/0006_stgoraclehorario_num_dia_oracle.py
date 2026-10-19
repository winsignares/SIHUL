from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('horario', '0005_stg_oracle_horario'),
    ]

    operations = [
        migrations.AddField(
            model_name='stgoraclehorario',
            name='num_dia_oracle',
            field=models.IntegerField(blank=True, db_index=True, null=True),
        ),
    ]
