from django.apps import AppConfig


class FacturasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'financiero.facturas'
    label = 'facturas'

    def ready(self):
        from . import signals  # noqa: F401
