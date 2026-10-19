"""
Seeder de agentes de chatbot.
"""

from chatbot.models import Agente


def create_agentes(stdout, style):
    """Crear agentes de chatbot"""
    stdout.write('  → Creando agentes de chatbot...')
    
    agentes_data = [
        {
            'nombre': 'Agente Biblioteca',
            'subtitulo': 'Asistente de Biblioteca',
            'descripcion': 'Consultas sobre préstamos de libros, horarios de la biblioteca, reservas de salas de estudio y recursos bibliográficos.',
            'icono': 'BookOpen',
            'color': 'blue',
            'bg_gradient': 'from-blue-500 via-blue-600 to-indigo-600',
            'activo': True,
            'endpoint_url': 'https://unilibreproyecto.app.n8n.cloud/webhook/chatBiblioteca',
            'mensaje_bienvenida': '¡Hola! 👋 Soy tu asistente de biblioteca.\n\nPuedo ayudarte con:\n📚 Préstamos de libros\n⏰ Horarios de la biblioteca\n📖 Reservas de salas de estudio\n🔄 Renovaciones\n\n¿En qué puedo asistirte hoy?',
            'orden': 1
        },
    ]
    
    created_count = 0
    for agente_data in agentes_data:
        _, created = Agente.objects.get_or_create(
            nombre=agente_data['nombre'],
            defaults=agente_data
        )
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} agentes creados ({len(agentes_data)} totales)'))
