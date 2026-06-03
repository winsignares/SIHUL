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
    
    # Preguntas sugeridas para Agente Biblioteca basadas en el contexto de la Universidad Libre
    preguntas = [
        '¿Qué función principal permite realizar la cuenta de usuario de la Biblioteca?',
        '¿Cuántas renovaciones por cuántos días hábiles se permiten para Libros de Colección General a los Estudiantes de pregrado?',
        '¿Cuántas renovaciones por cuántos días hábiles se permiten para Libros de Colección General a los Docentes?',
        '¿Cuántas renovaciones por cuántos días hábiles se permiten para Libros de Colección General a los Administrativos?',
        '¿A qué tipo de usuarios no aplica la renovación de Libros de Colección General?',
        '¿Cuál es el tiempo de renovación para el material de Literatura para Estudiantes de posgrado?',
        '¿Cuál es el tiempo de renovación para el material de Literatura para Docentes?',
        '¿Cuál es el tiempo de renovación para el material de Literatura para Administrativos?',
        '¿Cuál es el tiempo de renovación para el material de Literatura para Estudiantes de pregrado?',
        '¿Por cuánto tiempo se prestan los libros de Colección Reserva?',
        '¿Qué tipo de uso tienen las Revistas?',
        '¿Qué tipo de uso tienen los libros de Colección Referencia?',
        '¿Cuál es el horario de atención de la Biblioteca en la Sede Principal de lunes a viernes?',
        '¿Cuál es el horario de atención de la Biblioteca en la Sede Centro los sábados?',
        '¿Cuál es el número de teléfono principal y extensiones relacionadas con Circulación y préstamo en la Sede Principal?',
        '¿Cuál es el correo electrónico para consultas sobre el Repositorio Institucional?',
        '¿Cuál es la línea gratuita nacional de la Universidad Libre?',
        '¿Cuáles son los recursos de información virtuales que destaca la página de la Biblioteca Seccional Barranquilla?',
        '¿Qué grupos de la comunidad tienen servicios específicos ofrecidos por la biblioteca?',
        '¿Cuál es el horario de atención de la Biblioteca en la Sede Centro de lunes a viernes?',
        '¿Cuál es el número de teléfono y extensión principal para Circulación y préstamo en la Sede Principal?',
        '¿Cuál es la extensión de la Hemeroteca – Referencia en la Sede Principal?',
        '¿Cuál es la extensión de la Dirección de Biblioteca en la Sede Principal?',
        '¿Qué actividad cultural realiza la Biblioteca Seccional Barranquilla una vez al año?',
        '¿Con qué frecuencia se programa anualmente la exposición de obras literarias?',
        '¿Con qué frecuencia se organiza la Feria de Servicios de la Biblioteca Seccional Barranquilla?',
        '¿Cuál es el nombre del correo electrónico para Repositorio Institucional?',
        '¿Cuál es la tecnología que la biblioteca está implementando para mejorar la experiencia de los usuarios, haciéndola más libre y ágil?',
        '¿Qué base de datos se destaca en la sección de noticias de la Universidad Libre?',
        '¿Qué se debe hacer primero para pagar en línea (PSE) un servicio de la biblioteca?',
        '¿Qué herramientas de apoyo a la investigación se mencionan explícitamente en el sitio?',
        '¿Qué servicio ofrece la Biblioteca Seccional Barranquilla con base en el Acuerdo No 2 del 22 de mayo de 2019?',
        '¿Qué deben autorizar los autores para que su trabajo de grado forme parte de la colección bibliográfica virtual de la Universidad Libre?',
        '¿A qué correo electrónico se debe escribir si se tienen dudas frente al proceso de carga de documentos en el Repositorio Institucional Unilibre (RIU)?',
        '¿Qué se recomienda hacer si el trabajo de grado o tesis cuenta con anexos en formatos diferentes a PDF?',
        '¿Se puede cargar un artículo como requisito de grado?',
        '¿Queda automáticamente aprobado el trabajo?',
        '¿Qué pasa si falta información?',
        '¿Cómo se notifica la aprobación?',
        '¿Tiempo de validación?',
        '¿Guías disponibles?',
        '¿Guía para coordinadores?',
        '¿Teléfonos sede principal?',
        '¿Extensión repositorio?',
        '¿Correo sede centro?',
        '¿A quién está dirigido el préstamo de portátiles?',
        '¿Duración inicial?',
        '¿Extensión máxima?',
        '¿Requisito?',
        '¿Tiempo préstamo Libros Colección General pregrado?',
        '¿Posgrado?',
        '¿Docentes?',
        '¿Administrativos?',
        '¿Renovaciones?',
        '¿Literatura?',
        '¿Colección reserva?',
        '¿Revistas y referencia?',
        '¿Préstamo interbibliotecario?',
        '¿Devolución?',
        '¿Préstamo externo Luis Ángel Arango?',
        '¿Préstamo interinstitucional?',
        '¿Capacidad sala de sistemas La Candelaria?',
        '¿Quién diligencia formato de solicitud de material?',
        '¿A quién se envía desde decanatura?',
        '¿Quién usa Recomendar un libro?',
        '¿Correo donaciones?',
        '¿Qué permite Asesoría y Formación?',
        '¿Horario sede principal?',
        '¿Horario sede centro sábados?',
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
