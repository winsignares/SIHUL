"""La sesión del usuario incluye su seccional, con o sin sede.

La pantalla de documentación de chatbots decide con esa seccional si la persona puede subir documentos. Antes la
sesión solo traía la sede: quien tenía seccional pero no sede (por ejemplo el personal de bibliotecas) veía
«tu usuario no tiene una seccional asignada» aunque el servidor sí la reconocía.
"""
import json

from django.contrib.auth.hashers import make_password
from django.test import TestCase
from django.urls import reverse

from sedes.models import Seccional, Sede

from .models import Rol, Usuario

CLAVE = 'Clave-sesion-1'


class SeccionalEnLaSesionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.bq, _ = Seccional.objects.get_or_create(ciudad='Barranquilla')
        cls.bog, _ = Seccional.objects.get_or_create(ciudad='Bogota')
        cls.sede_bog = Sede.objects.create(nombre='Sede Candelaria Prueba', seccional=cls.bog)
        rol = Rol.objects.get_or_create(nombre='personal_administrativo')[0]
        hash_ = make_password(CLAVE)

        def crear(correo, **extra):
            return Usuario.objects.create(nombre=correo, correo=correo, contrasena_hash=hash_, password=hash_, rol=rol, **extra)

        cls.solo_seccional = crear('solo.seccional@unilibre.edu.co', seccional=cls.bq)
        cls.solo_sede = crear('solo.sede@unilibre.edu.co', sede=cls.sede_bog)
        cls.ninguna = crear('ninguna@unilibre.edu.co')

    def _login(self, usuario):
        r = self.client.post(reverse('login_usuario'), json.dumps({'correo': usuario.correo, 'contrasena': CLAVE}),
                             content_type='application/json')
        self.assertEqual(r.status_code, 200, r.content)
        return r.json()

    def test_con_seccional_y_sin_sede_la_sesion_trae_la_seccional(self):
        datos = self._login(self.solo_seccional)
        self.assertIsNone(datos['sede'])
        self.assertEqual(datos['seccional'], {'id': self.bq.id, 'ciudad': 'Barranquilla'})

    def test_con_sede_la_seccional_sale_de_la_sede(self):
        datos = self._login(self.solo_sede)
        self.assertEqual(datos['sede']['seccional_ciudad'], 'Bogota')
        self.assertEqual(datos['seccional'], {'id': self.bog.id, 'ciudad': 'Bogota'})

    def test_sin_sede_ni_seccional_la_sesion_dice_que_no_tiene(self):
        datos = self._login(self.ninguna)
        self.assertIsNone(datos['sede'])
        self.assertIsNone(datos['seccional'])

    def test_la_sesion_ya_iniciada_tambien_la_trae(self):
        # /auth/user/ atiende sesiones iniciadas con Microsoft (login de Django), no el login con clave
        self.client.force_login(self.solo_seccional)
        r = self.client.get(reverse('auth_user'))
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()['seccional'], {'id': self.bq.id, 'ciudad': 'Barranquilla'})

    def test_la_seccional_propia_manda_sobre_la_de_la_sede(self):
        # Si por datos antiguos hubiera las dos distintas, el servidor ya usa la propia primero (ver
        # chatbot.views._resolve_user_sede_value): la sesión debe decir lo mismo.
        Usuario.objects.filter(pk=self.solo_sede.pk).update(seccional=self.bq)
        datos = self._login(self.solo_sede)
        self.assertEqual(datos['seccional']['ciudad'], 'Barranquilla')
