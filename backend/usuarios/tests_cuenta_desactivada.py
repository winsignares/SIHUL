"""Una cuenta desactivada no puede iniciar sesión y pierde la sesión que tuviera abierta."""
import json

from django.contrib.auth.hashers import make_password
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse

from mysite.auth_helpers import CUENTA_DESACTIVADA
from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario

CLAVE = 'Clave-test-1'
LOGIN_API = '/api/usuarios/login/'


class CuentaDesactivadaTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        seccional = Seccional.objects.create(ciudad='Barranquilla')
        sede = Sede.objects.create(nombre='Sede BQ', seccional=seccional)
        rol = Rol.objects.get_or_create(nombre='admin')[0]
        cls.usuario = Usuario.objects.create_user(correo='admin.bq@prueba.test', nombre='Admin BQ', rol=rol, sede=sede)
        clave = make_password(CLAVE)
        Usuario.objects.filter(pk=cls.usuario.pk).update(contrasena_hash=clave, password=clave)

    def setUp(self):
        cache.clear()

    def _desactivar(self):
        usuario = Usuario.objects.get(pk=self.usuario.pk)
        usuario.activo = False
        usuario.save()

    def _entrar(self, url, contrasena=CLAVE):
        return self.client.post(url, json.dumps({'correo': self.usuario.correo, 'contrasena': contrasena}),
                                content_type='application/json')

    def test_la_cuenta_activa_inicia_sesion(self):
        for url in (reverse('login_usuario'), LOGIN_API):
            self.client.logout()
            self.assertEqual(self._entrar(url).status_code, 200)
            self.assertEqual(self.client.session.get('user_id'), self.usuario.pk)

    def test_la_cuenta_desactivada_no_inicia_sesion(self):
        self._desactivar()
        for url in (reverse('login_usuario'), LOGIN_API):
            respuesta = self._entrar(url)
            self.assertEqual(respuesta.status_code, 403)
            self.assertEqual(respuesta.json()['error'], CUENTA_DESACTIVADA)
            self.assertIsNone(self.client.session.get('user_id'))

    def test_con_clave_incorrecta_no_revela_que_esta_desactivada(self):
        self._desactivar()
        respuesta = self._entrar(reverse('login_usuario'), contrasena='otra-clave')
        self.assertEqual(respuesta.status_code, 401)
        self.assertNotIn('desactivada', respuesta.json()['error'])

    def test_al_desactivarla_pierde_la_sesion_abierta(self):
        self.assertEqual(self._entrar(reverse('login_usuario')).status_code, 200)
        self.assertEqual(self.client.get(reverse('session_auth_state')).status_code, 200)
        self.assertEqual(self.client.get('/api/espacios/').status_code, 200)

        self._desactivar()

        self.assertEqual(self.client.get(reverse('session_auth_state')).status_code, 401)
        self.assertIn(self.client.get('/api/espacios/').status_code, (401, 403))
        self.assertIsNone(self.client.session.get('user_id'))
