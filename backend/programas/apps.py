from django.apps import AppConfig


class ProgramasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'programas'

    def ready(self):
        import programas.signals
