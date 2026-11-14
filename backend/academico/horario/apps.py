from django.apps import AppConfig


class HorarioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'academico.horario'
    label = 'horario'

    def ready(self):
        """Importar signals cuando la app esté lista"""
        import academico.horario.signals  # noqa
