from django.apps import AppConfig


class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'

    def ready(self):
        from . import signals  # noqa: F401
        from .eventos import registrar_eventos_del_chatbot
        registrar_eventos_del_chatbot()
