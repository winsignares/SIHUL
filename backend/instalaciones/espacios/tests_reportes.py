"""Reportes de espacios en JSON (/api/espacios/reporte/{ocupacion,disponibilidad,capacidad}/): caracterización.

Fija cómo se calculan sobre la semana pedida (lunes a sábado):
- cuentan los horarios aprobados (o los pendientes, o todos, si se piden) del día y los préstamos 'Aprobado' de la fecha;
- ocupación por jornada: horas de mañana y tarde sobre 36 h por espacio y de noche sobre 24 h, truncadas a entero;
- más usados: los 5 espacios con más usos (horarios + préstamos), con su ocupación sobre 96 h;
- disponibilidad: 96 h por espacio menos las ocupadas, truncadas;
- capacidad: por tipo, la suma del promedio diario de estudiantes de cada espacio sobre la capacidad del tipo
  (30 estudiantes si la clase no lo dice; un préstamo cuenta el 30 % de la capacidad si ese día no hay clase).
"""
import datetime

from django.conf import settings
from django.core.cache import cache
from django.test import Client, TestCase
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

from .models import EspacioFisico, TipoEspacio

T = datetime.time


def _lunes(semanas=0):
    hoy = timezone.now().date()
    return hoy - datetime.timedelta(days=hoy.weekday()) + datetime.timedelta(weeks=semanas)


class ReportesEspaciosTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        seccional = Seccional.objects.create(ciudad='Reportes JSON')
        sede = Sede.objects.create(nombre='Sede Reportes JSON', seccional=seccional)
        cls.super = Usuario.objects.create(nombre='Super', correo='super.reportes.json@prueba.co',
                                           es_superusuario=True, is_superuser=True, sede=sede, seccional=seccional)
        aula = TipoEspacio.objects.get_or_create(nombre='Aula')[0]
        lab = TipoEspacio.objects.get_or_create(nombre='Laboratorio JSON')[0]
        periodo = PeriodoAcademico.objects.create(nombre='2026-J', fecha_inicio=datetime.date(2026, 1, 1),
                                                  fecha_fin=datetime.date(2027, 12, 31))
        programa = Programa.objects.create(nombre='Programa J',
                                           facultad=Facultad.objects.create(nombre='Fac J', sede=sede))
        grupo = Grupo.objects.create(programa=programa, periodo=periodo, nombre='G J', semestre=1)
        asignatura = Asignatura.objects.create(nombre='Asig J', codigo='J1', creditos=3)
        tipo_actividad = TipoActividad.objects.get_or_create(nombre='Evento')[0]

        def espacio(nombre, tipo, capacidad):
            return EspacioFisico.objects.create(nombre=nombre, sede=sede, tipo=tipo, capacidad=capacidad)

        def clase(esp, dia, inicio, fin, estudiantes=None, estado='aprobado'):
            Horario.objects.create(grupo=grupo, asignatura=asignatura, espacio=esp, dia_semana=dia,
                                   hora_inicio=inicio, hora_fin=fin, cantidad_estudiantes=estudiantes, estado=estado)

        def prestamo(esp, dias, inicio, fin, estado='Aprobado'):
            PrestamoEspacio.objects.bulk_create([PrestamoEspacio(
                espacio=esp, tipo_actividad=tipo_actividad, usuario=cls.super, periodo=periodo,
                fecha=_lunes() + datetime.timedelta(days=dias), hora_inicio=inicio, hora_fin=fin,
                motivo='Prueba', estado=estado,
            )])

        a1 = espacio('A1', aula, 40)
        a2 = espacio('A2', aula, 30)
        espacio('A3 sin uso', aula, 25)
        l1 = espacio('L1', lab, 20)
        extras = [espacio(f'E{i}', aula, 10) for i in range(4)]

        clase(a1, 'Lunes', T(7), T(9), 30)
        clase(a1, 'lunes', T(14), T(17), 20)
        clase(a1, 'Miércoles', T(18), T(21))               # sin cantidad: cuenta 30
        clase(a1, 'Domingo', T(8), T(10), 40)              # el domingo no se recorre
        clase(a2, 'Martes', T(8), T(10), 25, estado='pendiente')
        clase(l1, 'Jueves', T(10), T(13), 15)
        prestamo(l1, 4, T(9), T(11))                       # viernes, sin clase ese día: 30 % de 20
        prestamo(a2, 1, T(15), T(16), estado='Pendiente')  # no cuenta
        prestamo(a1, 7, T(8), T(9))                        # lunes siguiente
        for i, esp in enumerate(extras):
            for k in range(i + 1):
                clase(esp, 'Sábado', T(7 + k), T(8 + k), 5)

    def setUp(self):
        cache.clear()
        self.client = Client(HTTP_HOST='localhost')
        sesion = self.client.session
        sesion['user_id'] = self.super.id
        sesion.save()
        self.client.cookies[settings.SESSION_COOKIE_NAME] = sesion.session_key

    def reporte(self, ruta, **params):
        r = self.client.get(f'/api/espacios/reporte/{ruta}/', params)
        self.assertEqual(r.status_code, 200, r.content[:300])
        return r.json()

    def semana(self, semanas=0):
        lunes = _lunes(semanas)
        return {'periodo': '2025-1', 'semana_inicio': lunes.isoformat(),
                'semana_fin': (lunes + datetime.timedelta(days=5)).isoformat()}

    def test_ocupacion(self):
        self.assertEqual(self.reporte('ocupacion'), {
            **self.semana(),
            'ocupacion_por_jornada': [
                {'jornada': 'Mañana (07:00 - 12:00)', 'ocupacion': 5, 'espacios': 6},
                {'jornada': 'Tarde (14:00 - 18:00)', 'ocupacion': 1, 'espacios': 2},
                {'jornada': 'Noche (18:00 - 21:00)', 'ocupacion': 1, 'espacios': 1},
            ],
            'espacios_mas_usados': [
                {'espacio': 'E3', 'usos': 4, 'ocupacion': 4},
                {'espacio': 'A1', 'usos': 3, 'ocupacion': 8},
                {'espacio': 'E2', 'usos': 3, 'ocupacion': 3},
                {'espacio': 'L1', 'usos': 2, 'ocupacion': 5},
                {'espacio': 'E1', 'usos': 2, 'ocupacion': 2},
            ],
        })

    def test_ocupacion_con_pendientes_y_otra_semana(self):
        cuerpo = self.reporte('ocupacion', estado_horario='pendiente')
        self.assertEqual(cuerpo['espacios_mas_usados'], [
            {'espacio': 'A2', 'usos': 1, 'ocupacion': 2}, {'espacio': 'L1', 'usos': 1, 'ocupacion': 2}])
        cuerpo = self.reporte('ocupacion', semana_offset=1, include_pending='true')
        self.assertEqual(cuerpo['semana_inicio'], _lunes(1).isoformat())
        self.assertEqual(cuerpo['espacios_mas_usados'][:2], [
            {'espacio': 'A1', 'usos': 4, 'ocupacion': 9}, {'espacio': 'E3', 'usos': 4, 'ocupacion': 4}])

    def test_disponibilidad(self):
        cuerpo = self.reporte('disponibilidad')
        self.assertEqual({k: cuerpo[k] for k in ('periodo', 'semana_inicio', 'semana_fin')}, self.semana())
        filas = {f['nombre']: f for f in cuerpo['disponibilidad']}
        self.assertEqual(filas['A1'], {'nombre': 'A1', 'tipo': 'Aula', 'horasDisponibles': 88, 'horasOcupadas': 8,
                                       'porcentajeOcupacion': 8})
        self.assertEqual(filas['L1'], {'nombre': 'L1', 'tipo': 'Laboratorio JSON', 'horasDisponibles': 91,
                                       'horasOcupadas': 5, 'porcentajeOcupacion': 5})
        self.assertEqual(filas['A3 sin uso']['horasDisponibles'], 96)
        self.assertEqual(len(filas), EspacioFisico.objects.count())
        self.assertEqual(cuerpo['resumen'], {'total_disponible': 745, 'total_ocupado': 23, 'promedio_ocupacion': 2})

    def test_capacidad(self):
        cuerpo = self.reporte('capacidad')
        self.assertEqual({k: cuerpo[k] for k in ('periodo', 'semana_inicio', 'semana_fin')}, self.semana())
        self.assertEqual(cuerpo['capacidad'], [
            {'tipo': 'Aula', 'capacidadTotal': 135, 'capacidadUsada': 45, 'porcentaje': 33},
            {'tipo': 'Laboratorio JSON', 'capacidadTotal': 20, 'capacidadUsada': 10, 'porcentaje': 50},
        ])
        cuerpo = self.reporte('capacidad', estadoHorario='todos')
        self.assertEqual(cuerpo['capacidad'][0], {'tipo': 'Aula', 'capacidadTotal': 135, 'capacidadUsada': 70,
                                                  'porcentaje': 51})

    def test_errores(self):
        for ruta in ('ocupacion', 'disponibilidad', 'capacidad'):
            with self.subTest(ruta=ruta):
                r = self.client.get(f'/api/espacios/reporte/{ruta}/', {'semana_offset': 'x'})
                self.assertEqual(r.status_code, 400)
                self.assertTrue(r.json()['error'].startswith('Error de valor:'))
                self.assertEqual(self.client.post(f'/api/espacios/reporte/{ruta}/').status_code, 405)
