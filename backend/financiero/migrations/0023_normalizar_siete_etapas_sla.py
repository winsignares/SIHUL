from django.db import migrations


ETAPAS_SLA = [
    ('Registro por parte del Funcionario', 'Funcionario', 'Recepción y Registro'),
    ('Radicación y Causación', 'Contabilidad', 'Radicación'),
    ('Alistamiento', 'Tesorería', 'Alistamiento'),
    ('Control Previo', 'Auditoría', 'Control Previo'),
    ('Cargue Formal', 'Dirección Financiera', 'Cargue Formal'),
    ('Autorización de Pago', 'Rectoría', 'Autorización de Pago'),
    ('Aplicación de Pago', 'Tesorería', 'Aplicación de Pago'),
]


def normalizar_etapas_sla(apps, schema_editor):
    ParametroSLA = apps.get_model('financiero', 'ParametroSLA')

    for etapa_nueva, rol, etapa_anterior in ETAPAS_SLA:
        actual = ParametroSLA.objects.filter(etapa=etapa_nueva).first()
        anterior = ParametroSLA.objects.filter(etapa=etapa_anterior).first()

        if actual:
            actual.rol_responsable = rol
            actual.save(update_fields=['rol_responsable'])
            if anterior and anterior.pk != actual.pk:
                anterior.delete()
            continue

        if anterior:
            anterior.etapa = etapa_nueva
            anterior.rol_responsable = rol
            anterior.save(update_fields=['etapa', 'rol_responsable'])
        else:
            ParametroSLA.objects.create(
                etapa=etapa_nueva,
                rol_responsable=rol,
                dias_maximos=3,
                alerta_amarillo_porcentaje=60,
                alerta_roja_porcentaje=80,
                activo=True,
            )

    ParametroSLA.objects.exclude(etapa__in=[etapa for etapa, _, _ in ETAPAS_SLA]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0022_actualizar_opciones_proveedor'),
    ]

    operations = [
        migrations.RunPython(normalizar_etapas_sla, migrations.RunPython.noop),
    ]
