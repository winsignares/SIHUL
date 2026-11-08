"""Aislamiento entre seccionales: roles, componentes, permisos de personas y chatbots.

Los roles y componentes son compartidos por todas las seccionales, así que solo el administrador general
los administra. Quien administra una seccional solo toca a las personas y los chatbots de la suya.
"""
from django.test import TestCase
from rest_framework.test import APIClient

from chatbot.models import Agente
from componentes.models import Componente, ComponenteRol, ComponenteUsuario
from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario


def _cliente(usuario):
    c = APIClient()
    c.force_authenticate(user=usuario)
    return c


def _agente(nombre, seccionales=()):
    agente = Agente.objects.create(
        nombre=nombre, descripcion='d', endpoint_url='http://rag.local/x', mensaje_bienvenida='hola')
    agente.seccionales.set(seccionales)
    return agente


class AislamientoBase(TestCase):
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

        cls.general = usuario('general', 'admin', es_superusuario=True)
        cls.admin_bq = usuario('admin_bq', 'admin', cls.sede_bq)
        cls.admin_cali = usuario('admin_cali', 'admin', cls.sede_cali)
        cls.docente_bq = usuario('docente_bq', 'docente', cls.sede_bq)
        cls.docente_cali = usuario('docente_cali', 'docente', cls.sede_cali)
        cls.admin_fin = usuario('admin_fin', 'Admin Financiero')
        cls.contador = usuario('contador', 'Contabilidad')

        # Un rol con permiso EDITAR en Gestión de Roles / Chatbots (asignable desde la pantalla de roles)
        cls.rol_gestor = rol('gestor_de_roles')
        for nombre in ('Gestión de Roles', 'Gestión de Chatbots'):
            componente = Componente.objects.create(nombre=nombre)
            ComponenteRol.objects.create(rol=cls.rol_gestor, componente=componente, permiso='EDITAR')
        cls.gestor_bq = Usuario.objects.create_user(
            correo='gestor_bq@prueba.test', nombre='gestor_bq', rol=cls.rol_gestor, sede=cls.sede_bq)

        cls.componente = Componente.objects.create(nombre='Centro de Horarios')
        cls.rol_docente = rol('docente')


