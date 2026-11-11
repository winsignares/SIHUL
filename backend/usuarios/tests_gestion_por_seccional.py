"""Gestión de Usuarios para quien no es administrador.

Con EDITAR en «Gestión de Usuarios» se gestiona a las personas de la propia seccional, sin roles de administración
ni cuentas de administradores, y sin cambiar el propio rol, estado ni seccional. Con VER se consulta la lista de la
propia seccional. Sin el componente, cada quien ve solo su registro.
"""
from django.test import TestCase
from rest_framework.test import APIClient

from componentes.models import Componente, ComponenteRol
from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario


class GestionPorSeccionalTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.bq = Seccional.objects.create(ciudad='Barranquilla')
        cls.cali = Seccional.objects.create(ciudad='Cali')
        cls.sede_bq = Sede.objects.create(nombre='Sede BQ', seccional=cls.bq)
        cls.sede_bq2 = Sede.objects.create(nombre='Sede BQ 2', seccional=cls.bq)
        cls.sede_cali = Sede.objects.create(nombre='Sede Cali', seccional=cls.cali)

        componente = Componente.objects.create(nombre='Gestión de Usuarios')

        def rol(nombre, permiso=None):
            r = Rol.objects.get_or_create(nombre=nombre)[0]
            if permiso:
                ComponenteRol.objects.create(rol=r, componente=componente, permiso=permiso)
            return r

        cls.rol_admin = rol('admin', 'EDITAR')
        cls.rol_global = rol('admin_global')
        cls.rol_financiero = rol('Admin Financiero')
        cls.rol_docente = rol('docente')
        cls.rol_gestor = rol('gestor_usuarios', 'EDITAR')
        cls.rol_consulta = rol('consulta_usuarios', 'VER')

        def usuario(nombre, r, sede):
            return Usuario.objects.create_user(correo=f'{nombre}@prueba.test', nombre=nombre, rol=r, sede=sede)

        cls.admin_bq = usuario('admin_bq', cls.rol_admin, cls.sede_bq)
        cls.gestor_bq = usuario('gestor_bq', cls.rol_gestor, cls.sede_bq)
        cls.consulta_bq = usuario('consulta_bq', cls.rol_consulta, cls.sede_bq)
        cls.docente_bq = usuario('docente_bq', cls.rol_docente, cls.sede_bq)
        cls.docente_cali = usuario('docente_cali', cls.rol_docente, cls.sede_cali)
        cls.financiero_bq = usuario('financiero_bq', cls.rol_financiero, cls.sede_bq)

    def cliente(self, usuario):
        client = APIClient(HTTP_HOST='localhost')
        session = client.session
        session['user_id'] = usuario.id
        session.save()
        return client

    def ids(self, usuario):
        r = self.cliente(usuario).get('/api/usuarios/')
        self.assertEqual(r.status_code, 200, r.content[:300])
        return {u['id'] for u in r.json()}

    def crear(self, usuario, **datos):
        datos = {'nombre': 'Nuevo', 'correo': 'nuevo@prueba.test', 'contrasena': 'Clave.Segura.2026',
                 'rol': self.rol_docente.id, 'sede': self.sede_bq.id, **datos}
        return self.cliente(usuario).post('/api/usuarios/', datos, format='json')

    # ------------------------------------------------------------------ sin cambios
    def test_sin_el_componente_solo_ve_su_registro(self):
        self.assertEqual(self.ids(self.docente_bq), {self.docente_bq.id})

    def test_el_administrador_de_seccional_gestiona_la_suya_y_asigna_administradores(self):
        visibles = self.ids(self.admin_bq)
        self.assertIn(self.docente_bq.id, visibles)
        self.assertNotIn(self.docente_cali.id, visibles)
        r = self.cliente(self.admin_bq).patch(
            f'/api/usuarios/{self.docente_bq.id}/', {'rol': self.rol_admin.id}, format='json')
        self.assertEqual(r.status_code, 200, r.content[:300])

    def test_con_editar_crea_personas_de_su_seccional_y_no_de_otra(self):
        self.assertEqual(self.crear(self.gestor_bq).status_code, 201)
        r = self.crear(self.gestor_bq, correo='otro@prueba.test', sede=self.sede_cali.id)
        self.assertEqual(r.status_code, 400)
        self.assertFalse(Usuario.objects.filter(correo='otro@prueba.test').exists())

    def test_con_ver_no_modifica_a_nadie(self):
        r = self.cliente(self.consulta_bq).patch(
            f'/api/usuarios/{self.docente_bq.id}/', {'nombre': 'Cambio'}, format='json')
        self.assertEqual(r.status_code, 403)
        self.assertEqual(self.crear(self.consulta_bq).status_code, 403)

    # ------------------------------------------------------------------ EDITAR: su seccional
    def test_con_editar_ve_y_edita_a_las_personas_de_su_seccional(self):
        visibles = self.ids(self.gestor_bq)
        self.assertTrue({self.gestor_bq.id, self.docente_bq.id, self.admin_bq.id} <= visibles)
        self.assertNotIn(self.docente_cali.id, visibles)
        c = self.cliente(self.gestor_bq)
        r = c.patch(f'/api/usuarios/{self.docente_bq.id}/', {'nombre': 'Docente Editado', 'activo': False}, format='json')
        self.assertEqual(r.status_code, 200, r.content[:300])
        self.docente_bq.refresh_from_db()
        self.assertEqual((self.docente_bq.nombre, self.docente_bq.activo), ('Docente Editado', False))
        self.assertEqual(c.patch(f'/api/usuarios/{self.docente_cali.id}/', {'nombre': 'X'}, format='json').status_code, 404)

    def test_con_editar_no_asigna_roles_de_administracion(self):
        for r in (self.rol_admin, self.rol_global, self.rol_financiero):
            with self.subTest(rol=r.nombre):
                self.assertEqual(self.crear(self.gestor_bq, correo=f'n{r.id}@prueba.test', rol=r.id).status_code, 400)
                respuesta = self.cliente(self.gestor_bq).patch(
                    f'/api/usuarios/{self.docente_bq.id}/', {'rol': r.id}, format='json')
                self.assertEqual(respuesta.status_code, 400)
        r = self.crear(self.gestor_bq, correo='super@prueba.test', es_superusuario=True)
        self.assertEqual(r.status_code, 400)
        self.docente_bq.refresh_from_db()
        self.assertEqual(self.docente_bq.rol_id, self.rol_docente.id)

    def test_con_editar_no_modifica_cuentas_de_administracion(self):
        c = self.cliente(self.gestor_bq)
        for objetivo in (self.admin_bq, self.financiero_bq):
            with self.subTest(objetivo=objetivo.nombre):
                self.assertEqual(c.patch(f'/api/usuarios/{objetivo.id}/', {'nombre': 'X'}, format='json').status_code, 403)
                self.assertEqual(c.delete(f'/api/usuarios/{objetivo.id}/').status_code, 403)
                self.assertTrue(Usuario.objects.filter(pk=objetivo.pk, nombre=objetivo.nombre).exists())

    def test_con_editar_no_cambia_su_propio_rol_estado_ni_seccional(self):
        c = self.cliente(self.gestor_bq)
        url = f'/api/usuarios/{self.gestor_bq.id}/'
        for cambio in ({'rol': self.rol_docente.id}, {'activo': False}, {'sede': self.sede_bq2.id}):
            with self.subTest(cambio=cambio):
                self.assertEqual(c.patch(url, cambio, format='json').status_code, 400)
        self.assertEqual(c.delete(url).status_code, 403)
        # Su nombre sí, aunque el formulario envíe también los datos que no cambian
        r = c.patch(url, {'nombre': 'Gestor Nuevo', 'rol': self.rol_gestor.id, 'activo': True, 'sede': self.sede_bq.id},
                    format='json')
        self.assertEqual(r.status_code, 200, r.content[:300])
        self.gestor_bq.refresh_from_db()
        self.assertEqual((self.gestor_bq.nombre, self.gestor_bq.rol_id, self.gestor_bq.activo),
                         ('Gestor Nuevo', self.rol_gestor.id, True))

    # ------------------------------------------------------------------ VER: consulta su seccional
    def test_con_ver_consulta_la_lista_de_su_seccional(self):
        visibles = self.ids(self.consulta_bq)
        self.assertTrue({self.consulta_bq.id, self.docente_bq.id} <= visibles)
        self.assertNotIn(self.docente_cali.id, visibles)
        r = self.cliente(self.consulta_bq).get(f'/api/usuarios/{self.docente_bq.id}/')
        self.assertEqual(r.status_code, 200)
