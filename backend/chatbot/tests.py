"""
Pruebas de las preguntas-respuestas con anexos (documentos de soporte) de los chatbots.

El servicio RAG (FastAPI) se simula: estas pruebas cubren lo que hace Django (validación,
permisos, almacenamiento, enlaces firmados y respuesta del chat). El flujo completo contra
el RAG real está en documentacion/documentacion_chatbot/pruebas_anexos/e2e_anexos.py.
"""
import io
import json
import shutil
import tempfile
import zipfile
from unittest import mock

from django.core import signing
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.test.client import BOUNDARY, MULTIPART_CONTENT, encode_multipart
from django.urls import reverse

from componentes.models import Componente, ComponenteRol, ComponenteUsuario
from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario

from .anexos import AnexoInvalido, generar_token, leer_token, validar_anexo
from .models import Agente, AgenteResponsable, AnexoRespuesta, Conversacion, PreguntaRespuesta, PreguntaSugerida

_OLE = b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'


def _ooxml(carpeta):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as zf:
        zf.writestr('[Content_Types].xml', '<Types/>')
        zf.writestr(f'{carpeta}document.xml', '<x/>')
    return buf.getvalue()


CONTENIDOS = {
    'soporte.pdf': b'%PDF-1.4\n%prueba\n',
    'formato.doc': _OLE + b'\x00' * 504,
    'formato.docx': _ooxml('word/'),
    'tabla.xls': _OLE + b'\x00' * 504,
    'tabla.xlsx': _ooxml('xl/'),
}


def archivo(nombre, contenido=None):
    return SimpleUploadedFile(nombre, CONTENIDOS[nombre] if contenido is None else contenido)


