import sys
import types
from unittest import mock

from django.test import SimpleTestCase

from mysite import tareas


def _tarea_de_prueba(valor):
    return valor


class EncolarTests(SimpleTestCase):
    def test_por_defecto_corre_en_un_hilo(self):
        with mock.patch.dict('os.environ', {}, clear=False), mock.patch('mysite.tareas.threading.Thread') as hilo:
            with mock.patch.dict('os.environ', {'TAREAS_COLA': ''}):
                modo = tareas.encolar(_tarea_de_prueba, 5)
        self.assertEqual(modo, 'hilo')
        hilo.assert_called_once_with(target=_tarea_de_prueba, args=(5,), kwargs={}, daemon=True)
        hilo.return_value.start.assert_called_once_with()

    def test_modo_rq_encola_en_redis(self):
        cola = mock.Mock()
        with mock.patch.dict('os.environ', {'TAREAS_COLA': 'rq'}), mock.patch('mysite.tareas.obtener_cola', return_value=cola):
            modo = tareas.encolar(_tarea_de_prueba, 7)
        self.assertEqual(modo, 'rq')
        cola.enqueue.assert_called_once_with(_tarea_de_prueba, 7)

    def test_si_la_cola_falla_se_usa_un_hilo(self):
        with mock.patch.dict('os.environ', {'TAREAS_COLA': 'rq'}), \
                mock.patch('mysite.tareas.obtener_cola', side_effect=ConnectionError), \
                mock.patch('mysite.tareas.threading.Thread') as hilo:
            modo = tareas.encolar(_tarea_de_prueba, 1)
        self.assertEqual(modo, 'hilo')
        hilo.return_value.start.assert_called_once_with()

    def test_obtener_cola_usa_la_url_de_redis(self):
        redis = types.ModuleType('redis')
        redis.Redis = mock.Mock()
        rq = types.ModuleType('rq')
        rq.Queue = mock.Mock()
        with mock.patch.dict(sys.modules, {'redis': redis, 'rq': rq}), \
                mock.patch.dict('os.environ', {'REDIS_URL': 'redis://x:6379/0'}):
            tareas.obtener_cola()
        redis.Redis.from_url.assert_called_once_with('redis://x:6379/0')
        rq.Queue.assert_called_once_with(tareas.NOMBRE_COLA, connection=redis.Redis.from_url.return_value)
