"""Acceso directo del navegador al servicio del chatbot: token firmado y enlaces de los anexos que entrega."""
import base64
import hashlib
import hmac
import json
from types import SimpleNamespace

from django.test import override_settings
from django.urls import reverse

from sedes.models import Sede
from usuarios.models import Rol, Usuario

from . import acceso_directo
from .models import AnexoRespuesta, PreguntaRespuesta
from .tests import _BaseAnexos

SECRETO = 'secreto-de-prueba-con-largo-suficiente-123456'
# Mismo valor que verifica el servicio del chatbot en chatbot/tests/test_directo.py: así los dos servicios
# comparten un caso fijo y un cambio de formato en uno de ellos rompe la prueba del otro.
TOKEN_DE_REFERENCIA = (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsIm5vbWJyZSI6IkFuYSBQXHUwMGU5cmV6Iiwic2VkZSI6ImJhcnJhbnF1a'
    'WxsYSIsImF1ZCI6InNpaHVsLWNoYXRib3QiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMDYwMH0.SRThj-JCIBuiabxoQc3EIvXiUAwywBbDsdDjbzTQs_c'
)


def _leer(token, secreto=SECRETO):
    """Verifica un token como lo hace el servicio del chatbot y devuelve su contenido."""
    cabecera, cuerpo, firma = token.split('.')
    esperada = base64.urlsafe_b64encode(
        hmac.new(secreto.encode(), f'{cabecera}.{cuerpo}'.encode(), hashlib.sha256).digest()).rstrip(b'=').decode()
    assert hmac.compare_digest(firma, esperada), 'firma inválida'
    relleno = lambda t: t + '=' * (-len(t) % 4)  # noqa: E731
    assert json.loads(base64.urlsafe_b64decode(relleno(cabecera))) == {'alg': 'HS256', 'typ': 'JWT'}
    return json.loads(base64.urlsafe_b64decode(relleno(cuerpo)))


@override_settings(CHATBOT_TOKEN_SECRET=SECRETO, CHATBOT_TOKEN_AUDIENCIA='sihul-chatbot', CHATBOT_TOKEN_VIGENCIA=600)
class EmisionDelTokenTests(_BaseAnexos):
    def test_el_formato_coincide_con_el_caso_de_referencia_del_servicio(self):
        token, vigencia = acceso_directo.emitir_token(SimpleNamespace(id=42, nombre='Ana Pérez'), 'barranquilla', ahora=1700000000)
        self.assertEqual(token, TOKEN_DE_REFERENCIA)
        self.assertEqual(vigencia, 600)

    def test_un_usuario_con_sesion_recibe_su_token(self):
        self.entrar(self.estudiante)
        r = self.client.post(reverse('api-chatbot-token'))
        self.assertEqual(r.status_code, 200, r.content)
        datos = r.json()
        self.assertEqual((datos['expira_en'], datos['url']), (600, '/chatbot-api/v1/directo'))
        contenido = _leer(datos['token'])
        self.assertEqual(
            (contenido['sub'], contenido['nombre'], contenido['sede'], contenido['aud']),
            (str(self.estudiante.id), 'Estudiante', 'barranquilla', 'sihul-chatbot'))
        self.assertEqual(contenido['exp'] - contenido['iat'], 600)

    def test_el_token_lleva_la_seccional_propia_de_cada_usuario(self):
        self.entrar(self.coordinador_cali)
        contenido = _leer(self.client.post(reverse('api-chatbot-token')).json()['token'])
        self.assertEqual(contenido['sede'], 'cali')

    def test_sin_sesion_no_hay_token(self):
        r = self.client.post(reverse('api-chatbot-token'))
        self.assertIn(r.status_code, (401, 403))

    def test_un_usuario_sin_seccional_no_recibe_token(self):
        sin_seccional = Usuario.objects.create(
            nombre='Sin seccional', correo='sin.seccional.test@unilibre.edu.co', contrasena_hash='x',
            rol=Rol.objects.get(nombre='estudiante'))
        self.entrar(sin_seccional)
        r = self.client.post(reverse('api-chatbot-token'))
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.json()['error'], 'El usuario no tiene seccional configurada')

    @override_settings(CHATBOT_TOKEN_SECRET='')
    def test_sin_clave_configurada_el_acceso_directo_esta_desactivado(self):
        self.entrar(self.estudiante)
        r = self.client.post(reverse('api-chatbot-token'))
        self.assertEqual(r.status_code, 503)
        with self.assertRaises(acceso_directo.AccesoDirectoNoConfigurado):
            acceso_directo.emitir_token(self.estudiante, 'barranquilla')

    def test_solo_se_acepta_post(self):
        self.entrar(self.estudiante)
        self.assertEqual(self.client.get(reverse('api-chatbot-token')).status_code, 405)


