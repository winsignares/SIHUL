from django.apps import AppConfig


class ConfigConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'config'
    verbose_name = 'Configuración del Sistema'

    def ready(self):
        from .cache_signals import register_catalog_cache_signals
        register_catalog_cache_signals()
