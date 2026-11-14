"""Endpoint de eventos en tiempo real (SSE): `GET /api/eventos/`.

El navegador abre una conexión con la cookie de sesión y recibe, una por una, las notificaciones de que algo cambió.
Cada conexión ocupa un hilo mientras dura, así que conviene servir este endpoint desde un proceso aparte
(ver documentacion_backend/EVENTOS_TIEMPO_REAL.md).

Una conexión abierta no debe retener nada más: antes de transmitir se cierra la conexión a la base de datos y la
decisión de qué eventos recibe la persona se toma con un perfil calculado una sola vez.
"""
import json
import queue
import time

from django.db import connections
from django.http import JsonResponse, StreamingHttpResponse

from nucleo.vistas import VistaJson

from . import canal
from .audiencia import debe_recibir, perfil_de
from .difusion import difusor

LATIDO_SEGUNDOS = 15
VIDA_MAXIMA_SEGUNDOS = 1800  # al cerrar, el navegador se reconecta y la sesión se vuelve a comprobar
REINTENTO_MS = 5000


def _flujo(perfil, vida_maxima):
    cola = difusor.suscribir()
    try:
        yield f'retry: {REINTENTO_MS}\n\n'
        fin = time.monotonic() + vida_maxima
        while time.monotonic() < fin:
            try:
                texto = cola.get(timeout=LATIDO_SEGUNDOS)
            except queue.Empty:
                yield ': latido\n\n'
                continue
            try:
                evento = json.loads(texto)
            except ValueError:
                continue
            if debe_recibir(evento, perfil):
                yield f'data: {json.dumps({k: evento.get(k) for k in ("recurso", "accion", "id")})}\n\n'
    finally:
        difusor.cancelar(cola)


class EventosView(VistaJson):
    def get(self, request):
        usuario = getattr(request, 'user_obj', None)
        if usuario is None:
            return JsonResponse({'error': 'Autenticación requerida'}, status=401)
        if not canal.disponible():
            return JsonResponse({'error': 'Tiempo real no disponible'}, status=503)
        perfil = perfil_de(usuario)
        connections.close_all()  # la conexión puede durar horas: no se queda con una conexión a la base
        respuesta = StreamingHttpResponse(_flujo(perfil, VIDA_MAXIMA_SEGUNDOS), content_type='text/event-stream')
        respuesta['Cache-Control'] = 'no-cache'
        respuesta['X-Accel-Buffering'] = 'no'
        return respuesta
