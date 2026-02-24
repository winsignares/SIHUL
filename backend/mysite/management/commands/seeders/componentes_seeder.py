"""
Seeder de componentes del sistema de permisos.
"""

from componentes.models import Componente


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
