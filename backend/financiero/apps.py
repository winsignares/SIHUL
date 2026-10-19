from django.apps import AppConfig


class FinancieroConfig(AppConfig):
    """Contenedor del dominio financiero.

    Conserva el historial de migraciones original (0001-0027) y los comandos de
    gestion. Los modelos viven en las sub-apps (proveedores, contabilidad,
    facturas, parametros, reportes).
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'financiero'
    verbose_name = 'Gestión Financiera'
