"""
Seeder de roles del sistema.
"""

from usuarios.models import Rol


def create_roles(stdout, style):
    """Crear roles del sistema"""
    stdout.write('  → Creando roles del sistema...')
    
    roles_data = [
        {'nombre': 'admin', 'descripcion': 'Administrador del Sistema'},
        {'nombre': 'planeacion_facultad', 'descripcion': 'Planeación de Facultad'},
        {'nombre': 'supervisor_general', 'descripcion': 'Supervisor General'},
        {'nombre': 'docente', 'descripcion': 'Docente'},
        {'nombre': 'estudiante', 'descripcion': 'Estudiante'},
    ]
    
    created_count = 0
    for rol_data in roles_data:
        _, created = Rol.objects.get_or_create(nombre=rol_data['nombre'], defaults=rol_data)
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} roles creados ({len(roles_data)} totales)'))

