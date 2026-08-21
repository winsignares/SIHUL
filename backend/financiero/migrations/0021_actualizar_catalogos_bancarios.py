from django.db import migrations


def actualizar_catalogos_bancarios(apps, schema_editor):
    Banco = apps.get_model('financiero', 'Banco')
    TipoCuenta = apps.get_model('financiero', 'TipoCuenta')

    for nombre, descripcion, codigo_bancario in [
        ('Banco Sudameris', 'Banco GNB Sudameris S.A.', '019'),
        ('DaviPlata', 'Billetera digital de Davivienda.', '006'),
    ]:
        Banco.objects.update_or_create(
            nombre=nombre,
            defaults={
                'descripcion': descripcion,
                'codigo_bancario': codigo_bancario,
                'activo': True,
            },
        )

    TipoCuenta.objects.filter(nombre='Nómina').update(activo=False)


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0020_seed_areas_solicitantes'),
    ]

    operations = [
        migrations.RunPython(actualizar_catalogos_bancarios, migrations.RunPython.noop),
    ]
