"""
Número de consultas de los listados más usados.

Cada prueba mide el listado con pocas filas y con más filas: el número de consultas no debe
crecer con la cantidad de filas (sin N+1). También comprueba que la respuesta siga trayendo
los mismos datos relacionados.
"""
import datetime

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.test import Client, TestCase
from django.test.utils import CaptureQueriesContext

from chatbot.models import Agente, AnexoRespuesta, Conversacion, PreguntaRespuesta
from espacios.models import EspacioFisico, TipoEspacio
from periodos.models import PeriodoAcademico
from prestamos.models import PrestamoEspacio, TipoActividad
from recursos.models import EspacioRecurso, Recurso
from sedes.models import Seccional, Sede
from usuarios.models import Usuario


class ConsultasDeListadosTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.seccional = Seccional.objects.create(ciudad='Prueba')
        cls.sede = Sede.objects.create(nombre='Sede Consultas', seccional=cls.seccional)
        cls.tipo = TipoEspacio.objects.get_or_create(nombre='Aula')[0]
        cls.super = Usuario.objects.create(
            nombre='Super', correo='super.consultas@prueba.co', es_superusuario=True, is_superuser=True,
            sede=cls.sede, seccional=cls.seccional,
        )
        cls.periodo = PeriodoAcademico.objects.create(
            nombre='2026-2', fecha_inicio=datetime.date(2026, 7, 1), fecha_fin=datetime.date(2026, 12, 15),
        )
        cls.agente = Agente.objects.create(nombre='Consultas', descripcion='-', endpoint_url='http://x', mensaje_bienvenida='-')
        cls.pareja = PreguntaRespuesta.objects.create(agente=cls.agente, sede='prueba', pregunta='¿P?', respuesta='R')

    def setUp(self):
        cache.clear()
        self.client = Client(HTTP_HOST='localhost')
        session = self.client.session
        session['user_id'] = self.super.id
        session.save()
        self.client.cookies[settings.SESSION_COOKIE_NAME] = session.session_key

    def contar(self, ruta):
        cache.clear()
        with CaptureQueriesContext(connection) as ctx:
            respuesta = self.client.get(ruta)
        self.assertEqual(respuesta.status_code, 200, respuesta.content[:300])
        return len(ctx.captured_queries), respuesta.json()

    # ------------------------------------------------------------------ datos
    def crear_espacios(self, n):
        for i in range(n):
            espacio = EspacioFisico.objects.create(nombre=f'E{EspacioFisico.objects.count()}', sede=self.sede, tipo=self.tipo, capacidad=10)
            for j in range(2):
                recurso = Recurso.objects.create(nombre=f'R{espacio.id}-{j}')
                EspacioRecurso.objects.create(espacio=espacio, recurso=recurso, estado='disponible')

    def crear_sedes(self, n):
        for i in range(n):
            otra = Seccional.objects.create(ciudad=f'Ciudad {Seccional.objects.count()}')
            Sede.objects.create(nombre=f'Sede {otra.id}', seccional=otra)

    def crear_conversaciones(self, n):
        for i in range(n):
            anexo = AnexoRespuesta.objects.create(
                pregunta_respuesta=self.pareja, archivo='anexos/x.pdf', nombre='x.pdf', tipo_mime='application/pdf', tamano=1,
            )
            conversacion = Conversacion.objects.create(
                chatbot=self.agente, id_usuario=self.super.id, usuario='Super', mensaje='m', respuesta='r',
            )
            conversacion.anexos.add(anexo)

    def crear_prestamos(self, n):
        tipo_actividad = TipoActividad.objects.get_or_create(nombre='Evento')[0]
        espacio = EspacioFisico.objects.create(nombre=f'P{EspacioFisico.objects.count()}', sede=self.sede, tipo=self.tipo, capacidad=10)
        # bulk_create: se omite la validación de periodo activo, que no es lo que se prueba
        PrestamoEspacio.objects.bulk_create([PrestamoEspacio(
            espacio=espacio, tipo_actividad=tipo_actividad, usuario=self.super, periodo=self.periodo,
            fecha=datetime.date(2026, 11, 3 + i), hora_inicio=datetime.time(8), hora_fin=datetime.time(10),
            motivo='Prueba', estado='Pendiente',
        ) for i in range(n)])

    # ------------------------------------------------------------------ pruebas
    def test_listado_de_espacios_no_crece_con_los_espacios(self):
        self.crear_espacios(1)
        pocas, _ = self.contar('/api/espacios/')
        self.crear_espacios(4)
        muchas, cuerpo = self.contar('/api/espacios/')
        self.assertEqual(pocas, muchas)
        filas = cuerpo['results'] if isinstance(cuerpo, dict) else cuerpo
        self.assertEqual(len(filas), 5)
        for fila in filas:
            self.assertEqual(len(fila['recursos']), 2)
            self.assertEqual({r['estado'] for r in fila['recursos']}, {'disponible'})
            self.assertTrue(all(r['nombre'].startswith(f"R{fila['id']}-") for r in fila['recursos']))

    def test_propiedad_recursos_con_estado_sin_prefetch_sigue_funcionando(self):
        self.crear_espacios(1)
        espacio = EspacioFisico.objects.get()
        self.assertEqual(sorted(r['nombre'] for r in espacio.recursos_con_estado), [f'R{espacio.id}-0', f'R{espacio.id}-1'])

    def test_listado_de_sedes_no_crece_con_las_sedes(self):
        self.crear_sedes(1)
        pocas, _ = self.contar('/api/sedes/')
        self.crear_sedes(4)
        muchas, cuerpo = self.contar('/api/sedes/')
        self.assertEqual(pocas, muchas)
        filas = cuerpo['results'] if isinstance(cuerpo, dict) else cuerpo
        self.assertTrue(all(fila['seccional_ciudad'] for fila in filas))

    def test_listado_de_conversaciones_no_crece_con_las_conversaciones(self):
        self.crear_conversaciones(1)
        pocas, _ = self.contar('/api/chatbot/conversaciones/')
        self.crear_conversaciones(4)
        muchas, cuerpo = self.contar('/api/chatbot/conversaciones/')
        self.assertEqual(pocas, muchas)
        filas = cuerpo['results'] if isinstance(cuerpo, dict) else cuerpo
        self.assertEqual(len(filas), 5)
        self.assertTrue(all(len(fila['anexos']) == 1 for fila in filas))

    def test_listado_de_prestamos_no_crece_con_los_prestamos(self):
        self.crear_prestamos(1)
        pocas, _ = self.contar('/api/prestamos/espacios/')
        self.crear_prestamos(4)
        muchas, cuerpo = self.contar('/api/prestamos/espacios/')
        self.assertEqual(pocas, muchas)
        filas = cuerpo['results'] if isinstance(cuerpo, dict) else cuerpo
        self.assertEqual(len(filas), 5)
        self.assertTrue(all(fila['espacio_tipo'] == 'Aula' and fila['periodo_nombre'] == '2026-2' for fila in filas))
