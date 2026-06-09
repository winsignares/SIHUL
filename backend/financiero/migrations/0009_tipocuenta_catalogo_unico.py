from django.db import migrations, models


def dedupe_tipos_cuenta(apps, schema_editor):
    TipoCuenta = apps.get_model('financiero', 'TipoCuenta')

    for nombre in ['Ahorros', 'Corriente', 'Nómina']:
        matches = list(TipoCuenta.objects.filter(nombre=nombre).order_by('id'))
        if not matches:
            continue

        keep = matches[0]
        TipoCuenta.objects.filter(nombre=nombre).exclude(id=keep.id).delete()
        if not keep.activo:
            keep.activo = True
            keep.save(update_fields=['activo'])

    TipoCuenta.objects.exclude(nombre__in=['Ahorros', 'Corriente', 'Nómina']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0008_banco_tipocuenta'),
    ]

    operations = [
        migrations.RunPython(dedupe_tipos_cuenta, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name='tipocuenta',
            unique_together=set(),
        ),
        migrations.RemoveIndex(
            model_name='tipocuenta',
            name='idx_tipo_cuenta_banco',
        ),
        migrations.RemoveField(
            model_name='tipocuenta',
            name='banco',
        ),
        migrations.AlterField(
            model_name='tipocuenta',
            name='nombre',
            field=models.CharField(max_length=255, unique=True),
        ),
        migrations.AlterModelOptions(
            name='tipocuenta',
            options={
                'ordering': ['nombre'],
                'verbose_name': 'Tipo de Cuenta',
                'verbose_name_plural': 'Tipos de Cuenta',
            },
        ),
    ]
