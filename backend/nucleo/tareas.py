"""Trabajo en segundo plano.

`encolar(funcion, *args)` ejecuta `funcion` fuera de la petición HTTP:
- TAREAS_COLA=hilo (por defecto): en un hilo del mismo proceso, como se hacía hasta ahora.
- TAREAS_COLA=rq: se encola en Redis y lo toma un proceso aparte
  (`python manage.py trabajador_tareas`), que permite escalar los procesos web sin perder tareas.

La función debe poder importarse por su ruta (función de módulo) y recibir argumentos simples.
Si la cola no responde, se recurre al hilo para no perder la tarea.
"""
import logging
import os
import threading

logger = logging.getLogger(__name__)

NOMBRE_COLA = 'sihul'


def modo_cola():
    return (os.getenv('TAREAS_COLA') or 'hilo').strip().lower()


def _url_redis():
    return os.getenv('TAREAS_REDIS_URL') or os.getenv('REDIS_URL') or ''


def obtener_cola():
    """Cola RQ de SIHUL. Importa `rq` y `redis` solo cuando se usa."""
    from redis import Redis
    from rq import Queue

    return Queue(NOMBRE_COLA, connection=Redis.from_url(_url_redis()))


def _en_hilo(funcion, args, kwargs):
    threading.Thread(target=funcion, args=args, kwargs=kwargs, daemon=True).start()


def encolar(funcion, *args, **kwargs):
    """Lanza `funcion(*args, **kwargs)` en segundo plano. Devuelve el modo con el que se lanzó."""
    if modo_cola() == 'rq':
        try:
            obtener_cola().enqueue(funcion, *args, **kwargs)
            return 'rq'
        except Exception:
            logger.exception('No se pudo encolar %s en RQ; se ejecuta en un hilo', getattr(funcion, '__name__', funcion))
    _en_hilo(funcion, args, kwargs)
    return 'hilo'
