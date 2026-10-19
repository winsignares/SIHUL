from django.apps import AppConfig


class ProgramasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'unispace.programas'
    label = 'programas'

    def ready(self):
        import unispace.programas.signals
