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

from unispace.sedes.models import Seccional, Sede
from unispace.usuarios.models import Rol, Usuario

from .anexos import AnexoInvalido, generar_token, leer_token, validar_anexo
from .models import Agente, AnexoRespuesta, Conversacion, PreguntaRespuesta

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