class RolesYComponentesTests(AislamientoBase):
    def test_todos_siguen_leyendo_roles_y_componentes(self):
        for usuario in (self.admin_bq, self.docente_bq, self.general):
            c = _cliente(usuario)
            self.assertEqual(c.get('/api/roles/').status_code, 200)
            self.assertEqual(c.get('/api/componentes/').status_code, 200)
            self.assertEqual(c.get('/api/componentes/roles/').status_code, 200)

    def test_el_administrador_de_seccional_no_cambia_roles(self):
        c = _cliente(self.admin_bq)
        self.assertEqual(c.post('/api/roles/', {'nombre': 'nuevo'}, format='json').status_code, 403)
        self.assertEqual(c.patch(f'/api/roles/{self.rol_docente.id}/', {'descripcion': 'x'}, format='json').status_code, 403)
        self.assertEqual(c.delete(f'/api/roles/{self.rol_docente.id}/').status_code, 403)
        self.assertTrue(Rol.objects.filter(pk=self.rol_docente.pk).exists())
        self.assertFalse(Rol.objects.filter(nombre='nuevo').exists())

    def test_el_administrador_de_seccional_no_cambia_componentes_de_un_rol(self):
        c = _cliente(self.admin_bq)
        datos = {'componente': self.componente.id, 'rol': self.rol_docente.id, 'permiso': 'EDITAR'}
        self.assertEqual(c.post('/api/componentes/roles/', datos, format='json').status_code, 403)
        existente = ComponenteRol.objects.create(componente=self.componente, rol=self.rol_docente, permiso='VER')
        self.assertEqual(c.patch(f'/api/componentes/roles/{existente.id}/', {'permiso': 'EDITAR'}, format='json').status_code, 403)
        self.assertEqual(c.delete(f'/api/componentes/roles/{existente.id}/').status_code, 403)
        existente.refresh_from_db()
        self.assertEqual(existente.permiso, 'VER')

    def test_el_administrador_de_seccional_no_crea_ni_borra_componentes(self):
        c = _cliente(self.admin_bq)
        self.assertEqual(c.post('/api/componentes/', {'nombre': 'Nuevo'}, format='json').status_code, 403)
        self.assertEqual(c.delete(f'/api/componentes/{self.componente.id}/').status_code, 403)
        self.assertTrue(Componente.objects.filter(pk=self.componente.pk).exists())

    def test_un_rol_con_gestion_de_roles_tampoco_los_cambia(self):
        c = _cliente(self.gestor_bq)
        self.assertEqual(c.post('/api/roles/', {'nombre': 'otro'}, format='json').status_code, 403)
        datos = {'componente': self.componente.id, 'rol': self.rol_docente.id, 'permiso': 'EDITAR'}
        self.assertEqual(c.post('/api/componentes/roles/', datos, format='json').status_code, 403)

    def test_los_demas_roles_tampoco(self):
        for usuario in (self.docente_bq, self.admin_fin, self.contador):
            c = _cliente(usuario)
            self.assertEqual(c.post('/api/roles/', {'nombre': 'x'}, format='json').status_code, 403, usuario.nombre)
            self.assertEqual(c.post('/api/componentes/', {'nombre': 'x'}, format='json').status_code, 403, usuario.nombre)

    def test_el_administrador_general_si_los_administra(self):
        c = _cliente(self.general)
        r = c.post('/api/roles/', {'nombre': 'rol_nuevo'}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        datos = {'componente': self.componente.id, 'rol': r.json()['id'], 'permiso': 'VER'}
        r2 = c.post('/api/componentes/roles/', datos, format='json')
        self.assertEqual(r2.status_code, 201, r2.content)
        self.assertEqual(c.patch(f"/api/componentes/roles/{r2.json()['id']}/", {'permiso': 'EDITAR'}, format='json').status_code, 200)
        self.assertEqual(c.delete(f"/api/componentes/roles/{r2.json()['id']}/").status_code, 204)
        self.assertEqual(c.delete(f"/api/roles/{r.json()['id']}/").status_code, 204)


class ComponentesPorPersonaTests(AislamientoBase):
    def _dar(self, cliente, usuario):
        return cliente.post(
            '/api/componentes/usuarios/', {'componente': self.componente.id, 'usuario': usuario.id, 'permiso': 'VER'}, format='json')

    def test_el_administrador_de_seccional_da_componentes_a_su_gente(self):
        self.assertEqual(self._dar(_cliente(self.admin_bq), self.docente_bq).status_code, 201)

    def test_no_da_componentes_a_gente_de_otra_seccional(self):
        self.assertEqual(self._dar(_cliente(self.admin_bq), self.docente_cali).status_code, 403)
        self.assertFalse(ComponenteUsuario.objects.filter(usuario=self.docente_cali).exists())

    def test_no_ve_ni_toca_los_permisos_de_otra_seccional(self):
        ajeno = ComponenteUsuario.objects.create(componente=self.componente, usuario=self.docente_cali, permiso='VER')
        c = _cliente(self.admin_bq)
        ids = [x['id'] for x in c.get('/api/componentes/usuarios/').json()]
        self.assertNotIn(ajeno.id, ids)
        self.assertEqual(c.patch(f'/api/componentes/usuarios/{ajeno.id}/', {'permiso': 'EDITAR'}, format='json').status_code, 404)
        self.assertEqual(c.delete(f'/api/componentes/usuarios/{ajeno.id}/').status_code, 404)

    def test_no_cambia_los_permisos_del_administrador_general(self):
        general_en_bq = Usuario.objects.create_user(
            correo='general_bq@prueba.test', nombre='g', rol=self.general.rol, sede=self.sede_bq, es_superusuario=True)
        self.assertEqual(self._dar(_cliente(self.admin_bq), general_en_bq).status_code, 403)

    def test_el_administrador_general_da_a_cualquiera(self):
        c = _cliente(self.general)
        self.assertEqual(self._dar(c, self.docente_cali).status_code, 201)
        self.assertEqual(self._dar(c, self.docente_bq).status_code, 201)

    def test_el_administrador_financiero_solo_a_personas_con_rol_financiero(self):
        c = _cliente(self.admin_fin)
        self.assertEqual(self._dar(c, self.contador).status_code, 201)
        self.assertEqual(self._dar(c, self.docente_bq).status_code, 403)

    def test_un_docente_no_asigna_componentes(self):
        self.assertEqual(self._dar(_cliente(self.docente_bq), self.docente_bq).status_code, 403)


class UsuariosSinEscaladaTests(AislamientoBase):
    def test_no_se_puede_crear_un_administrador_general_desde_una_seccional(self):
        c = _cliente(self.admin_bq)
        base = {'nombre': 'Nuevo', 'correo': 'nuevo@prueba.test', 'sede': self.sede_bq.id}
        r = c.post('/api/usuarios/', {**base, 'rol': self.rol_docente.id, 'es_superusuario': True}, format='json')
        self.assertEqual(r.status_code, 400, r.content)
        rol_global = Rol.objects.get_or_create(nombre='admin_global')[0]
        r = c.post('/api/usuarios/', {**base, 'rol': rol_global.id}, format='json')
        self.assertEqual(r.status_code, 400, r.content)
        self.assertFalse(Usuario.objects.filter(correo='nuevo@prueba.test').exists())

    def test_no_se_puede_ascender_a_nadie_a_administrador_general(self):
        c = _cliente(self.admin_bq)
        r = c.patch(f'/api/usuarios/{self.docente_bq.id}/', {'es_superusuario': True}, format='json')
        self.assertEqual(r.status_code, 400, r.content)
        self.docente_bq.refresh_from_db()
        self.assertFalse(self.docente_bq.es_superusuario)

    def test_no_se_edita_ni_elimina_a_un_administrador_general(self):
        general_en_bq = Usuario.objects.create_user(
            correo='general_bq@prueba.test', nombre='g', rol=self.general.rol, sede=self.sede_bq, es_superusuario=True)
        c = _cliente(self.admin_bq)
        self.assertEqual(c.patch(f'/api/usuarios/{general_en_bq.id}/', {'nombre': 'x'}, format='json').status_code, 403)
        self.assertEqual(c.delete(f'/api/usuarios/{general_en_bq.id}/').status_code, 403)
        self.assertTrue(Usuario.objects.filter(pk=general_en_bq.pk).exists())

    def test_lo_normal_sigue_funcionando(self):
        c = _cliente(self.admin_bq)
        r = c.post('/api/usuarios/', {'nombre': 'Nuevo', 'correo': 'nuevo@prueba.test', 'rol': self.rol_docente.id,
                                      'sede': self.sede_bq.id}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(c.patch(f"/api/usuarios/{r.json()['id']}/", {'nombre': 'Cambiado'}, format='json').status_code, 200)
        self.assertEqual(c.patch(f'/api/usuarios/{self.docente_cali.id}/', {'nombre': 'x'}, format='json').status_code, 404)

    def test_el_administrador_general_si_crea_administradores_generales(self):
        c = _cliente(self.general)
        r = c.post('/api/usuarios/', {'nombre': 'Otro', 'correo': 'otro@prueba.test', 'rol': self.general.rol.id,
                                      'es_superusuario': True}, format='json')
        self.assertEqual(r.status_code, 201, r.content)


class ChatbotsPorSeccionalTests(AislamientoBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.agente_bq = _agente('Solo Barranquilla', [cls.bq])
        cls.agente_cali = _agente('Solo Cali', [cls.cali])
        cls.agente_nacional = _agente('Nacional')
        cls.agente_compartido = _agente('Compartido', [cls.bq, cls.cali])

    def _ids(self, cliente):
        datos = cliente.get('/api/chatbot/agentes/').json()
        return {a['id'] for a in (datos['results'] if isinstance(datos, dict) else datos)}

    def test_quien_administra_chatbots_de_una_seccional_no_ve_los_de_otra(self):
        for usuario in (self.admin_bq, self.gestor_bq):
            ids = self._ids(_cliente(usuario))
            self.assertIn(self.agente_bq.id, ids)
            self.assertIn(self.agente_nacional.id, ids)
            self.assertNotIn(self.agente_cali.id, ids, usuario.nombre)

    def test_el_administrador_general_ve_todos(self):
        self.assertEqual(self._ids(_cliente(self.general)), set(Agente.objects.values_list('id', flat=True)))

    def test_edita_los_de_su_seccional(self):
        for usuario in (self.admin_bq, self.gestor_bq):
            r = _cliente(usuario).patch(f'/api/chatbot/agentes/{self.agente_bq.id}/', {'descripcion': 'nueva'}, format='json')
            self.assertEqual(r.status_code, 200, f'{usuario.nombre} {r.content}')

    def test_no_edita_ni_elimina_los_de_otra_seccional(self):
        for usuario in (self.admin_bq, self.gestor_bq):
            c = _cliente(usuario)
            self.assertEqual(c.patch(f'/api/chatbot/agentes/{self.agente_cali.id}/', {'descripcion': 'x'}, format='json').status_code, 404)
            self.assertEqual(c.delete(f'/api/chatbot/agentes/{self.agente_cali.id}/').status_code, 404)
        self.agente_cali.refresh_from_db()
        self.assertEqual(self.agente_cali.descripcion, 'd')

    def test_no_edita_los_nacionales_ni_los_compartidos(self):
        for usuario in (self.admin_bq, self.gestor_bq):
            c = _cliente(usuario)
            for agente in (self.agente_nacional, self.agente_compartido):
                self.assertEqual(c.patch(f'/api/chatbot/agentes/{agente.id}/', {'descripcion': 'x'}, format='json').status_code, 403, agente.nombre)
                self.assertEqual(c.delete(f'/api/chatbot/agentes/{agente.id}/').status_code, 403, agente.nombre)
        self.assertEqual(Agente.objects.filter(descripcion='x').count(), 0)

    def test_no_puede_abrir_su_chatbot_a_otras_seccionales(self):
        c = _cliente(self.admin_bq)
        r = c.patch(f'/api/chatbot/agentes/{self.agente_bq.id}/', {'seccionales': [self.cali.id]}, format='json')
        self.assertEqual(r.status_code, 403, r.content)
        self.assertEqual(list(self.agente_bq.seccionales.values_list('id', flat=True)), [self.bq.id])

    def test_lo_que_crea_queda_en_su_seccional(self):
        c = _cliente(self.admin_bq)
        cuerpo = {'nombre': 'Nuevo', 'descripcion': 'd', 'endpoint_url': 'http://rag.local/n', 'mensaje_bienvenida': 'hola'}
        r = c.post('/api/chatbot/agentes/', cuerpo, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(list(Agente.objects.get(pk=r.json()['id']).seccionales.values_list('id', flat=True)), [self.bq.id])
        r = c.post('/api/chatbot/agentes/', {**cuerpo, 'nombre': 'Ajeno', 'seccionales': [self.cali.id]}, format='json')
        self.assertEqual(r.status_code, 403, r.content)

    def test_el_administrador_general_escribe_cualquiera(self):
        c = _cliente(self.general)
        for agente in (self.agente_cali, self.agente_nacional, self.agente_compartido):
            self.assertEqual(c.patch(f'/api/chatbot/agentes/{agente.id}/', {'descripcion': 'g'}, format='json').status_code, 200)

    def test_un_docente_ve_los_de_su_seccional_y_no_escribe(self):
        c = _cliente(self.docente_bq)
        ids = self._ids(c)
        mios = {self.agente_bq.id, self.agente_cali.id, self.agente_nacional.id, self.agente_compartido.id}
        self.assertEqual(ids & mios, {self.agente_bq.id, self.agente_nacional.id, self.agente_compartido.id})
        self.assertEqual(c.patch(f'/api/chatbot/agentes/{self.agente_bq.id}/', {'descripcion': 'x'}, format='json').status_code, 403)

    def test_solo_el_administrador_general_elige_la_seccional_de_los_documentos(self):
        self.assertTrue(_cliente(self.general).get('/api/chatbot/seccionales/').json()['puede_elegir_seccional'])
        self.assertFalse(_cliente(self.admin_bq).get('/api/chatbot/seccionales/').json()['puede_elegir_seccional'])
