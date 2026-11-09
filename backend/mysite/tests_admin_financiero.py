"""El administrador financiero NO es superusuario: gestiona al equipo financiero, el SLA y los proveedores,
pero no los usuarios académicos, ni los roles, ni el catálogo de componentes."""
from django.test import TestCase
from rest_framework.test import APIClient

from componentes.models import Componente, ComponenteRol, ComponenteUsuario
from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario


def _cliente(usuario):
    c = APIClient()
    c.force_authenticate(user=usuario)
    return c


class AdminFinancieroSinSuperusuarioTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.bq = Seccional.objects.create(ciudad='Barranquilla')
        cls.cali = Seccional.objects.create(ciudad='Cali')
        cls.sede_bq = Sede.objects.create(nombre='Sede BQ', seccional=cls.bq)
        cls.sede_cali = Sede.objects.create(nombre='Sede Cali', seccional=cls.cali)

        def rol(nombre):
            return Rol.objects.get_or_create(nombre=nombre)[0]

        def usuario(nombre, rol_nombre, sede=None, **extra):
            return Usuario.objects.create_user(
                correo=f'{nombre}@prueba.test', nombre=nombre, rol=rol(rol_nombre), sede=sede, **extra)

        cls.rol = rol
        cls.general = usuario('general', 'admin', es_superusuario=True)
        cls.admin_bq = usuario('admin_bq', 'admin', cls.sede_bq)
        # Dos administradores financieros: uno sin seccional (como en producción) y otro con la de Barranquilla
        cls.fin = usuario('fin', 'Admin Financiero')
        cls.fin_bq = usuario('fin_bq', 'Admin Financiero', cls.sede_bq)
        cls.contador_cali = usuario('contador_cali', 'Contabilidad', cls.sede_cali)
        cls.tesorero_bq = usuario('tesorero_bq', 'Tesorería', cls.sede_bq)
        cls.docente_bq = usuario('docente_bq', 'docente', cls.sede_bq)
        cls.docente_cali = usuario('docente_cali', 'docente', cls.sede_cali)
        cls.componente_fin = Componente.objects.create(nombre='Parametrización SLA')
        cls.componente_acad = Componente.objects.create(nombre='Centro de Horarios')

    def test_no_es_superusuario(self):
        for admin in (self.fin, self.fin_bq):
            self.assertFalse(admin.es_superusuario)
            self.assertFalse(admin.is_superuser)

    def test_ve_al_equipo_financiero_de_todas_las_seccionales_y_a_nadie_mas(self):
        for admin in (self.fin, self.fin_bq):
            r = _cliente(admin).get('/api/usuarios/?financiero=1')
            self.assertEqual(r.status_code, 200)
            ids = {u['id'] for u in r.json()}
            self.assertIn(self.contador_cali.id, ids)  # financiero de otra seccional
            self.assertIn(self.tesorero_bq.id, ids)
            self.assertNotIn(self.docente_bq.id, ids)
            self.assertNotIn(self.docente_cali.id, ids)
            self.assertNotIn(self.general.id, ids)

    def test_sin_el_filtro_tampoco_ve_usuarios_academicos(self):
        r = _cliente(self.fin_bq).get('/api/usuarios/')
        self.assertEqual(r.status_code, 200)
        ids = {u['id'] for u in r.json()}
        self.assertNotIn(self.docente_bq.id, ids)
        self.assertNotIn(self.admin_bq.id, ids)

    def test_no_toca_usuarios_academicos(self):
        for admin in (self.fin, self.fin_bq):
            c = _cliente(admin)
            for objetivo in (self.docente_bq, self.docente_cali, self.admin_bq, self.general):
                self.assertEqual(c.get(f'/api/usuarios/{objetivo.id}/').status_code, 404)
                self.assertEqual(c.patch(f'/api/usuarios/{objetivo.id}/', {'nombre': 'x'}, format='json').status_code, 404)
                self.assertEqual(c.delete(f'/api/usuarios/{objetivo.id}/').status_code, 404)
        self.docente_bq.refresh_from_db()
        self.assertEqual(self.docente_bq.nombre, 'docente_bq')

    def test_crea_edita_y_elimina_usuarios_financieros_de_cualquier_seccional(self):
        c = _cliente(self.fin_bq)
        datos = {
            'nombre': 'Nueva', 'correo': 'nueva@prueba.test', 'contrasena': 'Clave-segura-123',
            'rol': self.rol('Contabilidad').id, 'sede': self.sede_cali.id,
        }
        r = c.post('/api/usuarios/', datos, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        nuevo = r.json()['id']
        self.assertEqual(c.patch(f'/api/usuarios/{nuevo}/', {'nombre': 'Nueva Cuenta'}, format='json').status_code, 200)
        self.assertEqual(c.delete(f'/api/usuarios/{nuevo}/').status_code, 204)

    def test_no_crea_usuarios_con_roles_no_financieros(self):
        for admin in (self.fin, self.fin_bq):
            c = _cliente(admin)
            for nombre in ('docente', 'admin', 'admin_global', 'biblioteca'):
                datos = {
                    'nombre': 'X', 'correo': f'x-{nombre}@prueba.test', 'contrasena': 'Clave-segura-123',
                    'rol': self.rol(nombre).id,
                }
                self.assertEqual(c.post('/api/usuarios/', datos, format='json').status_code, 400, nombre)
            sin_rol = {'nombre': 'X', 'correo': 'sin-rol@prueba.test', 'contrasena': 'Clave-segura-123'}
            self.assertEqual(c.post('/api/usuarios/', sin_rol, format='json').status_code, 400)
        self.assertFalse(Usuario.objects.filter(correo__startswith='x-').exists())

    def test_no_convierte_a_un_financiero_en_otro_rol_ni_en_superusuario(self):
        c = _cliente(self.fin_bq)
        r = c.patch(f'/api/usuarios/{self.tesorero_bq.id}/', {'rol': self.rol('admin').id}, format='json')
        self.assertEqual(r.status_code, 400)
        r = c.patch(f'/api/usuarios/{self.tesorero_bq.id}/', {'es_superusuario': True}, format='json')
        self.assertEqual(r.status_code, 400)
        self.tesorero_bq.refresh_from_db()
        self.assertEqual(self.tesorero_bq.rol.nombre, 'Tesorería')
        self.assertFalse(self.tesorero_bq.es_superusuario)

    def test_no_administra_roles_ni_el_catalogo_de_componentes(self):
        for admin in (self.fin, self.fin_bq):
            c = _cliente(admin)
            self.assertEqual(c.post('/api/roles/', {'nombre': 'nuevo'}, format='json').status_code, 403)
            self.assertEqual(c.delete(f'/api/roles/{self.rol("docente").id}/').status_code, 403)
            self.assertEqual(c.post('/api/componentes/', {'nombre': 'Otro'}, format='json').status_code, 403)
            self.assertEqual(c.delete(f'/api/componentes/{self.componente_fin.id}/').status_code, 403)
            datos = {'componente': self.componente_fin.id, 'rol': self.rol('Contabilidad').id, 'permiso': 'EDITAR'}
            self.assertEqual(c.post('/api/componentes/roles/', datos, format='json').status_code, 403)
        self.assertTrue(Rol.objects.filter(nombre='docente').exists())
        self.assertFalse(Componente.objects.filter(nombre='Otro').exists())

    def test_puede_lee_los_roles_y_componentes_para_su_pantalla(self):
        c = _cliente(self.fin)
        self.assertEqual(c.get('/api/roles/').status_code, 200)
        self.assertEqual(c.get('/api/componentes/?financiero=1').status_code, 200)
        self.assertEqual(c.get('/api/componentes/roles/?financiero=1').status_code, 200)
        self.assertEqual(c.get('/api/componentes/usuarios/?financiero=1').status_code, 200)

    def test_da_componentes_financieros_solo_a_personas_financieras(self):
        c = _cliente(self.fin)
        ok = c.post('/api/componentes/usuarios/', {
            'usuario': self.contador_cali.id, 'componente': self.componente_fin.id, 'permiso': 'VER', 'activo': True,
        }, format='json')
        self.assertEqual(ok.status_code, 201, ok.content)
        otro = c.post('/api/componentes/usuarios/', {
            'usuario': self.docente_bq.id, 'componente': self.componente_fin.id, 'permiso': 'VER', 'activo': True,
        }, format='json')
        self.assertEqual(otro.status_code, 403)
        self.assertFalse(ComponenteUsuario.objects.filter(usuario=self.docente_bq).exists())

    def test_el_modulo_financiero_sigue_abierto_para_el(self):
        for admin in (self.fin, self.fin_bq):
            self.assertEqual(_cliente(admin).get('/api/financiero/parametros-sla/').status_code, 200)

    def test_el_administrador_general_no_cambia(self):
        c = _cliente(self.general)
        ids = {u['id'] for u in c.get('/api/usuarios/').json()}
        self.assertIn(self.docente_cali.id, ids)
        self.assertIn(self.contador_cali.id, ids)
