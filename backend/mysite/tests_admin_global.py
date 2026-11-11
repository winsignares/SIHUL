"""Alcance por seccional del administrador general.

El superusuario y el rol `admin_global` ven y gestionan los datos de todas las seccionales; quien administra una
seccional solo ve la suya.
"""
import datetime

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from espacios.models import EspacioFisico, TipoEspacio
from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario


def _ids(respuesta):
    datos = respuesta.json()
    if isinstance(datos, dict):
        datos = datos.get('results', datos.get('espacios', datos))
    return sorted(item['id'] for item in datos)


class AlcanceAdminGlobalTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.bq = Seccional.objects.create(ciudad='Barranquilla')
        cls.cali = Seccional.objects.create(ciudad='Cali')
        cls.sede_bq = Sede.objects.create(nombre='Sede BQ', seccional=cls.bq)
        cls.sede_cali = Sede.objects.create(nombre='Sede Cali', seccional=cls.cali)
        tipo = TipoEspacio.objects.create(nombre='Aula')
        cls.aula_bq = EspacioFisico.objects.create(sede=cls.sede_bq, tipo=tipo, nombre='Aula BQ', capacidad=30)
        cls.aula_cali = EspacioFisico.objects.create(sede=cls.sede_cali, tipo=tipo, nombre='Aula Cali', capacidad=30)

        def usuario(nombre, rol_nombre, sede=None, **extra):
            rol = Rol.objects.get_or_create(nombre=rol_nombre)[0]
            return Usuario.objects.create_user(
                correo=f'{nombre}@prueba.test', nombre=nombre, rol=rol, sede=sede, **extra)

        cls.superusuario = usuario('super', 'admin', es_superusuario=True)
        cls.global_bq = usuario('global_bq', 'admin_global', cls.sede_bq)
        cls.global_sin_sede = usuario('global_sin_sede', 'admin_global')
        cls.admin_bq = usuario('admin_bq', 'admin', cls.sede_bq)
        cls.docente_cali = usuario('docente_cali', 'docente', cls.sede_cali)

    def setUp(self):
        cache.clear()

    def cliente(self, usuario):
        client = APIClient(HTTP_HOST='localhost')
        session = client.session
        session['user_id'] = usuario.id
        session.save()
        return client

    def ids_de(self, usuario, ruta):
        respuesta = self.cliente(usuario).get(ruta)
        self.assertEqual(respuesta.status_code, 200, (ruta, respuesta.content[:300]))
        return _ids(respuesta)

    # ------------------------------------------------------------------ sin cambios
    def test_el_superusuario_ve_todas_las_seccionales(self):
        self.assertEqual(self.ids_de(self.superusuario, '/api/espacios/'), [self.aula_bq.id, self.aula_cali.id])
        self.assertEqual(self.ids_de(self.superusuario, '/api/sedes/'), [self.sede_bq.id, self.sede_cali.id])
        self.assertEqual(self.ids_de(self.superusuario, '/api/seccionales/'), [self.bq.id, self.cali.id])

    def test_el_administrador_de_seccional_solo_ve_la_suya(self):
        self.assertEqual(self.ids_de(self.admin_bq, '/api/espacios/'), [self.aula_bq.id])
        self.assertEqual(self.ids_de(self.admin_bq, '/api/sedes/'), [self.sede_bq.id])
        self.assertEqual(self.ids_de(self.admin_bq, '/api/seccionales/'), [self.bq.id])
        usuarios = self.ids_de(self.admin_bq, '/api/usuarios/')
        self.assertIn(self.admin_bq.id, usuarios)
        self.assertNotIn(self.docente_cali.id, usuarios)
        espacios = self.ids_de(self.admin_bq, '/api/espacios/horarios/all/')
        self.assertEqual(espacios, [self.aula_bq.id])

    def test_el_administrador_de_seccional_no_lleva_usuarios_a_otra_seccional(self):
        r = self.cliente(self.admin_bq).patch(
            f'/api/usuarios/{self.admin_bq.id}/', {'sede': self.sede_cali.id}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Usuario.objects.get(pk=self.admin_bq.pk).sede_id, self.sede_bq.id)

    # ------------------------------------------------------------------ admin_global
    def test_admin_global_ve_todas_las_seccionales(self):
        for usuario in (self.global_bq, self.global_sin_sede):
            with self.subTest(usuario=usuario.nombre):
                self.assertEqual(self.ids_de(usuario, '/api/espacios/'), [self.aula_bq.id, self.aula_cali.id])
                self.assertEqual(self.ids_de(usuario, '/api/sedes/'), [self.sede_bq.id, self.sede_cali.id])
                self.assertEqual(self.ids_de(usuario, '/api/seccionales/'), [self.bq.id, self.cali.id])
                self.assertIn(self.docente_cali.id, self.ids_de(usuario, '/api/usuarios/'))
                self.assertEqual(
                    self.ids_de(usuario, '/api/espacios/horarios/all/'), [self.aula_bq.id, self.aula_cali.id])

    def test_admin_global_ve_los_espacios_disponibles_de_todas_las_seccionales(self):
        manana = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
        r = self.cliente(self.global_bq).get(
            f'/api/prestamos/public/espacios-disponibles/?fecha={manana}&hora_inicio=08:00&hora_fin=09:00')
        self.assertEqual(r.status_code, 200, r.content[:300])
        self.assertEqual(sorted(e['id'] for e in r.json()['espacios']), [self.aula_bq.id, self.aula_cali.id])

    def test_admin_global_lleva_usuarios_a_otra_seccional(self):
        r = self.cliente(self.global_bq).patch(
            f'/api/usuarios/{self.docente_cali.id}/', {'sede': self.sede_bq.id}, format='json')
        self.assertEqual(r.status_code, 200, r.content[:300])
        self.assertEqual(Usuario.objects.get(pk=self.docente_cali.pk).sede_id, self.sede_bq.id)

    def test_la_cache_de_catalogos_no_mezcla_alcances(self):
        # Lo que ve el administrador general no se le entrega luego a quien administra una seccional
        self.assertEqual(self.ids_de(self.global_bq, '/api/sedes/'), [self.sede_bq.id, self.sede_cali.id])
        self.assertEqual(self.ids_de(self.admin_bq, '/api/sedes/'), [self.sede_bq.id])
        self.assertEqual(self.ids_de(self.global_bq, '/api/sedes/'), [self.sede_bq.id, self.sede_cali.id])
