"""Configuración de escalabilidad: apagada por defecto (el comportamiento de siempre)."""
from django.conf import settings
from django.test import SimpleTestCase


class ConfiguracionPorDefectoTests(SimpleTestCase):
    def test_conexiones_no_persistentes_por_defecto(self):
        base = settings.DATABASES['default']
        self.assertEqual(base['CONN_MAX_AGE'], 0)
        self.assertFalse(base['CONN_HEALTH_CHECKS'])

    def test_la_sesion_sigue_en_la_base_por_defecto(self):
        self.assertEqual(getattr(settings, 'SESSION_ENGINE', 'django.contrib.sessions.backends.db'),
                         'django.contrib.sessions.backends.db')
