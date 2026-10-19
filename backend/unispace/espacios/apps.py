from django.apps import AppConfig


class EspaciosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'unispace.espacios'
    label = 'espacios'

    def ready(self):
        from . import signals  # noqa: F401
