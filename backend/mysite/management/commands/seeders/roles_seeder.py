"""
Seeder de roles del sistema.
"""

from usuarios.models import Rol


def create_roles(stdout, style):
    """Crear roles del sistema"""
    stdout.write('  → Creando roles del sistema...')
    
    roles_data = [
        {'nombre': 'admin', 'descripcion': 'Administrador del Sistema'},
        {'nombre': 'admin_planeacion', 'descripcion': 'Administrador de Planeación'},
        {'nombre': 'planeacion_facultad', 'descripcion': 'Planeación de Facultad'},
        {'nombre': 'supervisor_general', 'descripcion': 'Supervisor General', 'supervisa_espacios': True},
        {'nombre': 'docente', 'descripcion': 'Docente'},
        {'nombre': 'estudiante', 'descripcion': 'Estudiante'},
    ]
    
    created_count = 0
    for rol_data in roles_data:
        rol, created = Rol.objects.get_or_create(nombre=rol_data['nombre'], defaults=rol_data)
        if not created and 'supervisa_espacios' in rol_data and rol.supervisa_espacios != rol_data['supervisa_espacios']:
            rol.supervisa_espacios = rol_data['supervisa_espacios']
            rol.save(update_fields=['supervisa_espacios'])
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} roles creados ({len(roles_data)} totales)'))
