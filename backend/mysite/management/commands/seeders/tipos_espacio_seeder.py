"""
Seeder de tipos de espacio físico.
"""

from espacios.models import TipoEspacio


def create_tipos_espacio(stdout, style):
    """Crear tipos de espacio físico"""
    stdout.write('  → Creando tipos de espacio...')
    
    tipos_data = [
        {'nombre': 'Torreon', 'descripcion': 'Espacio grande para clases magistrales, con capacidad para más de 100 personas'},
        {'nombre': 'Aula', 'descripcion': 'Espacio de clase para asignaturas de los programas de la universidad libre'},
        {'nombre': 'Sala Cómputo', 'descripcion': 'Espacio de clase para asignaturas de los programas de la universidad libre con computadores'},
        {'nombre': 'Auditorio', 'descripcion': 'Espacio de conferencia y eventos de la universidad libre'},
        {'nombre': 'Otro', 'descripcion': 'Otros tipos de espacios'}
    ]
    
    created_count = 0
    for tipo_data in tipos_data:
        _, created = TipoEspacio.objects.get_or_create(nombre=tipo_data['nombre'], defaults=tipo_data)
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} tipos de espacio creados ({len(tipos_data)} totales)'))

