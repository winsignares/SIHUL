from django.db import migrations


PRODUCTOS_PERMITIDOS = [
    ('DaviPlata', 'Billetera digital de Davivienda.'),
    ('Nequi', 'Nequi S.A. Compañía de Financiamiento.'),
    ('Nu Colombia', 'Nu Colombia Compañía de Financiamiento S.A.'),
]


def agregar_productos_permitidos(apps, schema_editor):
    Banco = apps.get_model('financiero', 'Banco')
    for nombre, descripcion in PRODUCTOS_PERMITIDOS:
        Banco.objects.update_or_create(
            nombre=nombre,
            defaults={
                'descripcion': descripcion,
                'codigo_bancario': '',
                'activo': True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ('financiero', '0025_dejar_solo_bancos_en_catalogo'),
    ]

    operations = [
        migrations.RunPython(agregar_productos_permitidos, migrations.RunPython.noop),
    ]
