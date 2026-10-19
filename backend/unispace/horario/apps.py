from django.apps import AppConfig


class HorarioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'unispace.horario'
    label = 'horario'

    def ready(self):
        """Importar signals cuando la app esté lista"""
        import unispace.horario.signals  # noqa
