"""
Seeder de espacios permitidos para supervisores.
"""

from usuarios.models import Usuario, Rol
from espacios.models import EspacioFisico, EspacioPermitido


def create_espacios_permitidos(stdout, style):
    """Asignar espacios permitidos a supervisores generales"""
    stdout.write('  → Asignando espacios permitidos a supervisores (5 espacios para pruebas)...')
    
    # Obtener rol de supervisor general
    try:
        rol_supervisor = Rol.objects.get(nombre='supervisor_general')
    except Rol.DoesNotExist:
        stdout.write(style.ERROR('    ✗ Rol supervisor_general no encontrado'))
        return
    
    # Obtener todos los supervisores generales
    supervisores = Usuario.objects.filter(rol=rol_supervisor, activo=True)
    
    if not supervisores.exists():
        stdout.write(style.WARNING('    ⚠ No hay supervisores generales activos en el sistema'))
        return
    
    # Obtener solo los primeros 5 espacios físicos para pruebas
    espacios = EspacioFisico.objects.all()[:5]
    
    if not espacios:
        stdout.write(style.WARNING('    ⚠ No hay espacios físicos en el sistema'))
        return
    
    created_count = 0
    
    # Asignar los primeros 5 espacios a cada supervisor general
    for supervisor in supervisores:
        for espacio in espacios:
            _, created = EspacioPermitido.objects.get_or_create(
                usuario=supervisor,
                espacio=espacio
            )
            if created:
                created_count += 1
    
    total_asignaciones = supervisores.count() * len(espacios)
    stdout.write(style.SUCCESS(
        f'    ✓ {created_count} asignaciones creadas ({total_asignaciones} totales) - {len(espacios)} espacios x {supervisores.count()} supervisor(es)'
    ))
