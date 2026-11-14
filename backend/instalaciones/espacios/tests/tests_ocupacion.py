"""
Ocupación semanal de espacios (JSON y PDF): caracterización de la respuesta actual.

Fija qué horarios y préstamos cuentan y cómo se reparten las horas por jornada:
- horarios aprobados cuyo día coincide sin importar mayúsculas con el nombre en español;
  si ese día no tiene ninguno, se usan los que tengan el nombre en inglés;
- préstamos con estado exactamente 'Aprobado' cuya fecha cae entre el lunes y el sábado de la semana;
- topes por jornada (36 h mañana, 36 h tarde, 24 h noche) en el JSON; el PDF suma la duración completa.
"""
import datetime
import json
from unittest import mock

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.test import Client, TestCase
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from academico.asignaturas.models import Asignatura
from academico.facultades.models import Facultad
from academico.grupos.models import Grupo
from academico.horario.models import Horario
from academico.periodos.models import PeriodoAcademico
from instalaciones.prestamos.models import PrestamoEspacio, TipoActividad
from academico.programas.models import Programa
from academico.sedes.models import Seccional, Sede
from identidad.usuarios.models import Usuario

from ..models import EspacioFisico, TipoEspacio

T = datetime.time


def _lunes_actual():
    hoy = timezone.now().date()
    return hoy - datetime.timedelta(days=hoy.weekday())


class OcupacionSemanalTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        seccional = Seccional.objects.create(ciudad='Ocupación')
        cls.sede = Sede.objects.create(nombre='Sede Ocupación', seccional=seccional)
        cls.super = Usuario.objects.create(
            nombre='Super', correo='super.ocupacion@prueba.co', es_superusuario=True, is_superuser=True,
            sede=cls.sede, seccional=seccional,
        )
        cls.aula = TipoEspacio.objects.get_or_create(nombre='Aula')[0]
        cls.lab = TipoEspacio.objects.get_or_create(nombre='Laboratorio Ocupación')[0]
        periodo = PeriodoAcademico.objects.create(
            nombre='2026-O', fecha_inicio=datetime.date(2026, 1, 1), fecha_fin=datetime.date(2027, 12, 31))
        programa = Programa.objects.create(
            nombre='Programa O', facultad=Facultad.objects.create(nombre='Fac O', sede=cls.sede))
        cls.grupo = Grupo.objects.create(programa=programa, periodo=periodo, nombre='G O', semestre=1)
        cls.asignatura = Asignatura.objects.create(nombre='Asig O', codigo='O1', creditos=3)
        cls.tipo_actividad = TipoActividad.objects.get_or_create(nombre='Evento')[0]
        cls.periodo = periodo

        cls.a = cls.espacio('Aula A', cls.aula, 'Bloque A-101')
        cls.vacio = cls.espacio('Aula Vacía', cls.aula, None)
        cls.lleno = cls.espacio('Aula Llena', cls.aula, None)
        cls.laboratorio = cls.espacio('Lab C', cls.lab, 'Bloque C')

        cls.horario(cls.a, 'Lunes', T(7), T(9, 30))
        cls.horario(cls.a, 'LUNES', T(11), T(13, 30))
        cls.horario(cls.a, 'Monday', T(18), T(20))          # el lunes ya tiene horarios en español: no cuenta
        cls.horario(cls.a, 'Martes', T(8), T(10), estado='pendiente')
        cls.horario(cls.a, 'Wednesday', T(17), T(21))       # el miércoles no tiene en español: cuenta
        cls.horario(cls.a, 'jueves', T(5), T(7))
        cls.horario(cls.a, 'Sábado', T(21), T(23))
        cls.horario(cls.a, 'Domingo', T(8), T(12))          # el domingo no se recorre
        for _ in range(7):
            cls.horario(cls.lleno, 'Viernes', T(6), T(12))  # 42 h de mañana: supera el tope de 36
        cls.horario(cls.laboratorio, 'Martes', T(14), T(16))

        lunes = _lunes_actual()
        cls.prestamo(cls.a, lunes + datetime.timedelta(days=1), T(14), T(16, 20))
        cls.prestamo(cls.a, lunes + datetime.timedelta(days=1), T(8), T(9), estado='Pendiente')
        cls.prestamo(cls.a, lunes - datetime.timedelta(days=1), T(8), T(9))   # domingo anterior
        cls.prestamo(cls.a, lunes + datetime.timedelta(days=7), T(8), T(9))   # lunes siguiente

    @classmethod
    def espacio(cls, nombre, tipo, ubicacion):
        return EspacioFisico.objects.create(nombre=nombre, sede=cls.sede, tipo=tipo, capacidad=30, ubicacion=ubicacion)

    @classmethod
    def horario(cls, espacio, dia, inicio, fin, estado='aprobado'):
        Horario.objects.create(
            grupo=cls.grupo, asignatura=cls.asignatura, espacio=espacio, dia_semana=dia,
            hora_inicio=inicio, hora_fin=fin, estado=estado,
        )

    @classmethod
    def prestamo(cls, espacio, fecha, inicio, fin, estado='Aprobado'):
        # bulk_create: se omite la validación de periodo activo, que no es lo que se prueba
        PrestamoEspacio.objects.bulk_create([PrestamoEspacio(
            espacio=espacio, tipo_actividad=cls.tipo_actividad, usuario=cls.super, periodo=cls.periodo,
            fecha=fecha, hora_inicio=inicio, hora_fin=fin, motivo='Prueba', estado=estado,
        )])

    def setUp(self):
        cache.clear()
        self.client = Client(HTTP_HOST='localhost')
        session = self.client.session
        session['user_id'] = self.super.id
        session.save()
        self.client.cookies[settings.SESSION_COOKIE_NAME] = session.session_key

    def semanal(self, **params):
        respuesta = self.client.get('/api/espacios/ocupacion/semanal/', params)
        self.assertEqual(respuesta.status_code, 200, respuesta.content[:300])
        return respuesta.json()

    def por_nombre(self, cuerpo):
        return {fila['nombre']: fila for fila in cuerpo['ocupacion']}

    # ------------------------------------------------------------------ JSON
    def test_semana_actual(self):
        lunes = _lunes_actual()
        cuerpo = self.semanal()
        self.assertEqual(cuerpo['semana_inicio'], lunes.isoformat())
        self.assertEqual(cuerpo['semana_fin'], (lunes + datetime.timedelta(days=5)).isoformat())
        filas = self.por_nombre(cuerpo)
        self.assertEqual(filas['Aula A'], {
            'id': self.a.id, 'nombre': 'Aula A', 'tipo': 'Aula', 'ubicacion': 'Bloque A-101', 'capacidad': 30,
            'sede': 'Sede Ocupación', 'edificio': 'Bloque A',
            'horasOcupadasSemana': 13.33, 'horasDisponibles': 96,
            'horasOcupadasManana': 4.5, 'horasOcupadasTarde': 4.83, 'horasOcupadasNoche': 4.0,
            'porcentajeOcupacion': 13.89, 'porcentajeManana': 12.5, 'porcentajeTarde': 13.43, 'porcentajeNoche': 16.67,
            'jornada': {'manana': 12.5, 'tarde': 13.4, 'noche': 16.7},
            'estado': self.a.estado,
        })
        self.assertEqual(filas['Aula Vacía']['horasOcupadasSemana'], 0)
        self.assertEqual(filas['Aula Vacía']['porcentajeOcupacion'], 0)
        self.assertEqual(filas['Aula Vacía']['ubicacion'], 'Sin ubicación')
        self.assertEqual(filas['Aula Vacía']['edificio'], 'N/A')
        lleno = filas['Aula Llena']
        self.assertEqual(
            (lleno['horasOcupadasManana'], lleno['porcentajeManana'], lleno['horasOcupadasSemana'], lleno['porcentajeOcupacion']),
            (36, 100.0, 36, 37.5),
        )
        self.assertEqual(filas['Lab C']['horasOcupadasTarde'], 2.0)
        self.assertEqual(len(filas), EspacioFisico.objects.count())

    def test_semana_siguiente_cuenta_sus_prestamos(self):
        a = self.por_nombre(self.semanal(semana_offset=1))['Aula A']
        # los horarios se repiten; el préstamo del martes ya no cae en la semana y entra el del lunes siguiente
        self.assertEqual((a['horasOcupadasManana'], a['horasOcupadasTarde'], a['horasOcupadasNoche']), (5.5, 2.5, 4.0))

    def test_filtros_por_tipo_y_por_espacio(self):
        self.assertEqual(list(self.por_nombre(self.semanal(tipo_espacio_id=self.lab.id))), ['Lab C'])
        self.assertEqual(list(self.por_nombre(self.semanal(espacio_id=self.a.id))), ['Aula A'])

    def test_semana_offset_invalido_responde_500(self):
        respuesta = self.client.get('/api/espacios/ocupacion/semanal/', {'semana_offset': 'x'})
        self.assertEqual(respuesta.status_code, 500)

    def test_consultas_no_crecen_con_los_espacios(self):
        def contar():
            cache.clear()
            with CaptureQueriesContext(connection) as ctx:
                self.semanal()
            return len(ctx.captured_queries)

        pocas = contar()
        for i in range(5):
            espacio = self.espacio(f'Extra {i}', self.aula, None)
            self.horario(espacio, 'Lunes', T(8), T(10))
        self.assertEqual(contar(), pocas)

    # ------------------------------------------------------------------ PDF
    def filas_pdf(self, **datos):
        from .. import reportes_pdf

        tablas = []
        original = reportes_pdf.Table

        class TablaQueAnota(original):
            def __init__(self, data, *args, **kwargs):
                tablas.append(data)
                super().__init__(data, *args, **kwargs)

        with mock.patch.object(reportes_pdf, 'Table', TablaQueAnota):
            respuesta = self.client.post('/api/espacios/ocupacion/pdf/', data=json.dumps(datos), content_type='application/json')
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta['Content-Type'], 'application/pdf')
        resumen, detalle = tablas
        filas = {fila[0]: fila[1:6] + [fila[6].text] for fila in detalle[1:]}
        return [p.text for p in resumen[1]], filas

    def test_pdf(self):
        resumen, filas = self.filas_pdf()
        self.assertEqual(filas['Aula A'], ['Aula', 'Bloque A', '30', '15.3 / 96h', '16.0%', 'M: 12.5%<br/>T: 13.4%<br/>N: 16.7%'])
        self.assertEqual(filas['Aula Llena'], ['Aula', 'N/A', '30', '42.0 / 96h', '43.8%', 'M: 100.0%<br/>T: 0.0%<br/>N: 0.0%'])
        self.assertEqual(filas['Aula Vacía'][3:5], ['0.0 / 96h', '0.0%'])
        self.assertEqual(filas['Lab C'], ['Laboratorio Ocupación', 'Bloque C', '30', '2.0 / 96h', '2.1%', 'M: 0.0%<br/>T: 5.6%<br/>N: 0.0%'])
        self.assertEqual(len(filas), EspacioFisico.objects.count())
        self.assertEqual(resumen[1:3], ['59h', f'{96 * EspacioFisico.objects.count()}h'])

    def test_pdf_filtrado_por_tipo(self):
        _, filas = self.filas_pdf(tipo_espacio_id=self.lab.id)
        self.assertEqual(list(filas), ['Lab C'])

    def test_pdf_consultas_no_crecen_con_los_espacios(self):
        def contar():
            with CaptureQueriesContext(connection) as ctx:
                self.filas_pdf()
            return len(ctx.captured_queries)

        pocas = contar()
        for i in range(5):
            espacio = self.espacio(f'Extra {i}', self.aula, None)
            self.horario(espacio, 'Lunes', T(8), T(10))
        self.assertEqual(contar(), pocas)
