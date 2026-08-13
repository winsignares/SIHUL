"""
Seeder de roles del sistema.
"""

from usuarios.models import Rol
from sedes.models import Seccional


def _get_barranquilla_seccional():
    return (
        Seccional.objects.filter(ciudad__iexact='Barranquilla').first()
        or Seccional.objects.order_by('id').first()
    )


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
    seccional = _get_barranquilla_seccional()
    
    created_count = 0
    for rol_data in roles_data:
        defaults = {**rol_data, 'seccional': seccional}
        rol, created = Rol.objects.get_or_create(
            nombre=rol_data['nombre'],
            seccional=seccional,
            defaults=defaults,
        )
        update_fields = []
        if not created and 'supervisa_espacios' in rol_data and rol.supervisa_espacios != rol_data['supervisa_espacios']:
            rol.supervisa_espacios = rol_data['supervisa_espacios']
            update_fields.append('supervisa_espacios')
        if not created and seccional and rol.seccional_id != seccional.id:
            rol.seccional = seccional
            update_fields.append('seccional')
        if update_fields:
            rol.save(update_fields=update_fields)
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} roles creados ({len(roles_data)} totales)'))
