"""El navegador avisa al servidor cuando una pantalla se rompe: una línea de log, recortada y con tope por IP."""
import json

from django.core.cache import cache
from django.test import TestCase

URL = '/api/auth/error-cliente/'


class ErrorClienteTests(TestCase):
    def setUp(self):
        cache.clear()

    def _enviar(self, datos, **extra):
        return self.client.post(URL, json.dumps(datos), content_type='application/json', **extra)

    def test_registra_el_error_en_el_log_del_servidor(self):
        with self.assertLogs('sihul.cliente', level='WARNING') as log:
            r = self._enviar({'origen': 'pantalla', 'mensaje': 'x is undefined', 'ruta': '/admin/chatbots', 'pila': 'at Foo'})
        self.assertEqual(r.status_code, 200)
        linea = log.output[0]
        self.assertIn('ERROR_CLIENTE', linea)
        self.assertIn('/admin/chatbots', linea)
        self.assertIn('x is undefined', linea)

    def test_incluye_el_usuario_de_la_sesion(self):
        sesion = self.client.session
        sesion['user_id'] = 4242
        sesion.save()
        with self.assertLogs('sihul.cliente', level='WARNING') as log:
            self._enviar({'mensaje': 'boom'})
        self.assertIn('usuario=4242', log.output[0])

    def test_no_permite_falsear_lineas_del_log(self):
        with self.assertLogs('sihul.cliente', level='WARNING') as log:
            self._enviar({'mensaje': 'uno\nERROR_CLIENTE falso\r\ndos\x00'})
        self.assertEqual(len(log.output), 1)
        self.assertNotIn('\n', log.output[0])
        self.assertNotIn('\x00', log.output[0])

    def test_recorta_los_textos_largos(self):
        with self.assertLogs('sihul.cliente', level='WARNING') as log:
            self._enviar({'mensaje': 'a' * 3000, 'pila': 'b' * 3000})
        self.assertLess(len(log.output[0]), 2500)

    def test_tope_por_minuto_desde_la_misma_ip(self):
        with self.assertLogs('sihul.cliente', level='WARNING'):
            codigos = [self._enviar({'mensaje': str(i)}).status_code for i in range(25)]
        self.assertEqual(codigos[:20], [200] * 20)
        self.assertEqual(codigos[20:], [429] * 5)

    def test_cuerpo_invalido_responde_400(self):
        r = self.client.post(URL, 'no es json', content_type='application/json')
        self.assertEqual(r.status_code, 400)
        r = self.client.post(URL, json.dumps([1, 2]), content_type='application/json')
        self.assertEqual(r.status_code, 400)

    def test_solo_acepta_post(self):
        self.assertEqual(self.client.get(URL).status_code, 405)
