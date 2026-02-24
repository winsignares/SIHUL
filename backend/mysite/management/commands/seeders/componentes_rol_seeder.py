"""
Seeder de asignación de componentes a roles.
"""

from componentes.models import Componente, ComponenteRol
from usuarios.models import Rol

def create_componentes_rol(stdout, style):
    """Asignar componentes a roles con sus permisos"""
    stdout.write('  → Asignando componentes a roles...')

    # Definir la asignación de componentes a roles y permisos
    asignaciones = [
        # Admin
        {'rol': 'Admin', 'componentes': [
            'Dashboard', 'Centro Institucional', 'Centro de Horarios', 'Asignación Automática',
            'Préstamos de Espacios', 'Periodos Académicos', 'Asistentes Virtuales', 'Ocupación Semanal',
            'Reportes Generales', 'Gestión de Usuarios', 'Estado de Recursos'
        ], 'permiso': ComponenteRol.Permiso.EDITAR},
        # Supervisor General
        {'rol': 'Supervisor General', 'componentes': [
            'Dashboard Supervisor', 'Disponibilidad de Espacios', 'Apertura y Cierre de Salones',
            'Asistentes Virtuales Supervisor'
        ], 'permiso': ComponenteRol.Permiso.EDITAR},
        # Docente
        {'rol': 'Docente', 'componentes': [
            'Dashboard Docente', 'Mi Horario', 'Préstamos Docente', 'Asistentes Virtuales Docente'
        ], 'permiso': ComponenteRol.Permiso.VER},
        # Estudiante
        {'rol': 'Estudiante', 'componentes': [
            'Dashboard Estudiante', 'Mi Horario Estudiante', 'Asistentes Virtuales Estudiante'
        ], 'permiso': ComponenteRol.Permiso.VER},
    ]

    created_count = 0
    for asignacion in asignaciones:
        try:
            rol = Rol.objects.get(nombre=asignacion['rol'])
        except Rol.DoesNotExist:
            stdout.write(style.ERROR(f"    ✗ Rol '{asignacion['rol']}' no encontrado."))
            continue
        for nombre_componente in asignacion['componentes']:
            try:
                componente = Componente.objects.get(nombre=nombre_componente)
            except Componente.DoesNotExist:
                stdout.write(style.ERROR(f"    ✗ Componente '{nombre_componente}' no encontrado."))
                continue
            _, created = ComponenteRol.objects.get_or_create(
                rol=rol,
                componente=componente,
                defaults={'permiso': asignacion['permiso']}
            )
            if created:
                created_count += 1
    stdout.write(style.SUCCESS(f'    ✓ {created_count} asignaciones de componentes a roles creadas'))
