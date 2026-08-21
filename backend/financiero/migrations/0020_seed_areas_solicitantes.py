from django.db import migrations


AREAS_SOLICITANTES = [
    ('SOL-DER', 'Facultad de Derecho y Ciencias Políticas', 'Académico'),
    ('SOL-ING', 'Facultad de Ingeniería', 'Académico'),
    ('SOL-SAL', 'Facultad de Ciencias de la Salud', 'Académico'),
    ('SOL-ECO', 'Facultad de Ciencias Económicas, Administrativas y Contables', 'Académico'),
    ('SOL-ADM', 'Administración', 'Administrativo'),
]


def seed_areas_solicitantes(apps, schema_editor):
    Departamento = apps.get_model('financiero', 'Departamento')
    for codigo, nombre, tipo in AREAS_SOLICITANTES:
        Departamento.objects.update_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'tipo': tipo,
                'estado': 'Activo',
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0019_alter_itemfactura_descripcion'),
    ]

    operations = [
        migrations.RunPython(seed_areas_solicitantes, migrations.RunPython.noop),
    ]
