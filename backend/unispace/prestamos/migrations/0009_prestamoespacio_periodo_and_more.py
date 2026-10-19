import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('periodos', '0001_initial'),
        ('prestamos', '0008_prestamorecursopublico'),
    ]

    operations = [
        migrations.AddField(
            model_name='prestamoespacio',
            name='periodo',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='prestamos', to='periodos.periodoacademico'),
        ),
        migrations.AddField(
            model_name='prestamoespaciopublico',
            name='periodo',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='prestamos_publicos', to='periodos.periodoacademico'),
        ),
    ]