class ValidacionAnexoTests(TestCase):
    def test_acepta_los_cinco_formatos_con_su_mime(self):
        esperados = {
            'soporte.pdf': 'application/pdf',
            'formato.doc': 'application/msword',
            'formato.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'tabla.xls': 'application/vnd.ms-excel',
            'tabla.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
        for nombre, mime in esperados.items():
            with self.subTest(nombre=nombre):
                self.assertEqual(validar_anexo(archivo(nombre)), mime)

    def test_rechaza_extensiones_no_permitidas(self):
        for nombre in ('virus.exe', 'notas.txt', 'foto.png', 'sin_extension'):
            with self.subTest(nombre=nombre):
                with self.assertRaisesMessage(AnexoInvalido, 'formato no permitido'):
                    validar_anexo(SimpleUploadedFile(nombre, b'%PDF-1.4'))

    def test_rechaza_contenido_que_no_corresponde_a_la_extension(self):
        casos = {
            'falso.pdf': b'esto no es un pdf',
            'falso.doc': b'%PDF-1.4 renombrado',
            'falso.docx': _ooxml('xl/'),  # un Excel renombrado
            'falso.xlsx': _ooxml('word/'),  # un Word renombrado
            'roto.docx': b'PK\x03\x04no es un zip',
        }
        for nombre, contenido in casos.items():
            with self.subTest(nombre=nombre):
                with self.assertRaisesMessage(AnexoInvalido, 'no es un archivo'):
                    validar_anexo(SimpleUploadedFile(nombre, contenido))

    def test_rechaza_vacio_y_demasiado_grande(self):
        with self.assertRaisesMessage(AnexoInvalido, 'está vacío'):
            validar_anexo(SimpleUploadedFile('vacio.pdf', b''))
        with override_settings(CHATBOT_ANEXO_MAX_MB=1):
            with self.assertRaisesMessage(AnexoInvalido, 'supera el máximo de 1 MB'):
                validar_anexo(SimpleUploadedFile('grande.pdf', b'%PDF-' + b'0' * (1024 * 1024)))


class TokenDescargaTests(TestCase):
    def test_token_valido_solo_para_su_anexo(self):
        token = generar_token(7)
        self.assertEqual(leer_token(token, 7), {'id': 7, 'adm': False})
        self.assertIsNone(leer_token(token, 8))
        self.assertIsNone(leer_token(token + 'x', 7))
        self.assertIsNone(leer_token('', 7))

    def test_token_caducado(self):
        token = generar_token(7)
        with override_settings(CHATBOT_ANEXO_URL_MAX_AGE=-1):
            self.assertIsNone(leer_token(token, 7))

    def test_token_firmado_con_otra_sal_no_sirve(self):
        token = signing.dumps({'id': 7, 'adm': True}, compress=True)
        self.assertIsNone(leer_token(token, 7))


class _BaseAnexos(TestCase):
    """Usuarios, agente y almacenamiento temporal; el aviso al RAG se simula."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._media = tempfile.mkdtemp(prefix='anexos_test_')
        cls._override = override_settings(MEDIA_ROOT=cls._media)
        cls._override.enable()

    @classmethod
    def tearDownClass(cls):
        cls._override.disable()
        shutil.rmtree(cls._media, ignore_errors=True)
        super().tearDownClass()

    @classmethod
    def setUpTestData(cls):
        barranquilla = Seccional.objects.create(ciudad='Barranquilla')
        cali = Seccional.objects.create(ciudad='Cali')
        sede = Sede.objects.create(nombre='Sede Centro', seccional=barranquilla)
        rol_admin = Rol.objects.create(nombre='admin')
        rol_coordinador = Rol.objects.create(nombre='coordinador_chatbots_test')
        rol_estudiante = Rol.objects.create(nombre='estudiante')
        cls.admin = Usuario.objects.create(
            nombre='Admin', correo='admin.test@unilibre.edu.co', contrasena_hash='x',
            rol=rol_admin, sede=sede, seccional=barranquilla,
        )
        cls.coordinador_cali = Usuario.objects.create(
            nombre='Coordinador Cali', correo='coord.test@unilibre.edu.co', contrasena_hash='x',
            rol=rol_coordinador, seccional=cali,
        )
        cls.estudiante = Usuario.objects.create(
            nombre='Estudiante', correo='est.test@unilibre.edu.co', contrasena_hash='x',
            rol=rol_estudiante, sede=sede, seccional=barranquilla,
        )
        cls.agente = Agente.objects.create(
            nombre='Admisiones', descripcion='Admisiones', endpoint_url='http://chatbot:8001',
            mensaje_bienvenida='Hola',
        )

    def setUp(self):
        patcher = mock.patch('chatbot.preguntas_respuestas_views.sincronizar_rag')
        self.sincronizar = patcher.start()
        self.addCleanup(patcher.stop)

    def entrar(self, usuario):
        sesion = self.client.session
        sesion['user_id'] = usuario.id
        sesion.save()

    def crear(self, nombres=(), **extra):
        datos = {
            'agente': self.agente.id,
            'pregunta': '¿Cómo hago para cancelar una matrícula?',
            'respuesta': 'Radica la solicitud con el formato adjunto.',
            **extra,
        }
        if nombres:
            datos['anexos'] = [archivo(n) for n in nombres]
        with self.captureOnCommitCallbacks(execute=True):
            return self.client.post(reverse('api-admin-preguntas-respuestas'), datos)

    def descargar(self, url):
        respuesta = self.client.get(url)
        contenido = b''.join(respuesta.streaming_content) if respuesta.status_code == 200 else b''
        return respuesta, contenido


class GestionPreguntasRespuestasTests(_BaseAnexos):
    def test_crea_con_los_cinco_formatos_y_descarga_el_archivo_real(self):
        self.entrar(self.admin)
        respuesta = self.crear(CONTENIDOS.keys())
        self.assertEqual(respuesta.status_code, 201, respuesta.content)
        cuerpo = respuesta.json()
        self.assertEqual(cuerpo['sede'], 'barranquilla')
        self.assertEqual(sorted(a['nombre'] for a in cuerpo['anexos']), sorted(CONTENIDOS))
        self.sincronizar.assert_called_once_with(self.agente.id, 'barranquilla')

        for anexo in cuerpo['anexos']:
            with self.subTest(nombre=anexo['nombre']):
                self.assertEqual(set(anexo), {'id', 'nombre', 'url', 'tipo', 'extension', 'tamano'})
                self.assertEqual(anexo['tamano'], len(CONTENIDOS[anexo['nombre']]))
                descarga, contenido = self.descargar(anexo['url'])
                self.assertEqual(descarga.status_code, 200)
                self.assertEqual(contenido, CONTENIDOS[anexo['nombre']])
                self.assertEqual(descarga['Content-Type'], anexo['tipo'])
                self.assertIn('attachment', descarga['Content-Disposition'])
                self.assertIn(anexo['nombre'], descarga['Content-Disposition'])
                self.assertEqual(descarga['X-Content-Type-Options'], 'nosniff')

    def test_el_archivo_se_guarda_con_nombre_aleatorio(self):
        self.entrar(self.admin)
        self.crear(['soporte.pdf'])
        anexo = AnexoRespuesta.objects.get()
        self.assertTrue(anexo.archivo.name.startswith('chatbot/anexos/'))
        self.assertNotIn('soporte', anexo.archivo.name)
        self.assertTrue(anexo.archivo.name.endswith('.pdf'))

    def test_anexo_es_opcional(self):
        self.entrar(self.admin)
        respuesta = self.crear()
        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.json()['anexos'], [])

    def test_un_archivo_invalido_no_guarda_nada(self):
        self.entrar(self.admin)
        datos = {
            'agente': self.agente.id, 'pregunta': 'P', 'respuesta': 'R',
            'anexos': [archivo('soporte.pdf'), SimpleUploadedFile('virus.exe', b'MZ')],
        }
        respuesta = self.client.post(reverse('api-admin-preguntas-respuestas'), datos)
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn('virus.exe', respuesta.json()['error'])
        self.assertFalse(PreguntaRespuesta.objects.exists())
        self.assertFalse(AnexoRespuesta.objects.exists())

    def test_maximo_de_anexos_por_respuesta(self):
        self.entrar(self.admin)
        with override_settings(CHATBOT_ANEXO_MAX_POR_RESPUESTA=2):
            respuesta = self.crear(['soporte.pdf', 'formato.docx', 'tabla.xlsx'])
        self.assertEqual(respuesta.status_code, 400)
        self.assertFalse(PreguntaRespuesta.objects.exists())

    def test_textos_obligatorios(self):
        self.entrar(self.admin)
        respuesta = self.crear(pregunta='  ', respuesta='')
        self.assertEqual(respuesta.status_code, 400)
        self.assertEqual(set(respuesta.json()['errores']), {'pregunta', 'respuesta'})

    def test_editar_quita_y_agrega_anexos_y_borra_el_archivo_quitado(self):
        self.entrar(self.admin)
        cuerpo = self.crear(['soporte.pdf', 'formato.doc']).json()
        quitar = next(a for a in cuerpo['anexos'] if a['nombre'] == 'formato.doc')
        ruta_quitada = AnexoRespuesta.objects.get(id=quitar['id']).archivo.path

        url = reverse('api-admin-pregunta-respuesta-detalle', args=[cuerpo['id']])
        with self.captureOnCommitCallbacks(execute=True):
            respuesta = self.client.patch(
                url,
                encode_multipart(BOUNDARY, {
                    'respuesta': 'Nueva respuesta',
                    'anexos_eliminar': str(quitar['id']),
                    'anexos': [archivo('tabla.xlsx')],
                }),
                content_type=MULTIPART_CONTENT,
            )
        self.assertEqual(respuesta.status_code, 200, respuesta.content)
        self.assertEqual(respuesta.json()['respuesta'], 'Nueva respuesta')
        self.assertEqual(sorted(a['nombre'] for a in respuesta.json()['anexos']), ['soporte.pdf', 'tabla.xlsx'])
        with self.assertRaises(FileNotFoundError):
            open(ruta_quitada, 'rb')

    def test_eliminar_borra_filas_y_archivos(self):
        self.entrar(self.admin)
        cuerpo = self.crear(['soporte.pdf']).json()
        ruta = AnexoRespuesta.objects.get().archivo.path
        with self.captureOnCommitCallbacks(execute=True):
            respuesta = self.client.delete(reverse('api-admin-pregunta-respuesta-detalle', args=[cuerpo['id']]))
        self.assertEqual(respuesta.status_code, 204)
        self.assertFalse(PreguntaRespuesta.objects.exists())
        self.assertFalse(AnexoRespuesta.objects.exists())
        with self.assertRaises(FileNotFoundError):
            open(ruta, 'rb')

    def test_estudiante_y_anonimo_no_gestionan(self):
        url = reverse('api-admin-preguntas-respuestas')
        self.assertIn(self.client.get(url).status_code, (401, 403))
        self.entrar(self.estudiante)
        self.assertEqual(self.client.get(url).status_code, 403)
        self.assertEqual(self.crear(['soporte.pdf']).status_code, 403)
        self.assertFalse(PreguntaRespuesta.objects.exists())

    def test_quien_gestiona_una_seccional_no_ve_otra(self):
        self.entrar(self.admin)
        pareja_id = self.crear().json()['id']
        self.entrar(self.coordinador_cali)
        with mock.patch('chatbot.admin_views.user_can_edit_componente', return_value=True):
            self.assertEqual(self.client.get(reverse('api-admin-preguntas-respuestas')).json(), [])
            detalle = reverse('api-admin-pregunta-respuesta-detalle', args=[pareja_id])
            self.assertEqual(self.client.get(detalle).status_code, 404)
            self.assertEqual(self.client.delete(detalle).status_code, 404)
            respuesta = self.client.get(reverse('api-admin-preguntas-respuestas'), {'sede': 'barranquilla'})
            self.assertEqual(respuesta.status_code, 403)
        self.assertTrue(PreguntaRespuesta.objects.filter(id=pareja_id).exists())


class DescargaAnexoTests(_BaseAnexos):
    def setUp(self):
        super().setUp()
        self.entrar(self.admin)
        self.crear(['soporte.pdf'])
        self.client.logout()
        self.anexo = AnexoRespuesta.objects.get()
        self.url = reverse('api-anexo-descargar', args=[self.anexo.id])

    def test_sin_token_o_con_token_ajeno_es_403(self):
        self.assertEqual(self.client.get(self.url).status_code, 403)
        otro = generar_token(self.anexo.id + 1)
        self.assertEqual(self.client.get(self.url, {'token': otro}).status_code, 403)

    def test_enlace_del_chat_funciona_sin_sesion(self):
        respuesta, contenido = self.descargar(f'{self.url}?token={generar_token(self.anexo.id)}')
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(contenido, CONTENIDOS['soporte.pdf'])
        self.assertIn('no-store', respuesta['Cache-Control'])

    def test_enlace_del_chat_deja_de_servir_si_se_desactiva(self):
        token_chat, token_gestion = generar_token(self.anexo.id), generar_token(self.anexo.id, administracion=True)
        PreguntaRespuesta.objects.update(activo=False)
        self.assertEqual(self.client.get(self.url, {'token': token_chat}).status_code, 404)
        self.assertEqual(self.client.get(self.url, {'token': token_gestion}).status_code, 200)
        PreguntaRespuesta.objects.update(activo=True)
        Agente.objects.update(activo=False)
        self.assertEqual(self.client.get(self.url, {'token': token_chat}).status_code, 404)

    def test_archivo_ausente_es_404(self):
        self.anexo.archivo.storage.delete(self.anexo.archivo.name)
        self.assertEqual(self.client.get(self.url, {'token': generar_token(self.anexo.id)}).status_code, 404)


class ChatConAnexosTests(_BaseAnexos):
    """El chat entrega los anexos que el RAG indica, pero los vuelve a validar en Django."""

    def setUp(self):
        super().setUp()
        self.entrar(self.admin)
        self.pareja_id = self.crear(['soporte.pdf', 'formato.docx']).json()['id']
        self.ids = list(AnexoRespuesta.objects.order_by('id').values_list('id', flat=True))
        self.client.logout()

    def _rag(self, anexos):
        respuesta = mock.Mock()
        respuesta.json.return_value = {'answer': 'Radica la solicitud.', 'anexos': [{'id': i} for i in anexos]}
        return mock.patch('chatbot.views._enviar_pregunta_fastapi', return_value=respuesta)

    def _preguntar(self, anexos, **extra):
        datos = {
            'agente_id': self.agente.id, 'pregunta': '¿Cómo cancelo la matrícula?',
            'id_usuario': self.estudiante.id, 'nombre_usuario': 'Estudiante', **extra,
        }
        with self._rag(anexos):
            return self.client.post(reverse('api-legacy-pregunta'), json.dumps(datos), content_type='application/json')

    def test_respuesta_incluye_anexos_descargables(self):
        cuerpo = self._preguntar(self.ids).json()
        self.assertEqual(cuerpo['respuesta'], 'Radica la solicitud.')
        self.assertEqual([a['nombre'] for a in cuerpo['anexos']], ['soporte.pdf', 'formato.docx'])
        for anexo in cuerpo['anexos']:
            self.assertEqual(self.descargar(anexo['url'])[0].status_code, 200)
        conversacion = Conversacion.objects.get()
        self.assertEqual(sorted(conversacion.anexos.values_list('id', flat=True)), self.ids)

    def test_pregunta_sin_anexos_queda_igual(self):
        cuerpo = self._preguntar([]).json()
        self.assertEqual(cuerpo['respuesta'], 'Radica la solicitud.')
        self.assertEqual(cuerpo['anexos'], [])

    def test_ignora_anexos_de_otro_agente_o_inactivos(self):
        otro = Agente.objects.create(nombre='Investigación', descripcion='-', endpoint_url='http://x', mensaje_bienvenida='-')
        PreguntaRespuesta.objects.filter(id=self.pareja_id).update(agente=otro)
        self.assertEqual(self._preguntar(self.ids).json()['anexos'], [])
        PreguntaRespuesta.objects.filter(id=self.pareja_id).update(agente=self.agente, activo=False)
        self.assertEqual(self._preguntar(self.ids).json()['anexos'], [])

    def test_historial_entrega_enlaces_nuevos_y_oculta_los_inactivos(self):
        chat_id = self._preguntar(self.ids).json()['chat_id']
        historial = self.client.get(reverse('api-legacy-historial'), {'chat_id': chat_id}).json()['mensajes']
        bot = next(m for m in historial if m['tipo'] == 'bot')
        self.assertEqual(len(bot['anexos']), 2)
        self.assertEqual(self.descargar(bot['anexos'][0]['url'])[0].status_code, 200)
        self.assertNotIn('anexos', next(m for m in historial if m['tipo'] == 'user'))

        PreguntaRespuesta.objects.update(activo=False)
        historial = self.client.get(reverse('api-legacy-historial'), {'chat_id': chat_id}).json()['mensajes']
        self.assertEqual(next(m for m in historial if m['tipo'] == 'bot')['anexos'], [])

    def test_chat_publico_entrega_anexos_de_su_seccional(self):
        datos = {'agente_id': self.agente.id, 'pregunta': 'cancelar matrícula', 'seccional': 'Barranquilla'}
        with self._rag(self.ids):
            cuerpo = self.client.post(reverse('api-public-pregunta'), json.dumps(datos), content_type='application/json').json()
        self.assertEqual(len(cuerpo['anexos']), 2)
        self.assertEqual(self.descargar(cuerpo['anexos'][0]['url'])[0].status_code, 200)

        datos['seccional'] = 'Cali'
        with self._rag(self.ids):
            cuerpo = self.client.post(reverse('api-public-pregunta'), json.dumps(datos), content_type='application/json').json()
        self.assertEqual(cuerpo['anexos'], [])

    def test_error_del_rag_no_entrega_anexos(self):
        import requests

        with mock.patch('chatbot.views._enviar_pregunta_fastapi', side_effect=requests.exceptions.ConnectionError):
            datos = {'agente_id': self.agente.id, 'pregunta': 'x', 'id_usuario': self.estudiante.id, 'nombre_usuario': 'E'}
            cuerpo = self.client.post(reverse('api-legacy-pregunta'), json.dumps(datos), content_type='application/json').json()
        self.assertEqual(cuerpo['anexos'], [])
        self.assertFalse(Conversacion.objects.exists())


class PermisosDocumentacionChatbotsTests(_BaseAnexos):
    """Administrar chatbots y gestionar su documentación son permisos distintos.

    - «Gestión de Chatbots» (EDITAR): crear/editar/eliminar chatbots y documentación de TODOS.
    - «Gestión de Documentación de Chatbots» (EDITAR): solo documentos y preguntas-respuestas de
      los chatbots que tiene asignados como responsable, y siempre de la seccional de su usuario.
    El servicio RAG (FastAPI) se simula.
    """

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        sede = Sede.objects.get(nombre='Sede Centro')
        barranquilla = Seccional.objects.get(ciudad='Barranquilla')
        gestion, _ = Componente.objects.get_or_create(nombre='Gestión de Chatbots')
        documentacion, _ = Componente.objects.get_or_create(nombre='Gestión de Documentación de Chatbots')
        cls.documentacion = documentacion
        cls.otro_agente = Agente.objects.create(
            nombre='Investigativo', descripcion='Investigativo', endpoint_url='http://localhost:8001',
            mensaje_bienvenida='Hola', tipo='investigativo',
        )

        def usuario(correo, rol, con_seccional=True):
            return Usuario.objects.create(
                nombre=correo, correo=correo, contrasena_hash='x', rol=rol,
                sede=sede if con_seccional else None, seccional=barranquilla if con_seccional else None,
            )

        rol_docs = Rol.objects.create(nombre='cargador_documentos_test')
        ComponenteRol.objects.create(componente=documentacion, rol=rol_docs, permiso='EDITAR')
        rol_gestor = Rol.objects.create(nombre='gestor_chatbots_test')
        ComponenteRol.objects.create(componente=gestion, rol=rol_gestor, permiso='EDITAR')
        rol_solo_ver = Rol.objects.create(nombre='solo_ver_documentos_test')
        ComponenteRol.objects.create(componente=documentacion, rol=rol_solo_ver, permiso='VER')
        rol_sin_componentes = Rol.objects.create(nombre='sin_componentes_test')

        cls.cargador = usuario('cargador.test@unilibre.edu.co', rol_docs)
        cls.gestor = usuario('gestor.test@unilibre.edu.co', rol_gestor)
        cls.solo_ver = usuario('ver.test@unilibre.edu.co', rol_solo_ver)
        cls.sin_rol_util = usuario('sinrol.test@unilibre.edu.co', rol_sin_componentes)
        cls.sin_seccional = usuario('sinseccional.test@unilibre.edu.co', rol_docs, con_seccional=False)

    def setUp(self):
        super().setUp()
        # El cargador tiene asignado solo el chatbot «Admisiones» (self.agente).
        AgenteResponsable.objects.create(agente=self.agente, usuario=self.cargador)

    def _rag(self, status=200, cuerpo=None):
        respuesta = mock.Mock(status_code=status, content=b'{}')
        respuesta.json.return_value = {} if cuerpo is None else cuerpo
        return respuesta

    def _subir(self, agente=None, **extra):
        datos = {'chatbot_id': (agente or self.agente).id, 'sede': 'barranquilla',
                 'file': SimpleUploadedFile('reglamento.pdf', CONTENIDOS['soporte.pdf'])}
        datos.update(extra)
        return self.client.post(reverse('api-admin-documentos'), {k: v for k, v in datos.items() if v is not None})

    def _crear_agente(self, **extra):
        datos = {
            'nombre': 'Nuevo', 'descripcion': 'Nuevo chatbot', 'endpoint_url': 'http://localhost:8001',
            'mensaje_bienvenida': 'Hola', 'tipo': 'normativo', **extra,
        }
        return self.client.post(reverse('api-agente-list-create'), json.dumps(datos), content_type='application/json')

    # ---- permiso por componente -------------------------------------------------------------

    def test_cargador_sube_y_lista_documentos_de_su_chatbot(self):
        self.entrar(self.cargador)
        with mock.patch('chatbot.admin_views.requests.post', return_value=self._rag()) as post, \
                mock.patch('chatbot.admin_views.requests.get', return_value=self._rag(cuerpo=[])) as get:
            self.assertEqual(self._subir().status_code, 200)
            self.assertEqual(self.client.get(reverse('api-admin-documentos'), {'sede': 'barranquilla'}).status_code, 200)
        post.assert_called_once()
        get.assert_called_once()

    def test_cargador_gestiona_preguntas_respuestas_de_su_seccional(self):
        self.entrar(self.cargador)
        self.assertEqual(self.client.get(reverse('api-admin-preguntas-respuestas')).status_code, 200)

    def test_cargador_no_puede_administrar_chatbots(self):
        self.entrar(self.cargador)
        # La migración de datos ya siembra el agente de biblioteca: se compara contra el total previo.
        total_antes = Agente.objects.count()
        self.assertEqual(self._crear_agente().status_code, 403)
        detalle = reverse('api-agente-detail', args=[self.agente.id])
        self.assertEqual(self.client.patch(detalle, json.dumps({'activo': False}), content_type='application/json').status_code, 403)
        self.assertEqual(self.client.delete(detalle).status_code, 403)
        self.agente.refresh_from_db()
        self.assertTrue(self.agente.activo)
        self.assertEqual(Agente.objects.count(), total_antes)

    def test_cargador_ve_los_chatbots_pero_no_sus_instrucciones_ni_responsables(self):
        self.entrar(self.cargador)
        agentes = self.client.get(reverse('api-agente-list-create')).json()
        self.assertIn(self.agente.id, [agente['id'] for agente in agentes])
        for agente in agentes:
            self.assertNotIn('instrucciones_adicionales', agente)
            self.assertNotIn('responsables', agente)

    def test_gestor_de_chatbots_administra_y_carga_documentos_de_cualquiera(self):
        self.entrar(self.gestor)
        self.assertEqual(self._crear_agente().status_code, 201)
        with mock.patch('chatbot.admin_views.requests.post', return_value=self._rag()):
            self.assertEqual(self._subir(self.otro_agente).status_code, 200)  # sin estar asignado
        agentes = self.client.get(reverse('api-agente-list-create')).json()
        self.assertIn('instrucciones_adicionales', agentes[0])
        self.assertTrue(all(a['puede_gestionar_documentos'] for a in agentes))

    def test_estudiante_no_carga_documentos_ni_administra(self):
        self.entrar(self.estudiante)
        with mock.patch('chatbot.admin_views.requests.post') as post:
            self.assertEqual(self._subir().status_code, 403)
        post.assert_not_called()
        self.assertEqual(self._crear_agente().status_code, 403)

    def test_anonimo_no_carga_documentos(self):
        self.assertIn(self._subir().status_code, (401, 403))

    def test_permiso_solo_ver_no_alcanza(self):
        # Con VER y sin ser responsable de ningún chatbot no se puede cargar nada.
        self.entrar(self.solo_ver)
        with mock.patch('chatbot.admin_views.requests.post') as post:
            self.assertEqual(self._subir().status_code, 403)
        post.assert_not_called()

    def test_ser_responsable_basta_aunque_el_rol_no_traiga_el_componente(self):
        # Una persona con un rol cualquiera (sin ningún componente de chatbots) sube documentos
        # solo por estar asignada como responsable de un chatbot, y solo de ese.
        self.entrar(self.sin_rol_util)
        with mock.patch('chatbot.admin_views.requests.post') as post:
            self.assertEqual(self._subir().status_code, 403)  # todavía no es responsable
        post.assert_not_called()
        AgenteResponsable.objects.create(agente=self.agente, usuario=self.sin_rol_util)
        with mock.patch('chatbot.admin_views.requests.post', return_value=self._rag()):
            self.assertEqual(self._subir().status_code, 200)
        with mock.patch('chatbot.admin_views.requests.post') as post:
            self.assertEqual(self._subir(self.otro_agente).status_code, 403)  # otro chatbot: no
        post.assert_not_called()
        self.assertEqual(self._crear_agente().status_code, 403)  # y no administra chatbots

    def test_el_responsable_recibe_el_componente_en_su_lista(self):
        from mysite.api_views import UsuarioViewSet

        nombres = lambda usuario: [c['nombre'] for c in UsuarioViewSet()._build_componentes(usuario)]
        self.assertNotIn('Gestión de Documentación de Chatbots', nombres(self.sin_rol_util))
        AgenteResponsable.objects.create(agente=self.agente, usuario=self.sin_rol_util)
        componentes = UsuarioViewSet()._build_componentes(self.sin_rol_util)
        documentacion = [c for c in componentes if c['nombre'] == 'Gestión de Documentación de Chatbots']
        self.assertEqual([c['permiso'] for c in documentacion], ['EDITAR'])
        self.assertNotIn('Gestión de Chatbots', [c['nombre'] for c in componentes])

    def test_el_menu_real_del_navegador_incluye_la_documentacion_del_responsable(self):
        # nginx reescribe /api/usuarios/login/ y /session-auth-state/ a /usuarios/..., que son las
        # vistas de usuarios.views: tienen que entregar los MISMOS componentes que el ViewSet.
        from django.contrib.auth.hashers import make_password

        clave = make_password('Clave-test-1')
        Usuario.objects.filter(pk=self.sin_rol_util.pk).update(contrasena_hash=clave, password=clave)
        doc = 'Gestión de Documentación de Chatbots'

        def entrar_y_leer():
            r = self.client.post(reverse('login_usuario'), json.dumps(
                {'correo': self.sin_rol_util.correo, 'contrasena': 'Clave-test-1'}), content_type='application/json')
            self.assertEqual(r.status_code, 200)
            estado = self.client.get(reverse('session_auth_state'))
            self.assertEqual(estado.status_code, 200)
            return [c['nombre'] for c in r.json()['componentes']], [c['nombre'] for c in estado.json()['componentes']]

        en_login, en_estado = entrar_y_leer()
        self.assertNotIn(doc, en_login + en_estado)
        AgenteResponsable.objects.create(agente=self.agente, usuario=self.sin_rol_util)
        en_login, en_estado = entrar_y_leer()
        self.assertIn(doc, en_login)
        self.assertIn(doc, en_estado)

    def test_el_menu_real_respeta_los_permisos_individuales(self):
        from django.contrib.auth.hashers import make_password

        clave = make_password('Clave-test-1')
        Usuario.objects.filter(pk=self.sin_rol_util.pk).update(contrasena_hash=clave, password=clave)
        gestion = Componente.objects.get(nombre='Gestión de Chatbots')
        ComponenteUsuario.objects.create(usuario=self.sin_rol_util, componente=gestion, permiso='EDITAR', activo=True)
        r = self.client.post(reverse('login_usuario'), json.dumps(
            {'correo': self.sin_rol_util.correo, 'contrasena': 'Clave-test-1'}), content_type='application/json')
        self.assertIn('Gestión de Chatbots', [c['nombre'] for c in r.json()['componentes']])

    def test_el_responsable_con_solo_ver_pasa_a_editar(self):
        AgenteResponsable.objects.create(agente=self.agente, usuario=self.solo_ver)
        self.entrar(self.solo_ver)
        with mock.patch('chatbot.admin_views.requests.post', return_value=self._rag()):
            self.assertEqual(self._subir().status_code, 200)

    def test_una_revocacion_expresa_gana_a_la_asignacion(self):
        from mysite.api_views import UsuarioViewSet

        AgenteResponsable.objects.create(agente=self.agente, usuario=self.sin_rol_util)
        ComponenteUsuario.objects.create(
            usuario=self.sin_rol_util, componente=self.documentacion, permiso='EDITAR', activo=False,
        )
        self.entrar(self.sin_rol_util)
        with mock.patch('chatbot.admin_views.requests.post') as post:
            self.assertEqual(self._subir().status_code, 403)
        post.assert_not_called()
        self.assertNotIn(
            'Gestión de Documentación de Chatbots',
            [c['nombre'] for c in UsuarioViewSet()._build_componentes(self.sin_rol_util)],
        )

    def test_excepcion_individual_tambien_concede_documentacion(self):
        # Sigue funcionando la vía antigua: permiso individual sobre el componente.
        ComponenteUsuario.objects.create(
            usuario=self.sin_rol_util, componente=self.documentacion, permiso='EDITAR', activo=True,
        )
        AgenteResponsable.objects.create(agente=self.agente, usuario=self.sin_rol_util)
        self.entrar(self.sin_rol_util)
        with mock.patch('chatbot.admin_views.requests.post', return_value=self._rag()):
            self.assertEqual(self._subir().status_code, 200)

    def test_excepcion_individual_inactiva_revoca_el_permiso_del_rol(self):
        ComponenteUsuario.objects.create(
            usuario=self.cargador, componente=self.documentacion, permiso='EDITAR', activo=False,
        )
        self.entrar(self.cargador)
        with mock.patch('chatbot.admin_views.requests.post') as post:
            self.assertEqual(self._subir().status_code, 403)
        post.assert_not_called()

    def test_quitar_administrar_a_alguien_con_ambos_deja_solo_la_documentacion(self):
        # Caso Wendy: el rol da «Gestión de Chatbots»; se revoca solo para ella y se le da la documentación.
        gestion = Componente.objects.get(nombre='Gestión de Chatbots')
        ComponenteUsuario.objects.create(usuario=self.gestor, componente=gestion, permiso='EDITAR', activo=False)
        ComponenteUsuario.objects.create(usuario=self.gestor, componente=self.documentacion, permiso='EDITAR', activo=True)
        AgenteResponsable.objects.create(agente=self.agente, usuario=self.gestor)
        self.entrar(self.gestor)
        self.assertEqual(self._crear_agente().status_code, 403)
        with mock.patch('chatbot.admin_views.requests.post', return_value=self._rag()):
            self.assertEqual(self._subir().status_code, 200)

    # ---- preguntas sugeridas: solo las escribe quien gestiona la documentación de ese chatbot
    def _crear_pregunta(self, agente, texto='¿Pregunta de prueba?'):
        return self.client.post(reverse('api-pregunta-list-create'), json.dumps(
            {'agente': agente.id, 'pregunta': texto, 'orden': 1, 'activo': True}), content_type='application/json')

    def test_un_estudiante_no_crea_preguntas_sugeridas(self):
        self.entrar(self.estudiante)
        self.assertEqual(self._crear_pregunta(self.agente).status_code, 403)
        self.assertEqual(PreguntaSugerida.objects.filter(agente=self.agente, pregunta__startswith='¿Pregunta de').count(), 0)

    def test_cualquier_autenticado_puede_verlas(self):
        PreguntaSugerida.objects.create(agente=self.agente, pregunta='¿Horario?', orden=1)
        self.entrar(self.estudiante)
        self.assertEqual(self.client.get(reverse('api-pregunta-list-create')).status_code, 200)

    def test_el_responsable_gestiona_las_de_su_chatbot_y_no_las_de_otro(self):
        self.entrar(self.cargador)  # responsable de self.agente
        creada = self._crear_pregunta(self.agente)
        self.assertEqual(creada.status_code, 201)
        self.assertEqual(self._crear_pregunta(self.otro_agente).status_code, 403)
        ajena = PreguntaSugerida.objects.create(agente=self.otro_agente, pregunta='Ajena', orden=1)
        detalle_ajena = reverse('api-pregunta-detail', args=[ajena.id])
        self.assertEqual(self.client.delete(detalle_ajena).status_code, 403)
        self.assertEqual(self.client.patch(detalle_ajena, json.dumps({'pregunta': 'x'}), content_type='application/json').status_code, 403)
        propia = reverse('api-pregunta-detail', args=[creada.json()['id']])
        self.assertEqual(self.client.patch(propia, json.dumps({'pregunta': 'Editada'}), content_type='application/json').status_code, 200)
        mover = self.client.patch(propia, json.dumps({'agente': self.otro_agente.id}), content_type='application/json')
        self.assertEqual(mover.status_code, 403)  # tampoco puede pasarla a un chatbot ajeno
        self.assertEqual(self.client.delete(propia).status_code, 204)

    def test_quien_administra_chatbots_gestiona_las_de_cualquiera(self):
        self.entrar(self.gestor)
        self.assertEqual(self._crear_pregunta(self.otro_agente).status_code, 201)

    def test_un_anonimo_no_las_escribe(self):
        self.assertIn(self._crear_pregunta(self.agente).status_code, (401, 403))

    # ---- alcance por chatbot asignado -------------------------------------------------------

    def test_sin_asignacion_no_sube_ni_ve_documentos(self):
        AgenteResponsable.objects.all().delete()
        self.entrar(self.cargador)
        with mock.patch('chatbot.admin_views.requests.post') as post, \
                mock.patch('chatbot.admin_views.requests.get', return_value=self._rag(cuerpo=[{'id': 1, 'chatbot_id': self.agente.id}])):
            self.assertEqual(self._subir().status_code, 403)
            self.assertEqual(self.client.get(reverse('api-admin-documentos')).json(), [])
        post.assert_not_called()

    def test_solo_sube_al_chatbot_asignado(self):
        self.entrar(self.cargador)
        with mock.patch('chatbot.admin_views.requests.post', return_value=self._rag()) as post:
            self.assertEqual(self._subir(self.otro_agente).status_code, 403)
            post.assert_not_called()
            self.assertEqual(self._subir(self.agente).status_code, 200)
        post.assert_called_once()

    def test_lista_solo_los_documentos_de_sus_chatbots(self):
        self.entrar(self.cargador)
        documentos = [
            {'id': 1, 'chatbot_id': self.agente.id, 'sede': 'barranquilla'},
            {'id': 2, 'chatbot_id': self.otro_agente.id, 'sede': 'barranquilla'},
            {'id': 3, 'chatbot_id': None, 'sede': 'barranquilla'},
        ]
        with mock.patch('chatbot.admin_views.requests.get', return_value=self._rag(cuerpo=documentos)) as get:
            respuesta = self.client.get(reverse('api-admin-documentos'))
            self.assertEqual([d['id'] for d in respuesta.json()], [1])
            # Pedir el chatbot de otro es 403 y ni siquiera consulta al RAG
            get.reset_mock()
            self.assertEqual(self.client.get(reverse('api-admin-documentos'), {'chatbot_id': self.otro_agente.id}).status_code, 403)
            get.assert_not_called()

    # ---- la seccional sale del usuario ------------------------------------------------------

    def test_la_seccional_sale_del_usuario_no_del_navegador(self):
        self.entrar(self.cargador)  # seccional Barranquilla
        with mock.patch('chatbot.admin_views.requests.post', return_value=self._rag()) as post:
            self.assertEqual(self._subir(sede='bogota').status_code, 403)
            post.assert_not_called()
            self.assertEqual(self._subir(sede=None).status_code, 200)  # sin sede: usa la suya
        self.assertEqual(post.call_args.kwargs['params']['sede'], 'barranquilla')

    def test_listar_con_sede_ajena_es_403(self):
        self.entrar(self.cargador)
        with mock.patch('chatbot.admin_views.requests.get') as get:
            self.assertEqual(self.client.get(reverse('api-admin-documentos'), {'sede': 'bogota'}).status_code, 403)
        get.assert_not_called()

    def test_admin_global_puede_elegir_la_seccional(self):
        self.entrar(self.admin)
        with mock.patch('chatbot.admin_views.requests.post', return_value=self._rag()) as post:
            self.assertEqual(self._subir(sede='bogota').status_code, 200)
        self.assertEqual(post.call_args.kwargs['params']['sede'], 'bogota')

    def test_usuario_sin_seccional_no_sube(self):
        AgenteResponsable.objects.create(agente=self.agente, usuario=self.sin_seccional)
        self.entrar(self.sin_seccional)
        with mock.patch('chatbot.admin_views.requests.post') as post:
            self.assertEqual(self._subir(sede=None).status_code, 400)
        post.assert_not_called()

    # ---- borrar y cambiar prioridad ---------------------------------------------------------

    def test_borrar_documento_exige_chatbot_asignado_y_su_seccional(self):
        self.entrar(self.cargador)
        url = reverse('api-admin-documento-detalle', args=[7])
        with mock.patch('chatbot.admin_views.requests.delete', return_value=self._rag(status=204)) as borrar:
            with mock.patch('chatbot.admin_views._datos_documento', return_value={'chatbot_id': self.otro_agente.id, 'sede': 'barranquilla'}):
                self.assertEqual(self.client.delete(url).status_code, 403)
            with mock.patch('chatbot.admin_views._datos_documento', return_value={'chatbot_id': self.agente.id, 'sede': 'bogota'}):
                self.assertEqual(self.client.delete(url).status_code, 404)
            borrar.assert_not_called()
            with mock.patch('chatbot.admin_views._datos_documento', return_value={'chatbot_id': self.agente.id, 'sede': 'barranquilla'}):
                self.assertEqual(self.client.delete(url).status_code, 204)
        borrar.assert_called_once()

    def test_cambiar_prioridad_exige_chatbot_asignado(self):
        self.entrar(self.cargador)
        url = reverse('api-admin-documento-prioridad', args=[7])
        with mock.patch('chatbot.admin_views.requests.patch', return_value=self._rag()) as patch_rag:
            with mock.patch('chatbot.admin_views._datos_documento', return_value={'chatbot_id': self.otro_agente.id, 'sede': 'barranquilla'}):
                self.assertEqual(self.client.patch(url, json.dumps({'prioridad': 1}), content_type='application/json').status_code, 403)
            patch_rag.assert_not_called()
            with mock.patch('chatbot.admin_views._datos_documento', return_value={'chatbot_id': self.agente.id, 'sede': 'barranquilla'}):
                self.assertEqual(self.client.patch(url, json.dumps({'prioridad': 1}), content_type='application/json').status_code, 200)

    # ---- preguntas y respuestas ------------------------------------------------------------

    def test_preguntas_respuestas_solo_del_chatbot_asignado(self):
        self.entrar(self.cargador)
        self.assertEqual(self.crear().status_code, 201)  # chatbot asignado
        self.assertEqual(self.crear(agente=self.otro_agente.id).status_code, 403)
        self.assertEqual(PreguntaRespuesta.objects.count(), 1)

    def test_preguntas_respuestas_no_lista_las_de_chatbots_no_asignados(self):
        PreguntaRespuesta.objects.create(
            agente=self.agente, sede='barranquilla', pregunta='¿Horario de la biblioteca?', respuesta='De 7 a 21 h',
        )
        ajena = PreguntaRespuesta.objects.create(
            agente=self.otro_agente, sede='barranquilla', pregunta='¿Cómo consulto una tesis?', respuesta='En el catálogo',
        )
        self.entrar(self.cargador)
        lista = self.client.get(reverse('api-admin-preguntas-respuestas')).json()
        self.assertEqual(len(lista), 1)
        self.assertEqual(
            self.client.get(reverse('api-admin-pregunta-respuesta-detalle', args=[ajena.id])).status_code, 404,
        )
        self.assertEqual(
            self.client.get(reverse('api-admin-preguntas-respuestas'), {'agente': self.otro_agente.id}).status_code, 403,
        )

    # ---- asignar responsables al crear o editar el chatbot ----------------------------------

    def test_gestor_asigna_responsables_al_crear_el_chatbot(self):
        self.entrar(self.gestor)
        respuesta = self._crear_agente(responsables_ids=[self.cargador.id])
        self.assertEqual(respuesta.status_code, 201)
        agente = Agente.objects.get(id=respuesta.json()['id'])
        self.assertEqual(list(agente.responsables.values_list('usuario_id', flat=True)), [self.cargador.id])
        self.assertEqual(respuesta.json()['responsables'][0]['correo'], self.cargador.correo)

    def test_gestor_cambia_los_responsables_al_editar(self):
        self.entrar(self.gestor)
        detalle = reverse('api-agente-detail', args=[self.agente.id])
        self.assertEqual(
            self.client.patch(detalle, json.dumps({'responsables_ids': [self.solo_ver.id]}), content_type='application/json').status_code, 200,
        )
        # Reemplaza: el cargador anterior sale y entra el nuevo
        self.assertEqual(
            sorted(self.agente.responsables.values_list('usuario_id', flat=True)), [self.solo_ver.id],
        )
        self.client.patch(detalle, json.dumps({'responsables_ids': []}), content_type='application/json')
        self.assertFalse(self.agente.responsables.exists())

    def test_editar_sin_enviar_responsables_no_los_toca(self):
        self.entrar(self.gestor)
        detalle = reverse('api-agente-detail', args=[self.agente.id])
        self.client.patch(detalle, json.dumps({'descripcion': 'Cambio'}), content_type='application/json')
        self.assertTrue(self.agente.responsables.filter(usuario=self.cargador).exists())

    def test_no_se_asigna_a_quien_no_tiene_seccional_o_esta_inactivo(self):
        self.entrar(self.gestor)
        self.assertEqual(self._crear_agente(responsables_ids=[self.sin_seccional.id]).status_code, 400)
        inactivo = Usuario.objects.create(
            nombre='Inactivo', correo='inactivo.test@unilibre.edu.co', contrasena_hash='x',
            rol=self.cargador.rol, seccional=self.cargador.seccional, sede=self.cargador.sede, activo=False,
        )
        self.assertEqual(self._crear_agente(responsables_ids=[inactivo.id]).status_code, 400)
        self.assertEqual(self._crear_agente(responsables_ids=[999999]).status_code, 400)

    def test_el_cargador_no_puede_asignar_responsables(self):
        self.entrar(self.cargador)
        detalle = reverse('api-agente-detail', args=[self.otro_agente.id])
        respuesta = self.client.patch(detalle, json.dumps({'responsables_ids': [self.cargador.id]}), content_type='application/json')
        self.assertEqual(respuesta.status_code, 403)
        self.assertFalse(self.otro_agente.responsables.exists())

    def test_cada_usuario_ve_cuales_chatbots_puede_cargar(self):
        self.entrar(self.cargador)
        agentes = {a['id']: a for a in self.client.get(reverse('api-agente-list-create')).json()}
        self.assertTrue(agentes[self.agente.id]['puede_gestionar_documentos'])
        self.assertFalse(agentes[self.otro_agente.id]['puede_gestionar_documentos'])

    def test_eliminar_el_chatbot_elimina_sus_asignaciones(self):
        self.entrar(self.gestor)
        self.client.delete(reverse('api-agente-detail', args=[self.agente.id]))
        self.assertFalse(AgenteResponsable.objects.filter(usuario=self.cargador).exists())

    # ---- búsqueda de personas ---------------------------------------------------------------

    def test_busqueda_de_candidatos(self):
        self.entrar(self.gestor)
        url = reverse('api-responsables-candidatos')
        encontrados = self.client.get(url, {'q': 'cargador'}).json()
        self.assertEqual([c['correo'] for c in encontrados], [self.cargador.correo])
        self.assertEqual(encontrados[0]['seccional'], 'Barranquilla')
        # Sin seccional y estudiantes no se ofrecen; con menos de 2 letras no busca
        self.assertEqual(self.client.get(url, {'q': 'sinseccional'}).json(), [])
        self.assertEqual(self.client.get(url, {'q': 'est.test'}).json(), [])
        self.assertEqual(self.client.get(url, {'q': 'c'}).json(), [])

    def test_busqueda_de_candidatos_solo_para_quien_administra(self):
        self.entrar(self.cargador)
        self.assertEqual(self.client.get(reverse('api-responsables-candidatos'), {'q': 'cargador'}).status_code, 403)


class AsignarResponsablesCommandTests(_BaseAnexos):
    """El comando asigna responsables a partir de correos; sin --aplicar solo muestra lo que haría."""

    def _ejecutar(self, *args):
        from django.core.management import call_command

        salida = io.StringIO()
        call_command('asignar_responsables_chatbot', *args, stdout=salida)
        return salida.getvalue()

    def test_la_vista_previa_no_guarda_nada(self):
        texto = self._ejecutar('--agente', str(self.agente.id), '--correos', self.admin.correo)
        self.assertIn('VISTA PREVIA', texto)
        self.assertIn('ASIGNAR', texto)
        self.assertFalse(AgenteResponsable.objects.filter(usuario=self.admin).exists())

    def test_aplicar_asigna_por_nombre_o_id_y_es_idempotente(self):
        self._ejecutar('--agente', self.agente.nombre.upper(), '--correos', self.admin.correo.upper(), '--aplicar')
        self.assertTrue(AgenteResponsable.objects.filter(usuario=self.admin, agente=self.agente).exists())
        texto = self._ejecutar('--agente', str(self.agente.id), '--correos', self.admin.correo, '--aplicar')
        self.assertIn('ya estaba', texto)
        self.assertEqual(AgenteResponsable.objects.filter(usuario=self.admin, agente=self.agente).count(), 1)

    def test_informa_correos_inexistentes_y_avisa_si_falta_seccional(self):
        texto = self._ejecutar(
            '--agente', str(self.agente.id), '--correos', 'nadie@unilibre.edu.co,' + self.coordinador_cali.correo, '--aplicar',
        )
        self.assertIn('NO EXISTE', texto)
        self.assertIn('nadie@unilibre.edu.co', texto)
        self.assertTrue(AgenteResponsable.objects.filter(usuario=self.coordinador_cali).exists())

    def test_quitar_elimina_la_asignacion(self):
        AgenteResponsable.objects.create(agente=self.agente, usuario=self.admin)
        self._ejecutar('--agente', str(self.agente.id), '--correos', self.admin.correo, '--quitar', '--aplicar')
        self.assertFalse(AgenteResponsable.objects.filter(usuario=self.admin).exists())

    def test_chatbot_inexistente_da_error_con_la_lista_disponible(self):
        from django.core.management.base import CommandError

        with self.assertRaises(CommandError) as error:
            self._ejecutar('--agente', 'No existe', '--correos', self.admin.correo)
        self.assertIn(self.agente.nombre, str(error.exception))

