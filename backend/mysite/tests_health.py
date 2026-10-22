from django.test import TestCase


class HealthTests(TestCase):
    def test_liveness_responde_sin_sesion(self):
        respuesta = self.client.get('/health/')
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json(), {'status': 'ok'})

    def test_readiness_comprueba_base_de_datos_y_cache(self):
        respuesta = self.client.get('/health/ready/')
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json()['checks'], {'database': 'ok', 'cache': 'ok'})
