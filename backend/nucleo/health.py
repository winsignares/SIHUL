"""Endpoints de salud para Docker, el despliegue y (más adelante) el monitoreo.

- /health/        liveness: el proceso responde (no toca la base de datos).
- /health/ready/  readiness: la base de datos y la caché responden.
"""
from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse

from nucleo.vistas import VistaJson


class LiveView(VistaJson):
    authentication_classes = []  # sin sesión ni base de datos: es la prueba de vida del proceso

    def get(self, request):
        return JsonResponse({'status': 'ok'})


class ReadyView(VistaJson):
    authentication_classes = []

    def get(self, request):
        checks = {}
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            checks['database'] = 'ok'
        except Exception:
            checks['database'] = 'error'

        try:
            cache.set('health-check', '1', 5)
            checks['cache'] = 'ok' if cache.get('health-check') == '1' else 'error'
        except Exception:
            checks['cache'] = 'error'

        ok = all(value == 'ok' for value in checks.values())
        return JsonResponse(
            {'status': 'ok' if ok else 'degraded', 'checks': checks},
            status=200 if ok else 503,
        )
