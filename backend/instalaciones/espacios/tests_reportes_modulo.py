"""Cálculos de los reportes de espacios: interfaz pública y ayudantes de la semana (caracterización).

Los reportes completos (ocupación, disponibilidad, capacidad y PDF) ya se prueban por la API en `tests_reportes.py`
y `tests_reportes_pdf.py`; aquí se fija lo que usan las vistas y los ayudantes que no se ejercitaban por separado.
"""
import datetime
from unittest import mock

from django.test import SimpleTestCase
from django.utils import timezone

from . import reportes


class InterfazPublicaTests(SimpleTestCase):
    NOMBRES = [
        'DIAS_NOMBRE', 'semana', 'dia_nombre', 'estados_horario', 'normalizar_dia_semana', 'fechas_de_la_semana',
        'preparar_datos', 'detalle_ocupacion_semanal', 'ocupacion_por_jornada', 'espacios_mas_usados',
        'disponibilidad', 'capacidad',
    ]

    def test_los_nombres_que_usan_las_vistas_siguen_disponibles(self):
        self.assertEqual([n for n in self.NOMBRES if not hasattr(reportes, n)], [])


class AyudantesDeLaSemanaTests(SimpleTestCase):
    HOY = timezone.make_aware(datetime.datetime(2026, 11, 11, 15, 30))  # miércoles

    def test_semana_va_de_lunes_a_sabado_y_se_desplaza(self):
        with mock.patch('django.utils.timezone.now', return_value=self.HOY):
            self.assertEqual(reportes.semana(0), (datetime.date(2026, 11, 9), datetime.date(2026, 11, 14)))
            self.assertEqual(reportes.semana(1), (datetime.date(2026, 11, 16), datetime.date(2026, 11, 21)))
            self.assertEqual(reportes.semana(-1), (datetime.date(2026, 11, 2), datetime.date(2026, 11, 7)))

    def test_fechas_de_la_semana(self):
        fechas = list(reportes.fechas_de_la_semana(datetime.date(2026, 11, 9), datetime.date(2026, 11, 14)))
        self.assertEqual([f.day for f in fechas], [9, 10, 11, 12, 13, 14])

    def test_dia_nombre_en_espanol(self):
        self.assertEqual(reportes.dia_nombre(datetime.date(2026, 11, 9)), 'Lunes')
        self.assertEqual(reportes.dia_nombre(datetime.date(2026, 11, 14)), 'Sábado')
        self.assertEqual(reportes.dia_nombre(datetime.date(2026, 11, 15)), '')
        self.assertEqual(reportes.DIAS_NOMBRE['Wednesday'], 'Miércoles')

    def test_estados_de_horario(self):
        self.assertEqual(reportes.estados_horario(), ['aprobado'])
        self.assertEqual(reportes.estados_horario('pendiente'), ['pendiente'])
        self.assertEqual(reportes.estados_horario('todos'), ['aprobado', 'pendiente'])
        self.assertEqual(reportes.estados_horario('ALL'), ['aprobado', 'pendiente'])
        self.assertEqual(reportes.estados_horario(True), ['aprobado', 'pendiente'])
        self.assertEqual(reportes.estados_horario(False), ['aprobado'])
        self.assertEqual(reportes.estados_horario('otro'), ['aprobado'])
        self.assertEqual(reportes.estados_horario('aprobado', include_pending=True), ['aprobado', 'pendiente'])

    def test_normalizar_dia_semana_quita_tildes_y_mayusculas(self):
        self.assertEqual(reportes.normalizar_dia_semana(' Miércoles '), 'miercoles')
        self.assertEqual(reportes.normalizar_dia_semana('SÁBADO'), 'sabado')
        self.assertEqual(reportes.normalizar_dia_semana(None), '')
