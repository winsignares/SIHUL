"""
Seeder de tipos de actividad para préstamos de espacios.
"""

from prestamos.models import TipoActividad


def create_tipos_actividad(stdout, style):
    """Crear tipos de actividad para la Universidad Libre"""
    stdout.write('  → Creando tipos de actividad...')
    
    tipos_data = [
        {
            'nombre': 'Clase Regular',
            'descripcion': 'Clase magistral o teórica de una asignatura del programa académico'
        },
        {
            'nombre': 'Clase Práctica',
            'descripcion': 'Sesión práctica o de laboratorio de una asignatura'
        },
        {
            'nombre': 'Examen',
            'descripcion': 'Evaluación académica o prueba final de asignatura'
        },
        {
            'nombre': 'Parcial',
            'descripcion': 'Evaluación parcial de una asignatura'
        },
        {
            'nombre': 'Quiz',
            'descripcion': 'Evaluación corta de conocimientos'
        },
        {
            'nombre': 'Taller',
            'descripcion': 'Actividad académica práctica grupal'
        },
        {
            'nombre': 'Conferencia',
            'descripcion': 'Charla académica o exposición magistral con invitado especial'
        },
        {
            'nombre': 'Seminario',
            'descripcion': 'Reunión académica para el análisis y discusión de temas específicos'
        },
        {
            'nombre': 'Conversatorio',
            'descripcion': 'Diálogo académico o intercambio de ideas sobre un tema específico'
        },
        {
            'nombre': 'Sustentación',
            'descripcion': 'Defensa de trabajo de grado, tesis o proyecto académico'
        },
        {
            'nombre': 'Actividad Cultural',
            'descripcion': 'Evento cultural, artístico o de bienestar universitario'
        },
        {
            'nombre': 'Actividad Deportiva',
            'descripcion': 'Evento o práctica deportiva institucional'
        },
        {
            'nombre': 'Reunión Académica',
            'descripcion': 'Junta o reunión de programa, departamento o facultad'
        },
        {
            'nombre': 'Reunión Administrativa',
            'descripcion': 'Reunión de carácter administrativo o de gestión institucional'
        },
        {
            'nombre': 'Capacitación',
            'descripcion': 'Sesión de formación o entrenamiento para docentes o personal'
        },
        {
            'nombre': 'Actividad de Extensión',
            'descripcion': 'Actividad de proyección social o extensión a la comunidad'
        },
        {
            'nombre': 'Evento Institucional',
            'descripcion': 'Ceremonia, acto oficial o evento representativo de la universidad'
        },
        {
            'nombre': 'Actividad de Investigación',
            'descripcion': 'Sesión de trabajo de grupo de investigación o semillero'
        },
        {
            'nombre': 'Asesoría',
            'descripcion': 'Sesión de orientación académica o tutoría de estudiantes'
        },
        {
            'nombre': 'Ensayo',
            'descripcion': 'Práctica o ensayo de presentación, obra o actividad artística'
        },
        {
            'nombre': 'Semillero de Investigación',
            'descripcion': 'Reunión de semillero de investigación para desarrollo de proyectos y líneas de investigación'
        },
        {
            'nombre': 'Alianza Canadiense',
            'descripcion': 'Actividad académica o curso relacionado con la Alianza Canadiense'
        },
        {
            'nombre': 'Alianza Francesa',
            'descripcion': 'Actividad académica o curso relacionado con la Alianza Francesa'
        },
    ]
    
    created_count = 0
    for tipo_data in tipos_data:
        _, created = TipoActividad.objects.get_or_create(
            nombre=tipo_data['nombre'], 
            defaults={'descripcion': tipo_data['descripcion']}
        )
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} tipos de actividad creados ({len(tipos_data)} totales)'))
