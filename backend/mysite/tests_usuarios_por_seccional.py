"""Cada administrador de seccional solo ve y consulta a las personas de su seccional; el general, a todas."""
from django.conf import settings
from django.test import Client, TestCase

from componentes.models import Componente, ComponenteUsuario
from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario


class UsuariosPorSeccionalTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.bq = Seccional.objects.create(ciudad='Barranquilla')
        cls.cali = Seccional.objects.create(ciudad='Cali')
        cls.sede_bq = Sede.objects.create(nombre='Sede BQ', seccional=cls.bq)
        cls.sede_cali = Sede.objects.create(nombre='Sede Cali', seccional=cls.cali)

        def usuario(nombre, rol_nombre, seccional=None, sede=None, **extra):
            rol = Rol.objects.get_or_create(nombre=rol_nombre)[0]
            u = Usuario.objects.create_user(correo=f'{nombre}@prueba.test', nombre=nombre, rol=rol, sede=sede, **extra)
            Usuario.objects.filter(pk=u.pk).update(seccional=seccional)
            u.refresh_from_db()
            return u

        cls.general = usuario('general', 'admin', es_superusuario=True)
        cls.admin_bq = usuario('admin_bq', 'admin', cls.bq, cls.sede_bq)
        cls.docente_bq = usuario('docente_bq', 'docente', cls.bq, cls.sede_bq)
        # Sin seccional propia, pero su sede es de Barranquilla: también pertenece a Barranquilla
        cls.solo_sede_bq = usuario('solo_sede_bq', 'docente', None, cls.sede_bq)
        cls.docente_cali = usuario('docente_cali', 'docente', cls.cali, cls.sede_cali)
        cls.fin = usuario('fin', 'Admin Financiero')
        cls.contador = usuario('contador', 'Contabilidad', cls.cali, cls.sede_cali)

    def entrar(self, usuario):
        c = Client()
        s = c.session
        s['user_id'] = usuario.id
        s.save()
        c.cookies[settings.SESSION_COOKIE_NAME] = s.session_key
        return c

    def correos(self, respuesta):
        datos = respuesta.json()
        filas = datos if isinstance(datos, list) else datos.get('results', [])
        return {u['correo'] for u in filas}

    def test_el_admin_de_seccional_solo_lista_su_seccional(self):
        c = self.entrar(self.admin_bq)
        for url in ('/api/usuarios/', '/api/usuarios/?page=1&page_size=100'):
            correos = self.correos(c.get(url))
            self.assertIn(self.docente_bq.correo, correos)
            self.assertIn(self.solo_sede_bq.correo, correos)
            self.assertNotIn(self.docente_cali.correo, correos)
            self.assertNotIn(self.contador.correo, correos)
            self.assertNotIn(self.general.correo, correos)

    def test_el_admin_de_seccional_no_abre_a_alguien_de_otra(self):
        c = self.entrar(self.admin_bq)
        self.assertEqual(c.get(f'/api/usuarios/{self.docente_bq.id}/').status_code, 200)
        self.assertEqual(c.get(f'/api/usuarios/{self.docente_cali.id}/').status_code, 404)

    def test_el_general_lista_a_todos(self):
        correos = self.correos(self.entrar(self.general).get('/api/usuarios/'))
        self.assertTrue({self.docente_bq.correo, self.docente_cali.correo, self.solo_sede_bq.correo} <= correos)

    def test_espacios_y_horarios_de_una_persona(self):
        rutas = ('/api/espacios-permitidos/usuario/{}/', '/api/espacios/horarios/supervisor/{}/')
        casos = [
            (self.docente_bq, self.docente_bq, True),  # los propios
            (self.admin_bq, self.docente_bq, True),  # de su seccional
            (self.admin_bq, self.solo_sede_bq, True),
            (self.admin_bq, self.docente_cali, False),  # de otra seccional
            (self.docente_bq, self.docente_cali, False),  # de otra persona
            (self.general, self.docente_cali, True),
        ]
        for solicitante, objetivo, permitido in casos:
            c = self.entrar(solicitante)
            for ruta in rutas:
                codigo = c.get(ruta.format(objetivo.id)).status_code
                with self.subTest(solicitante=solicitante.nombre, objetivo=objetivo.nombre, ruta=ruta):
                    self.assertEqual(codigo == 403, not permitido, codigo)

    def test_responsables_de_chatbot_solo_de_su_seccional(self):
        url = '/api/chatbot/responsables/candidatos/?q=prueba.test'
        correos = {u['correo'] for u in self.entrar(self.admin_bq).get(url).json()}
        self.assertEqual(correos, {self.admin_bq.correo, self.docente_bq.correo, self.solo_sede_bq.correo})
        correos = {u['correo'] for u in self.entrar(self.general).get(url).json()}
        self.assertIn(self.docente_cali.correo, correos)

    def test_responsables_de_un_chatbot_compartido(self):
        from chatbot.models import Agente, AgenteResponsable

        agente = Agente.objects.create(nombre='Nacional', descripcion='d', endpoint_url='http://x.test', mensaje_bienvenida='hola')
        for u in (self.docente_bq, self.docente_cali):
            AgenteResponsable.objects.create(agente=agente, usuario=u)

        def responsables(usuario):
            datos = self.entrar(usuario).get(f'/api/chatbot/agentes/{agente.id}/').json()
            return {r['correo'] for r in datos['responsables']}

        self.assertEqual(responsables(self.admin_bq), {self.docente_bq.correo})
        self.assertEqual(responsables(self.general), {self.docente_bq.correo, self.docente_cali.correo})

    def test_el_admin_financiero_solo_ve_permisos_del_equipo_financiero(self):
        componente = Componente.objects.create(nombre='Componente de prueba')
        ComponenteUsuario.objects.create(usuario=self.docente_bq, componente=componente, permiso='VER', activo=True)
        ComponenteUsuario.objects.create(usuario=self.contador, componente=componente, permiso='VER', activo=True)
        datos = self.entrar(self.fin).get('/api/componentes/usuarios/').json()
        filas = datos if isinstance(datos, list) else datos.get('results', [])
        self.assertEqual({f['usuario'] for f in filas}, {self.contador.id})
