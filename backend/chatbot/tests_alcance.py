"""Alcance por seccional: dónde está disponible cada chatbot y a qué seccional aplica cada pregunta sugerida."""
import json
from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario

from .models import Agente, AgenteResponsable, PreguntaSugerida
from .tests import _BaseAnexos


def _json(cliente, url, cuerpo, metodo='post'):
    return getattr(cliente, metodo)(url, json.dumps(cuerpo), content_type='application/json')


class AlcancePorSeccionalTests(_BaseAnexos):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.bq = Seccional.objects.get(ciudad='Barranquilla')
        cls.cali = Seccional.objects.get(ciudad='Cali')
        sede_cali = Sede.objects.create(nombre='Sede Cali', seccional=cls.cali)
        rol_est = Rol.objects.get(nombre='estudiante')
        rol_area = Rol.objects.create(nombre='biblioteca_test')
        cls.est_cali = Usuario.objects.create(
            nombre='Est Cali', correo='est.cali.test@unilibre.edu.co', contrasena_hash='x',
            rol=rol_est, sede=sede_cali, seccional=cls.cali,
        )
        sede_bq = Sede.objects.get(nombre='Sede Centro')
        cls.resp_bq = Usuario.objects.create(
            nombre='Resp BQ', correo='resp.bq.test@unilibre.edu.co', contrasena_hash='x',
            rol=rol_area, sede=sede_bq, seccional=cls.bq,
        )
        cls.resp_cali = Usuario.objects.create(
            nombre='Resp Cali', correo='resp.cali.test@unilibre.edu.co', contrasena_hash='x',
            rol=rol_area, sede=sede_cali, seccional=cls.cali,
        )
        # «Admisiones» (self.agente) queda disponible en TODAS; este solo en Barranquilla.
        cls.solo_bq = Agente.objects.create(
            nombre='Investigativo BQ', descripcion='x', endpoint_url='http://localhost:8001', mensaje_bienvenida='Hola',
            tipo='investigativo',
        )
        cls.solo_bq.seccionales.add(cls.bq)

    def nombres(self, respuesta):
        return sorted(a['nombre'] for a in respuesta.json())

    # ---- quién ve qué chatbot ---------------------------------------------------------------

    def test_sin_seccionales_el_chatbot_esta_en_todas(self):
        for usuario in (self.estudiante, self.est_cali):
            self.entrar(usuario)
            self.assertIn('Admisiones', self.nombres(self.client.get(reverse('api-agente-list-create'))))

    def test_un_chatbot_de_barranquilla_solo_lo_ve_barranquilla(self):
        self.entrar(self.estudiante)
        self.assertIn('Investigativo BQ', self.nombres(self.client.get(reverse('api-agente-list-create'))))
        self.entrar(self.est_cali)
        self.assertNotIn('Investigativo BQ', self.nombres(self.client.get(reverse('api-agente-list-create'))))
        self.assertEqual(self.client.get(reverse('api-agente-detail', args=[self.solo_bq.id])).status_code, 404)

    def test_el_administrador_ve_todos(self):
        self.entrar(self.admin)
        self.assertIn('Investigativo BQ', self.nombres(self.client.get(reverse('api-agente-list-create'))))
        self.entrar(self.coordinador_cali)
        self.assertEqual(self.client.get(reverse('api-agente-list-create')).status_code, 200)

    def test_el_responsable_conserva_acceso_a_su_chatbot(self):
        AgenteResponsable.objects.create(agente=self.solo_bq, usuario=self.resp_bq)
        self.entrar(self.resp_bq)
        self.assertIn('Investigativo BQ', self.nombres(self.client.get(reverse('api-agente-list-create'))))

    def test_el_listado_publico_depende_de_la_seccional_elegida(self):
        def lista(**params):
            return sorted(a['nombre'] for a in self.client.get(reverse('api-public-agentes'), params).json()['agentes'])

        self.assertIn('Investigativo BQ', lista(seccional='barranquilla'))
        self.assertNotIn('Investigativo BQ', lista(seccional='cali'))
        self.assertIn('Admisiones', lista(seccional='cali'))
        sin_elegir = lista()  # sin elegir seccional: solo los de todas
        self.assertIn('Admisiones', sin_elegir)
        self.assertNotIn('Investigativo BQ', sin_elegir)

    # ---- el servidor impone la regla, no solo la lista ------------------------------------

    def test_preguntar_a_un_chatbot_no_disponible_es_403_en_el_chat_publico(self):
        cuerpo = {'agente_id': self.solo_bq.id, 'pregunta': 'Hola', 'seccional': 'cali'}
        with mock.patch('chatbot.views._consultar_rag', return_value=('ok', None, [])) as rag:
            self.assertEqual(_json(self.client, reverse('api-public-pregunta'), cuerpo).status_code, 403)
            rag.assert_not_called()
            cuerpo['seccional'] = 'barranquilla'
            self.assertEqual(_json(self.client, reverse('api-public-pregunta'), cuerpo).status_code, 200)

    def test_preguntar_a_un_chatbot_no_disponible_es_403_con_sesion(self):
        cuerpo = {'agente_id': self.solo_bq.id, 'pregunta': 'Hola', 'id_usuario': self.est_cali.id, 'nombre_usuario': 'x'}
        with mock.patch('chatbot.views._consultar_rag', return_value=('ok', None, [])) as rag:
            self.assertEqual(_json(self.client, reverse('api-legacy-pregunta'), cuerpo).status_code, 403)
            rag.assert_not_called()
            cuerpo['id_usuario'] = self.estudiante.id
            self.assertEqual(_json(self.client, reverse('api-legacy-pregunta'), cuerpo).status_code, 200)

    def test_no_se_sube_documentacion_a_una_seccional_donde_el_chatbot_no_esta(self):
        self.entrar(self.admin)
        pdf = lambda: SimpleUploadedFile('a.pdf', b'%PDF-1.4 x')
        with mock.patch('chatbot.admin_views.requests.post') as post:
            malo = self.client.post(reverse('api-admin-documentos'), {'chatbot_id': self.solo_bq.id, 'sede': 'cali', 'file': pdf()})
            self.assertEqual(malo.status_code, 400)
            post.assert_not_called()
        with mock.patch('chatbot.admin_views.requests.post', return_value=mock.Mock(status_code=200, content=b'{}', json=lambda: {})):
            bueno = self.client.post(reverse('api-admin-documentos'), {'chatbot_id': self.solo_bq.id, 'sede': 'barranquilla', 'file': pdf()})
            self.assertEqual(bueno.status_code, 200)

    def test_no_se_crean_preguntas_oficiales_en_una_seccional_donde_el_chatbot_no_esta(self):
        self.entrar(self.admin)
        respuesta = self.client.post(reverse('api-admin-preguntas-respuestas'), {
            'agente': self.solo_bq.id, 'sede': 'cali', 'pregunta': '¿Hora?', 'respuesta': 'Mañana'})
        self.assertEqual(respuesta.status_code, 400)

    def test_los_responsables_deben_ser_de_una_seccional_del_chatbot(self):
        self.entrar(self.admin)
        malo = _json(self.client, reverse('api-agente-detail', args=[self.solo_bq.id]),
                     {'responsables_ids': [self.resp_cali.id]}, metodo='patch')
        self.assertEqual(malo.status_code, 400)
        bueno = _json(self.client, reverse('api-agente-detail', args=[self.solo_bq.id]),
                      {'responsables_ids': [self.resp_bq.id]}, metodo='patch')
        self.assertEqual(bueno.status_code, 200)

    def test_el_admin_define_donde_esta_disponible_un_chatbot(self):
        self.entrar(self.admin)
        creado = _json(self.client, reverse('api-agente-list-create'), {
            'nombre': 'Nuevo', 'descripcion': 'x', 'endpoint_url': 'http://localhost:8001', 'mensaje_bienvenida': 'x',
            'tipo': 'normativo', 'seccionales': [self.cali.id]})
        self.assertEqual(creado.status_code, 201, creado.content)
        cuerpo = creado.json()
        self.assertEqual(cuerpo['seccionales'], [self.cali.id])
        self.assertEqual(cuerpo['disponible_en_todas'], False)
        self.assertEqual([s['ciudad'] for s in cuerpo['seccionales_detalle']], ['Cali'])
        todas = _json(self.client, reverse('api-agente-detail', args=[creado.json()['id']]), {'seccionales': []}, metodo='patch')
        self.assertEqual(todas.json()['disponible_en_todas'], True)

    # ---- preguntas sugeridas por seccional ----------------------------------------------------

    def _crear(self, agente, texto, **extra):
        return _json(self.client, reverse('api-pregunta-list-create'), {'agente': agente.id, 'pregunta': texto, 'orden': 1, **extra})

    def test_el_responsable_escribe_para_su_seccional_aunque_pida_otra(self):
        AgenteResponsable.objects.create(agente=self.agente, usuario=self.resp_bq)
        self.entrar(self.resp_bq)
        respuesta = self._crear(self.agente, '¿Horario de BQ?', seccional=self.cali.id)
        self.assertEqual(respuesta.status_code, 201, respuesta.content)
        self.assertEqual(respuesta.json()['seccional'], self.bq.id)  # se fuerza la suya
        self.assertEqual(respuesta.json()['seccional_nombre'], 'Barranquilla')

    def test_cada_seccional_ve_las_generales_y_las_suyas(self):
        PreguntaSugerida.objects.create(agente=self.agente, pregunta='General', orden=1)
        PreguntaSugerida.objects.create(agente=self.agente, pregunta='Solo BQ', orden=2, seccional=self.bq)
        PreguntaSugerida.objects.create(agente=self.agente, pregunta='Solo Cali', orden=3, seccional=self.cali)
        for usuario, esperadas in ((self.estudiante, {'General', 'Solo BQ'}), (self.est_cali, {'General', 'Solo Cali'})):
            self.entrar(usuario)
            vistas = {p['pregunta'] for p in self.client.get(reverse('api-pregunta-list-create'), {'agente': self.agente.id}).json()}
            self.assertEqual(vistas, esperadas)
        self.entrar(self.admin)
        self.assertEqual(len(self.client.get(reverse('api-pregunta-list-create'), {'agente': self.agente.id}).json()), 3)

    def test_el_chat_publico_trae_las_sugeridas_de_la_seccional_elegida(self):
        PreguntaSugerida.objects.create(agente=self.agente, pregunta='General', orden=1)
        PreguntaSugerida.objects.create(agente=self.agente, pregunta='Solo BQ', orden=2, seccional=self.bq)
        def rapidas(seccional):
            agentes = self.client.get(reverse('api-public-agentes'), {'seccional': seccional}).json()['agentes']
            return set(next(a for a in agentes if a['nombre'] == 'Admisiones')['preguntasRapidas'])
        self.assertEqual(rapidas('barranquilla'), {'General', 'Solo BQ'})
        self.assertEqual(rapidas('cali'), {'General'})

    def test_el_responsable_no_toca_las_generales_ni_las_de_otra_seccional(self):
        AgenteResponsable.objects.create(agente=self.agente, usuario=self.resp_bq)
        general = PreguntaSugerida.objects.create(agente=self.agente, pregunta='General', orden=1)
        de_cali = PreguntaSugerida.objects.create(agente=self.agente, pregunta='Cali', orden=2, seccional=self.cali)
        propia = PreguntaSugerida.objects.create(agente=self.agente, pregunta='BQ', orden=3, seccional=self.bq)
        self.entrar(self.resp_bq)
        self.assertEqual(self.client.delete(reverse('api-pregunta-detail', args=[general.id])).status_code, 403)
        self.assertEqual(self.client.delete(reverse('api-pregunta-detail', args=[de_cali.id])).status_code, 404)  # ni la ve
        edicion = _json(self.client, reverse('api-pregunta-detail', args=[propia.id]), {'pregunta': 'BQ editada', 'seccional': self.cali.id}, metodo='patch')
        self.assertEqual(edicion.status_code, 200)
        propia.refresh_from_db()
        self.assertEqual((propia.pregunta, propia.seccional_id), ('BQ editada', self.bq.id))
        self.assertEqual(self.client.delete(reverse('api-pregunta-detail', args=[propia.id])).status_code, 204)

    def test_el_admin_puede_crear_generales_y_de_cualquier_seccional(self):
        self.entrar(self.admin)
        general = self._crear(self.agente, 'General nueva')
        self.assertEqual(general.status_code, 201)
        self.assertIsNone(general.json()['seccional'])
        de_cali = self._crear(self.agente, 'Para Cali', seccional=self.cali.id)
        self.assertEqual(de_cali.json()['seccional'], self.cali.id)

    def test_quien_no_tiene_seccional_no_crea_preguntas(self):
        Usuario.objects.filter(pk=self.resp_bq.pk).update(seccional=None, sede=None)
        AgenteResponsable.objects.create(agente=self.agente, usuario=self.resp_bq)
        self.entrar(self.resp_bq)
        self.assertEqual(self._crear(self.agente, 'Sin seccional').status_code, 400)

    # ---- lista de seccionales para la interfaz -------------------------------------------------

    def test_la_lista_de_seccionales_dice_quien_puede_elegir(self):
        self.entrar(self.resp_bq)
        propio = self.client.get(reverse('api-chatbot-seccionales')).json()
        self.assertEqual(propio['puede_elegir_seccional'], False)
        self.assertEqual(propio['seccional_propia'], self.bq.id)
        self.assertEqual(sorted(s['ciudad'] for s in propio['seccionales']), ['Barranquilla', 'Cali'])
        self.entrar(self.admin)
        self.assertEqual(self.client.get(reverse('api-chatbot-seccionales')).json()['puede_elegir_seccional'], True)
        self.client.logout()
        self.client.cookies.clear()
        self.assertIn(self.client.get(reverse('api-chatbot-seccionales')).status_code, (401, 403))
