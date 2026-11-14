from django.apps import AppConfig


class AsistenciaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'asistencia'
    verbose_name = 'Asistencia con ubicación'

    def ready(self):
        from .eventos import registrar_eventos_de_asistencia
        registrar_eventos_de_asistencia()
