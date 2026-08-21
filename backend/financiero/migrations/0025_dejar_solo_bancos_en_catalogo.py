from django.db import migrations


CATALOGO_BANCOS = [
    ('Banco Agrario', 'Banco Agrario de Colombia S.A.', '080'),
    ('Banco AV Villas', 'Banco Comercial AV Villas S.A.', '052'),
    ('Bancamía', 'Banco de las Microfinanzas - Bancamía S.A.', ''),
    ('BBVA', 'Banco BBVA Colombia S.A.', '013'),
    ('Banco BTG Pactual', 'Banco BTG Pactual Colombia S.A.', ''),
    ('Banco Caja Social', 'Banco Caja Social S.A.', '066'),
    ('Banco Contactar', 'Banco Contactar S.A.', ''),
    ('Banco Cooperativo Coopcentral', 'Banco Cooperativo Coopcentral.', ''),
    ('Banco de Bogotá', 'Banco de Bogotá S.A.', '002'),
    ('Banco de Occidente', 'Banco de Occidente S.A.', '023'),
    ('Banco Falabella', 'Banco Falabella S.A.', '062'),
    ('Banco Finandina', 'Banco Finandina S.A.', ''),
    ('Banco Sudameris', 'Banco GNB Sudameris S.A.', '019'),
    ('Banco J.P. Morgan', 'Banco J.P. Morgan Colombia S.A.', ''),
    ('Banco Mundo Mujer', 'Banco Mundo Mujer S.A.', ''),
    ('Banco Pichincha', 'Banco Pichincha S.A.', '012'),
    ('Banco Popular', 'Banco Popular S.A.', '058'),
    ('Banco Santander', 'Banco Santander Colombia S.A.', '084'),
    ('Banco Serfinanza', 'Banco Serfinanza S.A.', ''),
    ('Banco Unión', 'Banco Unión S.A.', ''),
    ('Banco W', 'Banco W S.A.', ''),
    ('Ban100', 'Ban100 S.A.', ''),
    ('Bancolombia', 'Bancolombia S.A.', '001'),
    ('Bancoomeva', 'Banco Coomeva S.A.', ''),
    ('Citibank Colombia', 'Citibank Colombia S.A.', ''),
    ('DAVIbank', 'Banco DAVIbank.', ''),
    ('Davivienda', 'Banco Davivienda S.A.', '006'),
    ('Banco Itaú', 'Itaú Colombia S.A.', '060'),
    ('Lulo Bank', 'Lulo Bank S.A.', ''),
    ('Mibanco', 'Banco de la Microempresa de Colombia S.A.', ''),
    ('Revolut Bank Colombia', 'Revolut Bank Colombia S.A.', ''),
    ('Scotiabank Colpatria', 'Scotiabank Colpatria S.A.', '065'),
    ('ICBC', 'ICBC (Colombia) S.A.', '010'),
    ('Banco Multicolor', 'Banco Multicolor S.A.', '042'),
]


def sincronizar_catalogo_bancos(apps, schema_editor):
    Banco = apps.get_model('financiero', 'Banco')
    nombres_vigentes = [nombre for nombre, _, _ in CATALOGO_BANCOS]

    # Se ocultan las billeteras, opciones genéricas y las denominaciones
    # duplicadas; no se eliminan registros para preservar datos históricos.
    Banco.objects.exclude(nombre__in=nombres_vigentes).update(activo=False)

    for nombre, descripcion, codigo_bancario in CATALOGO_BANCOS:
        Banco.objects.update_or_create(
            nombre=nombre,
            defaults={
                'descripcion': descripcion,
                'codigo_bancario': codigo_bancario,
                'activo': True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ('financiero', '0024_sincronizar_catalogo_bancos'),
    ]

    operations = [
        migrations.RunPython(sincronizar_catalogo_bancos, migrations.RunPython.noop),
    ]
