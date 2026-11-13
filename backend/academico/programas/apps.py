from django.apps import AppConfig


class ProgramasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'academico.programas'
    label = 'programas'

    def ready(self):
        import academico.programas.signals  # noqa: F401  (registra las señales)
