"""Endpoint de eventos en tiempo real (SSE): `GET /api/eventos/`.

El navegador abre una conexión con la cookie de sesión y recibe, una por una, las notificaciones de que algo cambió.
Cada conexión ocupa un hilo mientras dura, así que conviene servir este endpoint desde un proceso aparte
(ver documentacion_backend/EVENTOS_TIEMPO_REAL.md).
"""
import json
import time

from django.http import JsonResponse, StreamingHttpResponse

from nucleo.vistas import VistaJson

from . import canal
from .audiencia import debe_recibir

LATIDO_SEGUNDOS = 15
VIDA_MAXIMA_SEGUNDOS = 1800  # al cerrar, el navegador se reconecta y la sesión se vuelve a comprobar
REINTENTO_MS = 5000


def _flujo(usuario, vida_maxima):
    suscripcion = canal.suscribir()
    try:
        yield f'retry: {REINTENTO_MS}\n\n'
        fin = time.monotonic() + vida_maxima
        while time.monotonic() < fin:
            texto = suscripcion.siguiente(LATIDO_SEGUNDOS)
            if texto is None:
                yield ': latido\n\n'
                continue
            try:
                evento = json.loads(texto)
            except ValueError:
                continue
            if debe_recibir(evento, usuario):
                yield f'data: {json.dumps({k: evento.get(k) for k in ("recurso", "accion", "id")})}\n\n'
    finally:
        suscripcion.cerrar()


class EventosView(VistaJson):
    def get(self, request):
        usuario = getattr(request, 'user_obj', None)
        if usuario is None:
            return JsonResponse({'error': 'Autenticación requerida'}, status=401)
        if not canal.disponible():
            return JsonResponse({'error': 'Tiempo real no disponible'}, status=503)
        respuesta = StreamingHttpResponse(_flujo(usuario, VIDA_MAXIMA_SEGUNDOS), content_type='text/event-stream')
        respuesta['Cache-Control'] = 'no-cache'
        respuesta['X-Accel-Buffering'] = 'no'
        return respuesta
