"""Endpoints de salud para Docker, el despliegue y (más adelante) el monitoreo.

- /health/        liveness: el proceso responde (no toca la base de datos).
- /health/ready/  readiness: la base de datos y la caché responden.
"""
from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse


def live(request):
    return JsonResponse({'status': 'ok'})


def ready(request):
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
