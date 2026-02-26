"""
Seeder de recursos para espacios físicos.
"""

from recursos.models import Recurso


def create_recursos(stdout, style):
    """Crear recursos para espacios físicos"""
    stdout.write('  → Creando recursos...')
    
    recursos_data = [
        {'nombre': 'Videobeam', 'descripcion': 'Proyector multimedia para presentaciones'},
        {'nombre': 'Computador', 'descripcion': 'Computador de escritorio'},
        {'nombre': 'Computador Portátil', 'descripcion': 'Computador portátil para el docente'},
        {'nombre': 'Aire Acondicionado', 'descripcion': 'Sistema de climatización'},
        {'nombre': 'Ventilador', 'descripcion': 'Ventilador de techo o de pedestal'},
        {'nombre': 'Micrófono', 'descripcion': 'Sistema de audio con micrófono'},
        {'nombre': 'Equipo de Sonido', 'descripcion': 'Sistema de audio con altavoces'},
        {'nombre': 'Tablero Blanco', 'descripcion': 'Tablero acrílico para marcadores'},
        {'nombre': 'Tablero Digital', 'descripcion': 'Pantalla táctil interactiva'},
        {'nombre': 'Sillas', 'descripcion': 'Sillas para estudiantes'},
        {'nombre': 'Mesas', 'descripcion': 'Mesas o escritorios'},
        {'nombre': 'Televisor', 'descripcion': 'Televisor o pantalla LED'},
        {'nombre': 'Atril', 'descripcion': 'Atril para el docente o persona encargada'},
        {'nombre': 'Iluminación', 'descripcion': 'Sistema de iluminación adecuado'},
        {'nombre': 'Borrador', 'descripcion': 'Borrador para tablero'},
        {'nombre': 'Marcadores', 'descripcion': 'Marcadores para tablero'},
        {'nombre': 'Toma Eléctrica', 'descripcion': 'Tomas eléctricas disponibles'},
        {'nombre': 'Cámara de Videoconferencia', 'descripcion': 'Cámara para clases virtuales'},
        {'nombre': 'Mesa de Reuniones', 'descripcion': 'Mesa para reuniones o trabajo en grupo'},
    ]
    
    created_count = 0
    for recurso_data in recursos_data:
        _, created = Recurso.objects.get_or_create(
            nombre=recurso_data['nombre'], 
            defaults=recurso_data
        )
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} recursos creados ({len(recursos_data)} totales)'))
