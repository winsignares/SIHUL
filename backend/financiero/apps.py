from django.apps import AppConfig


class FinancieroConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'financiero'
    verbose_name = 'Gestión Financiera'

    def ready(self):
        from . import signals  # noqa: F401
