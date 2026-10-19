from django.apps import AppConfig


class NotificacionesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'unispace.notificaciones'
    label = 'notificaciones'

    def ready(self):
        """Importa las señales cuando la aplicación está lista"""
        import unispace.notificaciones.signals
