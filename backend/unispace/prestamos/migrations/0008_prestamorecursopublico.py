import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recursos', '0002_remove_espaciorecurso_disponible_and_more'),
        ('prestamos', '0007_prestamoespaciopublico_token_publico'),
    ]

    operations = [
        migrations.CreateModel(
            name='PrestamoRecursoPublico',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('cantidad', models.PositiveIntegerField(default=1)),
                ('prestamo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='prestamo_recursos', to='prestamos.prestamoespaciopublico')),
                ('recurso', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='prestamos_publicos', to='recursos.recurso')),
            ],
            options={
                'verbose_name': 'Recurso de Préstamo Público',
                'verbose_name_plural': 'Recursos de Préstamos Públicos',
                'unique_together': {('prestamo', 'recurso')},
            },
        ),
    ]
