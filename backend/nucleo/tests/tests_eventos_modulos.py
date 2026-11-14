"""Eventos de los módulos que registran sus propios recursos: chatbot, asistencia y los documentos del RAG."""
import json
from datetime import time, timedelta
from unittest import mock

from django.test import TestCase
from django.utils import timezone

from asistencia.models import AsignacionPractica, LugarPractica, RegistroAsistencia
from chatbot.models import Agente, Conversacion, PreguntaSugerida
from identidad.usuarios.models import Rol, Usuario
from nucleo.eventos import audiencia, canal
from nucleo.eventos.publicar import publicar_cambio


class _Canal:
    def __init__(self):
        self.publicados = []

    def publicar_mensaje(self, texto):
        self.publicados.append(json.loads(texto))


def _con_canal(falso):
    return mock.patch.multiple(canal, disponible=lambda: True, publicar_mensaje=falso.publicar_mensaje)


class EventosDeModulosTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        rol = Rol.objects.get_or_create(nombre='estudiante')[0]
        cls.est = Usuario.objects.create(nombre='E', correo='ev.mod.e@unilibre.edu.co', contrasena_hash='x', rol=rol)
        cls.resp = Usuario.objects.create(nombre='R', correo='ev.mod.r@unilibre.edu.co', contrasena_hash='x', rol=rol)
        cls.otro = Usuario.objects.create(nombre='O', correo='ev.mod.o@unilibre.edu.co', contrasena_hash='x', rol=rol)

    def eventos(self, falso, recurso):
        return [e for e in falso.publicados if e['recurso'] == recurso]

    def test_una_pregunta_sugerida_publica_su_evento(self):
        agente = Agente.objects.create(nombre='Agente EV', descripcion='x', endpoint_url='http://x', mensaje_bienvenida='Hola')
        falso = _Canal()
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            PreguntaSugerida.objects.create(agente=agente, pregunta='¿Hola?')
        self.assertEqual(len(self.eventos(falso, 'preguntas-sugeridas')), 1)

    def test_la_conversacion_es_personal_de_su_dueno(self):
        agente = Agente.objects.create(nombre='Agente EV2', descripcion='x', endpoint_url='http://x', mensaje_bienvenida='Hola')
        falso = _Canal()
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            Conversacion.objects.create(
                chatbot=agente, id_usuario=self.est.id, usuario='E', mensaje='hola', respuesta='ok', fecha=timezone.now(),
            )
        evento = self.eventos(falso, 'conversaciones')[0]
        self.assertTrue(audiencia.debe_recibir(evento, self.est))
        self.assertFalse(audiencia.debe_recibir(evento, self.otro))

    def test_la_asistencia_solo_le_llega_al_estudiante_y_a_su_responsable(self):
        lugar = LugarPractica.objects.create(nombre='Hospital EV', latitud=10.9685, longitud=-74.7813)
        hoy = timezone.localdate()
        falso = _Canal()
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            asignacion = AsignacionPractica.objects.create(
                estudiante=self.est, lugar=lugar, responsable=self.resp, fecha_inicio=hoy,
                fecha_fin=hoy + timedelta(days=1), hora_inicio=time(0, 0), hora_fin=time(23, 59),
            )
            RegistroAsistencia.objects.create(
                asignacion=asignacion, tipo='entrada', latitud=10.9685, longitud=-74.7813,
                precision_metros=5, distancia_metros=0, dentro_del_radio=True,
            )
        for recurso in ('asignaciones-practica', 'registros-asistencia'):
            evento = self.eventos(falso, recurso)[0]
            self.assertTrue(audiencia.debe_recibir(evento, self.est), recurso)
            self.assertTrue(audiencia.debe_recibir(evento, self.resp), recurso)
            self.assertFalse(audiencia.debe_recibir(evento, self.otro), recurso)

    def test_publicar_cambio_envia_un_evento_sin_modelo(self):
        falso = _Canal()
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            publicar_cambio('chatbot-documentos', id=7)
        self.assertEqual(falso.publicados[0]['recurso'], 'chatbot-documentos')
        self.assertEqual(falso.publicados[0]['id'], 7)
