"""Reparte los eventos de Redis a las conexiones SSE abiertas en este proceso.

Un solo hilo por proceso escucha el canal de Redis y deja cada evento en la cola de cada conexión. Así, con miles de
personas conectadas, Redis ve una suscripción por proceso (no una por persona) y las conexiones solo esperan en su cola.
"""
import logging
import queue
import threading
import time

from . import canal

logger = logging.getLogger(__name__)

TAMANO_COLA = 200  # una conexión lenta que no consume pierde eventos viejos; el frontend recarga al reconectar
ESPERA_ESCUCHA_SEGUNDOS = 1.0
ESPERA_REINTENTO_SEGUNDOS = 2.0


class Difusor:
    def __init__(self):
        self._candado = threading.Lock()
        self._colas = set()
        self._hilo = None

    def suscribir(self):
        cola = queue.Queue(maxsize=TAMANO_COLA)
        with self._candado:
            self._colas.add(cola)
            self._asegurar_hilo()
        return cola

    def cancelar(self, cola):
        with self._candado:
            self._colas.discard(cola)

    def _asegurar_hilo(self):
        if self._hilo is None or not self._hilo.is_alive():
            self._hilo = threading.Thread(target=self._escuchar, name='difusor-eventos', daemon=True)
            self._hilo.start()

    def _repartir(self, texto):
        with self._candado:
            colas = list(self._colas)
        for cola in colas:
            try:
                cola.put_nowait(texto)
            except queue.Full:
                try:  # se descarta lo más viejo para que quepa lo nuevo
                    cola.get_nowait()
                    cola.put_nowait(texto)
                except (queue.Empty, queue.Full):
                    pass

    def _escuchar(self):
        while True:
            with self._candado:
                if not self._colas:
                    self._hilo = None
                    return
            try:
                suscripcion = canal.suscribir()
            except Exception:
                logger.warning('No se pudo suscribir al canal de eventos; se reintenta', exc_info=True)
                time.sleep(ESPERA_REINTENTO_SEGUNDOS)
                continue
            try:
                while True:
                    with self._candado:
                        if not self._colas:
                            self._hilo = None
                            return
                    texto = suscripcion.siguiente(ESPERA_ESCUCHA_SEGUNDOS)
                    if texto is not None:
                        self._repartir(texto)
            except Exception:
                logger.warning('Se perdió la conexión con el canal de eventos; se reintenta', exc_info=True)
                time.sleep(ESPERA_REINTENTO_SEGUNDOS)
            finally:
                suscripcion.cerrar()


difusor = Difusor()
