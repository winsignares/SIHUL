"""
Seeder de asignación de componentes a roles.
"""

from componentes.models import Componente, ComponenteRol
from usuarios.models import Rol

def create_componentes_rol(stdout, style):
    """Asignar componentes a roles con sus permisos"""
    stdout.write('  → Asignando componentes a roles...')
    
    # Definir asignaciones: (nombre_rol, nombre_componente, permiso)
    asignaciones_data = [
        # Administrador de sistema - tiene acceso a todos los componentes de administración
        ('admin', 'Gestión de Usuarios', 'EDITAR'),
        ('admin', 'Gestión de Roles', 'EDITAR'),
        ('admin', 'Gestión de Componentes', 'EDITAR'),

        # Administrador de planeacion - tiene acceso a todos los componentes de administración
        ('admin_planeacion', 'Dashboard', 'EDITAR'),
        ('admin_planeacion', 'Centro Institucional', 'EDITAR'),
        ('admin_planeacion', 'Centro de Horarios', 'EDITAR'),
        ('admin_planeacion', 'Asignación Automática', 'EDITAR'),
        ('admin_planeacion', 'Préstamos de Espacios', 'EDITAR'),
        ('admin_planeacion', 'Periodos Académicos', 'EDITAR'),
        ('admin_planeacion', 'Asistentes Virtuales', 'EDITAR'),
        ('admin_planeacion', 'Ocupación Semanal', 'VER'),
        ('admin_planeacion', 'Reportes Generales', 'VER'),
        ('admin_planeacion', 'Estado de Recursos', 'EDITAR'),
        
        # Planeación de Facultad - similar a admin pero enfocado en su facultad
        ('planeacion_facultad', 'Dashboard', 'EDITAR'),
        ('planeacion_facultad', 'Centro Institucional', 'VER'),
        ('planeacion_facultad', 'Centro de Horarios', 'EDITAR'),
        ('planeacion_facultad', 'Asignación Automática', 'EDITAR'),
        ('planeacion_facultad', 'Préstamos de Espacios', 'EDITAR'),
        ('planeacion_facultad', 'Periodos Académicos', 'VER'),
        ('planeacion_facultad', 'Asistentes Virtuales', 'VER'),
        ('planeacion_facultad', 'Ocupación Semanal', 'VER'),
        ('planeacion_facultad', 'Reportes Generales', 'VER'),
        ('planeacion_facultad', 'Estado de Recursos', 'VER'),
        
        # Supervisor General
        ('supervisor_general', 'Dashboard Supervisor', 'EDITAR'),
        ('supervisor_general', 'Disponibilidad de Espacios', 'VER'),
        ('supervisor_general', 'Apertura y Cierre de Salones', 'EDITAR'),
        ('supervisor_general', 'Estado de Recursos', 'EDITAR'),
        ('supervisor_general', 'Asistentes Virtuales Supervisor', 'VER'),
        
        # Docente
        ('docente', 'Dashboard Docente', 'VER'),
        ('docente', 'Mi Horario', 'VER'),
        ('docente', 'Préstamos Docente', 'EDITAR'),
        ('docente', 'Asistentes Virtuales Docente', 'VER'),
        
        # Estudiante
        ('estudiante', 'Dashboard Estudiante', 'VER'),
        ('estudiante', 'Mi Horario Estudiante', 'VER'),
        ('estudiante', 'Asistentes Virtuales Estudiante', 'VER'),
    ]
    
    created_count = 0
    for nombre_rol, nombre_componente, permiso in asignaciones_data:
        try:
            rol = Rol.objects.get(nombre=nombre_rol)
            componente = Componente.objects.get(nombre=nombre_componente)
            
            _, created = ComponenteRol.objects.get_or_create(
                rol=rol,
                componente=componente,
                defaults={'permiso': permiso}
            )
            
            if created:
                created_count += 1
        except (Rol.DoesNotExist, Componente.DoesNotExist) as e:
            stdout.write(style.WARNING(f'    ⚠ Omitiendo: {nombre_rol} - {nombre_componente} ({str(e)})'))
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} asignaciones creadas ({len(asignaciones_data)} totales)'))