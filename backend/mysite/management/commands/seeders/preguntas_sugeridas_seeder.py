"""
Seeder de preguntas sugeridas para agentes de chatbot.
"""

from chatbot.models import Agente, PreguntaSugerida


def create_preguntas_sugeridas(stdout, style):
    """Crear preguntas sugeridas para los agentes de chatbot"""
    stdout.write('  → Creando preguntas sugeridas...')
    
    # Obtener el agente de biblioteca
    try:
        agente_biblioteca = Agente.objects.get(nombre='Agente Biblioteca')
    except Agente.DoesNotExist:
        stdout.write(style.ERROR('    ✗ Agente Biblioteca no encontrado. Ejecuta primero el seeder de agentes.'))
        return
    
    # Preguntas sugeridas para Agente Biblioteca basadas en el banco de preguntas del usuario
    preguntas = [
        '¿Cuáles son los horarios de atención de la Biblioteca en la Sede Principal?',
        '¿Cuál es el horario de atención de la Biblioteca en la Sede Centro?',
        '¿Quién es el director de la Biblioteca?',
        '¿Cuál es el número de teléfono principal de la Biblioteca en Barranquilla?',
        '¿A qué número de extensión puedo llamar si tengo preguntas sobre Circulación y Préstamo de Reserva en la Sede Principal?',
        '¿A quién debo contactar para asuntos relacionados con el Repositorio Institucional y cuál es su correo?',
        '¿Cuál es el teléfono y las extensiones para contactar a la Dirección de Biblioteca en la Sede Principal?',
        '¿Qué requisitos son indispensables para poder prestar material bibliográfico?',
        '¿Qué puedo hacer al acceder a mi cuenta de usuario de la Biblioteca?',
        '¿Cuál es la contraseña inicial para acceder al perfil en la Biblioteca?',
        '¿Cuál es el tiempo de préstamo y renovación para material de Literatura si soy docente o administrativo?',
        '¿Cuál es el tiempo de préstamo para los Libros de Colección Reserva para todos los usuarios?',
        '¿Cuál es la política de préstamo para Revistas y Libros de Colección Referencia?',
        '¿El tiempo de renovación de Libros de Colección General es el mismo para docentes y estudiantes de pregrado?',
        '¿Cómo puedo renovar un libro de Colección General si soy estudiante de pregrado?',
        '¿Pueden los estudiantes de posgrado renovar libros de Colección General?',
        '¿Cómo puede un usuario verificar el material que tiene prestado y si tiene multas?',
        'Si soy estudiante de otra universidad con convenio, ¿qué necesito para hacer uso del servicio de préstamo?',
        '¿Por cuánto tiempo puedo solicitar un portátil en préstamo y dónde debo usarlo?',
        '¿Qué servicios especiales ofrece la Biblioteca para usuarios en condición de discapacidad visual?',
        '¿Qué actividades culturales realiza la Biblioteca Seccional Barranquilla?',
        '¿Qué es el Préstamo Interbibliotecario?',
        '¿Qué debo hacer si identifico un libro en otra institución y quiero solicitarlo por préstamo interbibliotecario?',
        '¿Qué es el Préstamo Interinstitucional?',
        '¿Cuántos títulos puedo solicitar por Préstamo Interinstitucional?',
        '¿Qué otra biblioteca de importancia puedo solicitar en préstamo material bibliográfico por 8 días hábiles?',
        'Si soy estudiante y quiero sugerir la compra de un libro, ¿qué debo hacer?',
        '¿A qué correo puedo escribir para solicitar la reserva de la sala de sistemas o para información general de los servicios de Barranquilla?',
        '¿Qué tipo de servicios de consulta interinstitucional ofrece la Biblioteca?',
        '¿Cómo se accede a los recursos digitales (Bases de Datos y Libros Electrónicos)?',
        '¿Qué tipo de problemas de investigación me ayuda a resolver el servicio de Asesoría y Formación?',
        '¿Qué tipo de recursos digitales ofrece la Biblioteca para apoyar la investigación?',
        '¿Quiénes pueden utilizar los Recursos de Información disponibles en el sitio web?',
        '¿Qué se necesita para acceder a la mayoría de los recursos digitales como las Bases de Datos?',
        '¿Cuáles son algunas Bases de Datos especializadas disponibles?',
        '¿Qué colecciones de Libros Electrónicos están disponibles?',
        '¿Qué servicio ofrece la Biblioteca para promover la integridad académica y prevenir el plagio?',
        '¿Qué herramientas promueve la Biblioteca para gestionar referencias bibliográficas?',
        '¿Ofrecen orientación sobre el uso de la herramienta Turnitin?',
    ]
    
    created_count = 0
    for idx, pregunta in enumerate(preguntas, start=1):
        _, created = PreguntaSugerida.objects.get_or_create(
            agente=agente_biblioteca,
            pregunta=pregunta,
            defaults={
                'orden': idx,
                'contador_uso': 0,
                'activo': True
            }
        )
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} preguntas sugeridas creadas ({len(preguntas)} totales)'))