class EnlacesDeAnexosTests(_BaseAnexos):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.sede_cali = Sede.objects.create(nombre='Sede Cali Anexos', seccional=cls.coordinador_cali.seccional)

    def anexo(self, sede='barranquilla', activo=True, nombre='guia.pdf', agente=None):
        pregunta = PreguntaRespuesta.objects.create(
            agente=agente or self.agente, sede=sede, pregunta='¿Cómo?', respuesta='Así', activo=activo)
        return AnexoRespuesta.objects.create(
            pregunta_respuesta=pregunta, archivo=f'anexos/{nombre}', nombre=nombre, tipo_mime='application/pdf', tamano=10)

    def pedir(self, ids):
        return self.client.post(reverse('api-anexos-enlaces'), json.dumps({'ids': ids}), content_type='application/json')

    def test_entrega_los_enlaces_de_los_anexos_activos_de_su_seccional(self):
        propio = self.anexo(nombre='propio.pdf')
        self.entrar(self.estudiante)
        r = self.pedir([propio.id])
        self.assertEqual(r.status_code, 200, r.content)
        [anexo] = r.json()['anexos']
        self.assertEqual((anexo['id'], anexo['nombre'], anexo['tipo'], anexo['extension'], anexo['tamano']),
                         (propio.id, 'propio.pdf', 'application/pdf', 'pdf', 10))
        self.assertIn(f'/anexos/{propio.id}/descargar/?token=', anexo['url'])

    def test_no_entrega_los_de_otra_seccional_ni_los_inactivos_ni_los_de_un_chatbot_inactivo(self):
        otra_sede = self.anexo(sede='cali', nombre='cali.pdf')
        inactivo = self.anexo(activo=False, nombre='inactivo.pdf')
        from .models import Agente
        agente_apagado = Agente.objects.create(
            nombre='Apagado', descripcion='x', endpoint_url='http://x', mensaje_bienvenida='Hola', activo=False)
        de_agente_apagado = self.anexo(nombre='apagado.pdf', agente=agente_apagado)
        propio = self.anexo(nombre='propio.pdf')
        self.entrar(self.estudiante)
        r = self.pedir([otra_sede.id, inactivo.id, de_agente_apagado.id, propio.id])
        self.assertEqual([a['id'] for a in r.json()['anexos']], [propio.id])

    def test_un_chatbot_de_otra_seccional_no_entrega_anexos(self):
        from .models import Agente
        solo_cali = Agente.objects.create(
            nombre='Solo Cali', descripcion='x', endpoint_url='http://x', mensaje_bienvenida='Hola')
        solo_cali.seccionales.add(self.coordinador_cali.seccional)
        anexo = self.anexo(nombre='solo_cali.pdf', agente=solo_cali)
        self.entrar(self.estudiante)
        self.assertEqual(self.pedir([anexo.id]).json(), {'anexos': []})

    def test_valida_la_peticion_y_exige_sesion(self):
        self.entrar(self.estudiante)
        for cuerpo in ({'ids': 'x'}, {'ids': ['1']}, {'ids': [True]}, {}):
            with self.subTest(cuerpo):
                r = self.client.post(reverse('api-anexos-enlaces'), json.dumps(cuerpo), content_type='application/json')
                self.assertEqual(r.status_code, 400)
        self.assertEqual(self.pedir([]).json(), {'anexos': []})
        self.client.session.flush()
        sin_sesion = self.client_class()
        r = sin_sesion.post(reverse('api-anexos-enlaces'), json.dumps({'ids': [1]}), content_type='application/json')
        self.assertIn(r.status_code, (401, 403))

    def test_limita_cuantos_enlaces_entrega(self):
        anexos = [self.anexo(nombre=f'a{i}.pdf') for i in range(25)]
        self.entrar(self.estudiante)
        r = self.pedir([a.id for a in anexos])
        self.assertEqual(len(r.json()['anexos']), 20)
