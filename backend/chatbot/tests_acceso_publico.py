"""Acceso público protegido: sin sesión firmada no se gasta IA; con ella, rigen los límites de uso."""
import hashlib
import json
from unittest import mock

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse

from .acceso_publico import _ceros_iniciales
from .models import Agente

BITS = 8  # en las pruebas el desafío es fácil; en producción son 17


def _post(cliente, url, cuerpo=None, **extra):
    return cliente.post(url, json.dumps(cuerpo or {}), content_type='application/json', **extra)


def resolver(desafio, bits=BITS):
    contador = 0
    while _ceros_iniciales(hashlib.sha256(f'{desafio}:{contador}'.encode()).digest()) < bits:
        contador += 1
    return str(contador)


@override_settings(CHATBOT_PUBLICO_DIFICULTAD_BITS=BITS)
class AccesoPublicoTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.agente = Agente.objects.create(nombre='Asistente Prueba', activo=True, mensaje_bienvenida='Hola')

    def setUp(self):
        cache.clear()
        patcher = mock.patch('chatbot.views._consultar_rag', return_value=('Respuesta de la IA', None, []))
        self.rag = patcher.start()
        self.addCleanup(patcher.stop)

    def _sesion(self):
        desafio = _post(self.client, reverse('api-public-desafio')).json()
        respuesta = _post(self.client, reverse('api-public-sesion'),
                          {'desafio': desafio['desafio'], 'solucion': resolver(desafio['desafio'])})
        self.assertEqual(respuesta.status_code, 200, respuesta.content)
        return respuesta.json()['token']

    def _preguntar(self, token=None, pregunta='Hola', **cuerpo):
        datos = {'agente_id': self.agente.id, 'pregunta': pregunta, 'seccional': 'barranquilla', **cuerpo}
        extra = {'HTTP_X_CHATBOT_TOKEN': token} if token else {}
        return _post(self.client, reverse('api-public-pregunta'), datos, **extra)

    # ---- el intento de abuso: llamar directo al servicio --------------------------------

    def test_sin_sesion_no_se_gasta_ia(self):
        respuesta = self._preguntar()
        self.assertEqual(respuesta.status_code, 401)
        self.assertEqual(respuesta.json()['codigo'], 'sesion_invalida')
        self.rag.assert_not_called()

    def test_una_sesion_inventada_o_alterada_no_sirve(self):
        for falso in ('abc', 'x.y.z', self._sesion() + 'a'):
            self.assertEqual(self._preguntar(falso).status_code, 401)
        self.rag.assert_not_called()

    def test_con_sesion_valida_responde(self):
        respuesta = self._preguntar(self._sesion())
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json()['respuesta'], 'Respuesta de la IA')

    # ---- la prueba de trabajo -----------------------------------------------------------

    def test_una_solucion_incorrecta_no_da_sesion(self):
        desafio = _post(self.client, reverse('api-public-desafio')).json()['desafio']
        malas = [s for s in map(str, range(400))
                 if _ceros_iniciales(hashlib.sha256(f'{desafio}:{s}'.encode()).digest()) < BITS][:1]
        respuesta = _post(self.client, reverse('api-public-sesion'), {'desafio': desafio, 'solucion': malas[0]})
        self.assertEqual(respuesta.status_code, 400)

    def test_un_desafio_inventado_no_da_sesion(self):
        for desafio in ('', 'a.b.c', 'a.9999999999.firma'):
            respuesta = _post(self.client, reverse('api-public-sesion'), {'desafio': desafio, 'solucion': '1'})
            self.assertEqual(respuesta.status_code, 400)

    def test_un_desafio_resuelto_sirve_una_sola_vez(self):
        desafio = _post(self.client, reverse('api-public-desafio')).json()['desafio']
        cuerpo = {'desafio': desafio, 'solucion': resolver(desafio)}
        self.assertEqual(_post(self.client, reverse('api-public-sesion'), cuerpo).status_code, 200)
        self.assertEqual(_post(self.client, reverse('api-public-sesion'), cuerpo).status_code, 400)

    def test_un_desafio_vencido_no_sirve(self):
        desafio = _post(self.client, reverse('api-public-desafio')).json()['desafio']
        with mock.patch('chatbot.acceso_publico.time.time', return_value=10 ** 11):
            respuesta = _post(self.client, reverse('api-public-sesion'),
                              {'desafio': desafio, 'solucion': resolver(desafio)})
        self.assertEqual(respuesta.status_code, 400)

    def test_una_sesion_vencida_no_sirve(self):
        token = self._sesion()
        with override_settings(CHATBOT_PUBLICO_SESION_VIGENCIA=-1):
            self.assertEqual(self._preguntar(token).status_code, 401)

    # ---- límites ------------------------------------------------------------------------

    @override_settings(CHATBOT_PUBLICO_MAX_PREGUNTAS_SESION=2)
    def test_limite_de_preguntas_por_sesion(self):
        token = self._sesion()
        self.assertEqual(self._preguntar(token).status_code, 200)
        self.assertEqual(self._preguntar(token).status_code, 200)
        tercera = self._preguntar(token)
        self.assertEqual(tercera.status_code, 429)
        self.assertEqual(tercera.json()['codigo'], 'limite_sesion')
        self.assertEqual(self.rag.call_count, 2)

    @override_settings(CHATBOT_PUBLICO_TOPE_DIARIO=2)
    def test_tope_diario_global(self):
        self.assertEqual(self._preguntar(self._sesion()).status_code, 200)
        self.assertEqual(self._preguntar(self._sesion()).status_code, 200)
        tercera = self._preguntar(self._sesion())
        self.assertEqual(tercera.status_code, 503)
        self.assertEqual(tercera.json()['codigo'], 'tope_diario')
        self.assertEqual(self.rag.call_count, 2)

    @override_settings(CHATBOT_PUBLICO_PREGUNTAS_POR_IP_MINUTO=1)
    def test_limite_por_ip_y_minuto(self):
        self.assertEqual(self._preguntar(self._sesion()).status_code, 200)
        self.assertEqual(self._preguntar(self._sesion()).status_code, 429)

    @override_settings(CHATBOT_PUBLICO_SESIONES_POR_IP_MINUTO=2)
    def test_limite_de_sesiones_por_ip(self):
        self.assertEqual(_post(self.client, reverse('api-public-desafio')).status_code, 200)
        self.assertEqual(_post(self.client, reverse('api-public-desafio')).status_code, 200)
        self.assertEqual(_post(self.client, reverse('api-public-desafio')).status_code, 429)

    def test_los_limites_son_por_ip(self):
        with override_settings(CHATBOT_PUBLICO_PREGUNTAS_POR_IP_MINUTO=1):
            token = self._sesion()
            self.assertEqual(self._preguntar(token).status_code, 200)
            self.assertEqual(self._preguntar(token).status_code, 429)
            otra_ip = _post(self.client, reverse('api-public-pregunta'),
                            {'agente_id': self.agente.id, 'pregunta': 'Hola', 'seccional': 'barranquilla'},
                            HTTP_X_CHATBOT_TOKEN=token, HTTP_X_FORWARDED_FOR='203.0.113.9')
            self.assertEqual(otra_ip.status_code, 200)

    # ---- entrada ------------------------------------------------------------------------

    def test_pregunta_vacia_o_demasiado_larga(self):
        token = self._sesion()
        self.assertEqual(self._preguntar(token, pregunta='   ').status_code, 400)
        self.assertEqual(self._preguntar(token, pregunta='a' * 501).status_code, 400)
        self.assertEqual(self._preguntar(token, pregunta='a' * 500).status_code, 200)

    def test_la_pregunta_debe_ser_texto(self):
        self.assertEqual(self._preguntar(self._sesion(), pregunta={'x': 1}).status_code, 400)
        self.assertEqual(self._preguntar(self._sesion(), pregunta=['a']).status_code, 400)

    def test_un_error_interno_no_se_muestra_al_usuario(self):
        self.rag.side_effect = RuntimeError('clave secreta sk-123 en la base interna')
        respuesta = self._preguntar(self._sesion())
        self.assertEqual(respuesta.status_code, 500)
        self.assertNotIn('sk-123', respuesta.content.decode())

    def test_el_identificador_de_chat_debe_ser_un_uuid(self):
        respuesta = self._preguntar(self._sesion(), chat_id='no-es-un-uuid; drop table').json()
        self.assertRegex(respuesta['chat_id'], r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
        self.assertNotIn('drop', respuesta['chat_id'])

    def test_metodos_distintos_de_post_no_sirven(self):
        self.assertEqual(self.client.get(reverse('api-public-desafio')).status_code, 405)
        self.assertEqual(self.client.get(reverse('api-public-sesion')).status_code, 405)
