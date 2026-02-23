"""
Seeder de componentes del sistema de permisos y su asignación a roles.
"""

from componentes.models import Componente, ComponenteRol
from usuarios.models import Rol


def create_componentes(stdout, style):
    """Crear componentes del sistema de permisos"""
    stdout.write('  → Creando componentes del sistema...')
    
    componentes_data = [
        # Componentes para Admin
        {'nombre': 'Dashboard', 'descripcion': 'Panel principal de administración'},
        {'nombre': 'Centro Institucional', 'descripcion': 'Gestión de facultades y programas'},
        {'nombre': 'Centro de Horarios', 'descripcion': 'Gestión central de horarios'},
        {'nombre': 'Asignación Automática', 'descripcion': 'Asignación automática de espacios'},
        {'nombre': 'Préstamos de Espacios', 'descripcion': 'Gestión de préstamos de espacios'},
        {'nombre': 'Periodos Académicos', 'descripcion': 'Gestión de periodos académicos'},
        {'nombre': 'Asistentes Virtuales', 'descripcion': 'Chatbots y asistentes virtuales'},
        {'nombre': 'Ocupación Semanal', 'descripcion': 'Reporte de ocupación semanal'},
        {'nombre': 'Reportes Generales', 'descripcion': 'Reportes y estadísticas generales'},
        {'nombre': 'Gestión de Usuarios', 'descripcion': 'Administración de usuarios del sistema'},
        {'nombre': 'Estado de Recursos', 'descripcion': 'Monitoreo de recursos físicos'},
        
        # Componentes para Supervisor General
        {'nombre': 'Dashboard Supervisor', 'descripcion': 'Panel de supervisor general'},
        {'nombre': 'Disponibilidad de Espacios', 'descripcion': 'Consulta de disponibilidad de espacios'},
        {'nombre': 'Apertura y Cierre de Salones', 'descripcion': 'Control de apertura y cierre de salones'},
        {'nombre': 'Asistentes Virtuales Supervisor', 'descripcion': 'Asistentes virtuales para supervisores'},
        
        # Componentes para Docente
        {'nombre': 'Dashboard Docente', 'descripcion': 'Panel principal del docente'},
        {'nombre': 'Mi Horario', 'descripcion': 'Visualización de horario personal'},
        {'nombre': 'Préstamos Docente', 'descripcion': 'Solicitud de préstamos de espacios'},
        {'nombre': 'Asistentes Virtuales Docente', 'descripcion': 'Asistentes virtuales para docentes'},
        
        # Componentes para Estudiante
        {'nombre': 'Dashboard Estudiante', 'descripcion': 'Panel principal del estudiante'},
        {'nombre': 'Mi Horario Estudiante', 'descripcion': 'Visualización de horario de clases'},
        {'nombre': 'Asistentes Virtuales Estudiante', 'descripcion': 'Asistentes virtuales para estudiantes'},
    ]
    
    created_count = 0
    for componente_data in componentes_data:
        _, created = Componente.objects.get_or_create(
            nombre=componente_data['nombre'],
            defaults=componente_data
        )
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} componentes creados ({len(componentes_data)} totales)'))


def create_componentes_rol(stdout, style):
    """Asignar componentes a roles con sus permisos"""
    stdout.write('  → Asignando componentes a roles...')
    
    # Definir asignaciones: (nombre_rol, nombre_componente, permiso)
    asignaciones_data = [
        # Admin - tiene acceso a todos los componentes de administración
        ('admin', 'Dashboard', 'EDITAR'),
        ('admin', 'Centro Institucional', 'EDITAR'),
        ('admin', 'Centro de Horarios', 'EDITAR'),
        ('admin', 'Asignación Automática', 'EDITAR'),
        ('admin', 'Préstamos de Espacios', 'EDITAR'),
        ('admin', 'Periodos Académicos', 'EDITAR'),
        ('admin', 'Asistentes Virtuales', 'EDITAR'),
        ('admin', 'Ocupación Semanal', 'VER'),
        ('admin', 'Reportes Generales', 'VER'),
        ('admin', 'Gestión de Usuarios', 'EDITAR'),
        ('admin', 'Estado de Recursos', 'EDITAR'),
        
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

