"""
Seeder de facultades.
"""

from sedes.models import Sede
from facultades.models import Facultad


def create_facultades(stdout, style):
    """Crear facultades con sus sedes"""
    stdout.write('  → Creando facultades...')
    
    sede_principal = Sede.objects.get(nombre='Sede Principal')
    sede_centro = Sede.objects.get(nombre='Sede Centro')
    
    facultades_data = [
        {'nombre': 'Facultad de Ingeniería', 'sede': sede_centro, 'activa': True},
        {'nombre': 'Facultad de Ciencias Económicas, Administrativas y Contables', 'sede': sede_centro, 'activa': True},
        {'nombre': 'Facultad de Derecho, Ciencias Políticas y Sociales', 'sede': sede_centro, 'activa': True},
        {'nombre': 'Facultad de Ciencias de la Salud', 'sede': sede_principal, 'activa': True},
        {'nombre': 'Facultad de Ciencias de la Salud, Exactas y Naturales', 'sede': sede_centro, 'activa': True},
        {'nombre': 'Ninguna', 'sede': sede_centro, 'activa': True},
    ]
    
    created_count = 0
    for fac_data in facultades_data:
        _, created = Facultad.objects.get_or_create(
            nombre=fac_data['nombre'],
            defaults={'sede': fac_data['sede'], 'activa': fac_data['activa']}
        )
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} facultades creadas ({len(facultades_data)} totales)'))

