from django.apps import AppConfig


class NucleoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'nucleo'
    verbose_name = 'Configuración del Sistema'

    def ready(self):
        from .cache_signals import register_catalog_cache_signals
        register_catalog_cache_signals()

        from .eventos.senales import registrar_senales_de_eventos
        registrar_senales_de_eventos()
