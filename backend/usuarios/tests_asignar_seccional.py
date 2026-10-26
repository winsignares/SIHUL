"""Asignar la seccional de un usuario desde Gestión de Usuarios.

El administrador global (superusuario) puede dejarla en cualquier seccional, con o sin sede. Quien administra una
seccional solo puede dejar usuarios en la suya. La seccional y la sede deben ser coherentes.
"""
import json

from django.test import TestCase

from sedes.models import Seccional, Sede

from .models import Rol, Usuario


class AsignarSeccionalTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.bq, _ = Seccional.objects.get_or_create(ciudad='Barranquilla')
        cls.bog, _ = Seccional.objects.get_or_create(ciudad='Bogota')
        cls.sede_bq = Sede.objects.create(nombre='Sede Centro Prueba', seccional=cls.bq)
        cls.sede_bog = Sede.objects.create(nombre='Sede Candelaria Prueba', seccional=cls.bog)
        rol_admin = Rol.objects.get_or_create(nombre='admin')[0]
        rol_adm = Rol.objects.get_or_create(nombre='personal_administrativo')[0]
        cls.global_ = Usuario.objects.create(
            nombre='Admin Global', correo='global@unilibre.edu.co', contrasena_hash='x', rol=rol_admin,
            es_superusuario=True)
        cls.admin_bq = Usuario.objects.create(
            nombre='Admin BQ', correo='admin.bq@unilibre.edu.co', contrasena_hash='x', rol=rol_admin,
            seccional=cls.bq)
        cls.adolfo = Usuario.objects.create(
            nombre='Adolfo Prueba', correo='adolfo@unilibre.edu.co', contrasena_hash='x', rol=rol_adm)
        cls.persona_bq = Usuario.objects.create(
            nombre='Persona BQ', correo='persona.bq@unilibre.edu.co', contrasena_hash='x', rol=rol_adm,
            seccional=cls.bq)

    def _entrar(self, usuario):
        sesion = self.client.session
        sesion['user_id'] = usuario.id
        sesion.save()

    def _patch(self, usuario, **datos):
        return self.client.patch(f'/api/usuarios/{usuario.id}/', json.dumps(datos), content_type='application/json')

    # ---- administrador global ----------------------------------------------------------

    def test_el_administrador_global_asigna_solo_la_seccional_sin_sede(self):
        self._entrar(self.global_)
        r = self._patch(self.adolfo, seccional=self.bq.id)
        self.assertEqual(r.status_code, 200, r.content)
        self.adolfo.refresh_from_db()
        self.assertEqual(self.adolfo.seccional_id, self.bq.id)
        self.assertIsNone(self.adolfo.sede_id)

    def test_el_administrador_global_puede_cambiarla_a_cualquier_seccional(self):
        self._entrar(self.global_)
        self.assertEqual(self._patch(self.persona_bq, seccional=self.bog.id).status_code, 200)
        self.persona_bq.refresh_from_db()
        self.assertEqual(self.persona_bq.seccional_id, self.bog.id)

    def test_quitar_la_sede_y_dejar_solo_la_seccional(self):
        self._entrar(self.global_)
        self.assertEqual(self._patch(self.adolfo, sede=self.sede_bq.id).status_code, 200)
        self.adolfo.refresh_from_db()
        self.assertEqual((self.adolfo.sede_id, self.adolfo.seccional_id), (self.sede_bq.id, self.bq.id))
        r = self._patch(self.adolfo, sede=None, seccional=self.bq.id)
        self.assertEqual(r.status_code, 200, r.content)
        self.adolfo.refresh_from_db()
        self.assertEqual((self.adolfo.sede_id, self.adolfo.seccional_id), (None, self.bq.id))

    def test_seccional_y_sede_deben_ser_coherentes(self):
        self._entrar(self.global_)
        r = self._patch(self.adolfo, sede=self.sede_bq.id, seccional=self.bog.id)
        self.assertEqual(r.status_code, 400)
        self.assertIn('seccional', r.json())

    # ---- administrador de una seccional ------------------------------------------------

    def test_quien_administra_una_seccional_solo_asigna_la_suya(self):
        self._entrar(self.admin_bq)
        self.assertEqual(self._patch(self.persona_bq, seccional=self.bq.id).status_code, 200)
        for datos in ({'seccional': self.bog.id}, {'sede': self.sede_bog.id}):
            r = self._patch(self.persona_bq, **datos)
            self.assertEqual(r.status_code, 400, datos)
            self.assertIn('Solo puedes asignar usuarios a tu propia seccional', json.dumps(r.json(), ensure_ascii=False))
        self.persona_bq.refresh_from_db()
        self.assertEqual(self.persona_bq.seccional_id, self.bq.id)

    def test_quien_administra_una_seccional_no_ve_a_usuarios_sin_seccional(self):
        self._entrar(self.admin_bq)
        self.assertEqual(self._patch(self.adolfo, seccional=self.bq.id).status_code, 404)

    # ---- sin permiso --------------------------------------------------------------------

    def test_sin_sesion_no_se_puede(self):
        self.assertIn(self._patch(self.adolfo, seccional=self.bq.id).status_code, (401, 403))
        self.adolfo.refresh_from_db()
        self.assertIsNone(self.adolfo.seccional_id)

    def test_un_usuario_sin_permisos_no_asigna_seccionales(self):
        self._entrar(self.persona_bq)
        r = self._patch(self.adolfo, seccional=self.bq.id)
        self.assertIn(r.status_code, (403, 404))
        self.adolfo.refresh_from_db()
        self.assertIsNone(self.adolfo.seccional_id)
