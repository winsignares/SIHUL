"""Canal de Redis por el que viajan los eventos entre procesos y réplicas."""
import os
import time

NOMBRE_CANAL = 'sihul:eventos'


def _url():
    return os.getenv('EVENTOS_REDIS_URL') or os.getenv('REDIS_URL') or ''


def disponible():
    return bool(_url())


def _cliente():
    from redis import Redis

    return Redis.from_url(_url())


def publicar_mensaje(texto):
    """Envía un mensaje a todos los suscriptores. Sin Redis no hace nada."""
    if not disponible():
        return
    _cliente().publish(NOMBRE_CANAL, texto)


class Suscripcion:
    """Lee los mensajes del canal; `siguiente` devuelve el texto o None si pasó el tiempo sin mensajes."""

    def __init__(self):
        self._cliente = _cliente()
        self._pubsub = self._cliente.pubsub(ignore_subscribe_messages=True)
        self._pubsub.subscribe(NOMBRE_CANAL)

    def siguiente(self, espera_segundos):
        # get_message también devuelve None al procesar la confirmación de suscripción: se sigue esperando
        limite = time.monotonic() + espera_segundos
        while True:
            restante = limite - time.monotonic()
            if restante <= 0:
                return None
            mensaje = self._pubsub.get_message(timeout=restante)
            if mensaje:
                datos = mensaje.get('data')
                return datos.decode('utf-8') if isinstance(datos, bytes) else datos

    def cerrar(self):
        try:
            self._pubsub.close()
            self._cliente.close()
        except Exception:  # un fallo al cerrar no debe afectar a nadie
            pass


def suscribir():
    return Suscripcion()
