"""Reportes PDF de espacios: caracterización del contenido actual.

- Ocupación semanal (/api/espacios/ocupacion/pdf/): resumen, detalle por espacio y, en otra página, el top 10.
- Ocupación (/reporte/ocupacion/pdf/): ocupación por jornada y espacios más utilizados; acepta filtrar por nombres.
- Disponibilidad (/reporte/disponibilidad/pdf/): totales y horas disponibles/ocupadas por espacio.
- Capacidad (/reporte/capacidad/pdf/): barras por tipo de espacio y leyenda.
Todos responden por POST con la semana pedida (semana_offset) y descargan un PDF con la fecha del lunes en el nombre.
"""
import datetime
import io
import json

from django.conf import settings
from django.core.cache import cache
from django.test import Client, TestCase
from django.utils import timezone
from pypdf import PdfReader

from academico.asignaturas.models import Asignatura
from academico.facultades.models import Facultad
from academico.grupos.models import Grupo
from academico.horario.models import Horario
from academico.periodos.models import PeriodoAcademico
from academico.programas.models import Programa
from academico.sedes.models import Seccional, Sede
from identidad.usuarios.models import Usuario

from ..models import EspacioFisico, TipoEspacio

T = datetime.time
OCUPACION_SEMANAL = '/api/espacios/ocupacion/pdf/'
OCUPACION = '/api/espacios/reporte/ocupacion/pdf/'
DISPONIBILIDAD = '/api/espacios/reporte/disponibilidad/pdf/'
CAPACIDAD = '/api/espacios/reporte/capacidad/pdf/'


def _lunes(semanas=0):
    hoy = timezone.now().date()
    return hoy - datetime.timedelta(days=hoy.weekday()) + datetime.timedelta(weeks=semanas)


class ReportesPdfEspaciosTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        seccional = Seccional.objects.create(ciudad='Reportes')
        sede = Sede.objects.create(nombre='Sede Reportes', seccional=seccional)
        cls.super = Usuario.objects.create(nombre='Super', correo='super.reportes@prueba.co', es_superusuario=True,
                                           is_superuser=True, sede=sede, seccional=seccional)
        aula = TipoEspacio.objects.get_or_create(nombre='Aula')[0]
        cls.lab = TipoEspacio.objects.get_or_create(nombre='Laboratorio Reportes')[0]
        periodo = PeriodoAcademico.objects.create(nombre='2026-R', fecha_inicio=datetime.date(2026, 1, 1),
                                                  fecha_fin=datetime.date(2027, 12, 31))
        programa = Programa.objects.create(nombre='Programa R',
                                           facultad=Facultad.objects.create(nombre='Fac R', sede=sede))
        grupo = Grupo.objects.create(programa=programa, periodo=periodo, nombre='G R', semestre=1)
        asignatura = Asignatura.objects.create(nombre='Asig R', codigo='R1', creditos=3)

        def espacio(nombre, tipo, capacidad, ubicacion=None):
            return EspacioFisico.objects.create(nombre=nombre, sede=sede, tipo=tipo, capacidad=capacidad,
                                                ubicacion=ubicacion)

        def clase(esp, dia, inicio, fin, estudiantes, estado='aprobado'):
            Horario.objects.create(grupo=grupo, asignatura=asignatura, espacio=esp, dia_semana=dia,
                                   hora_inicio=inicio, hora_fin=fin, cantidad_estudiantes=estudiantes, estado=estado)

        a101 = espacio('Aula 101', aula, 40, 'Bloque A-101')
        a102 = espacio('Aula 102', aula, 30)
        lab = espacio('Lab 1', cls.lab, 20, 'Bloque L')
        clase(a101, 'Lunes', T(7), T(9), 30)
        clase(a101, 'Miércoles', T(14), T(17), 20)
        clase(a101, 'Viernes', T(18), T(20), 40)
        clase(lab, 'Martes', T(8), T(12), 10)
        clase(a102, 'Jueves', T(8), T(10), 25, estado='pendiente')

    def setUp(self):
        cache.clear()
        self.client = Client(HTTP_HOST='localhost')
        sesion = self.client.session
        sesion['user_id'] = self.super.id
        sesion.save()
        self.client.cookies[settings.SESSION_COOKIE_NAME] = sesion.session_key

    def pdf(self, ruta, **datos):
        r = self.client.post(ruta, json.dumps(datos), content_type='application/json')
        cuerpo = b''.join(r.streaming_content) if r.streaming else r.content
        self.assertEqual(r.status_code, 200, cuerpo[:300])
        self.assertEqual(r['Content-Type'], 'application/pdf')
        paginas = [[linea.strip() for linea in p.extract_text().splitlines() if linea.strip()]
                   for p in PdfReader(io.BytesIO(cuerpo)).pages]
        return r, paginas

    def assertContiene(self, lineas, esperado):
        """Las líneas esperadas aparecen seguidas en la página."""
        n = len(esperado)
        self.assertTrue(any(lineas[i:i + n] == esperado for i in range(len(lineas) - n + 1)),
                        f'{esperado} no está en {lineas}')

    def semana(self, semanas=0):
        lunes = _lunes(semanas)
        return lunes, f'{lunes:%d/%m/%Y} - {lunes + datetime.timedelta(days=5):%d/%m/%Y}'

    # ------------------------------------------------ ocupación semanal
    def test_ocupacion_semanal(self):
        lunes, semana = self.semana()
        r, (detalle, top) = self.pdf(OCUPACION_SEMANAL)
        self.assertEqual(r['Content-Disposition'], f'attachment; filename="ocupacion-semanal-{lunes.isoformat()}.pdf"')
        self.assertEqual(detalle[:2], ['Reporte de Ocupación Semanal de Espacios', f'Período: {semana} - Semana: +0'])
        self.assertContiene(detalle, ['Promedio ocupación', 'Horas ocupadas', 'Horas tot. disponibles', 'Sobreocupados',
                                      'Subutilizados', '3.8%', '11h', '288h', '0', '2'])
        self.assertContiene(detalle, ['Espacio', 'Tipo', 'Edificio', 'Capacidad', 'Horas', 'Ocupación', 'Jornadas'])
        self.assertContiene(detalle, ['Aula 101', 'Aula', 'Bloque A', '40', '7.0 / 96h', '7.3%',
                                      'M: 5.6%', 'T: 8.3%', 'N: 8.3%'])
        self.assertContiene(detalle, ['Aula 102', 'Aula', 'N/A', '30', '0.0 / 96h', '0.0%',
                                      'M: 0.0%', 'T: 0.0%', 'N: 0.0%'])
        self.assertContiene(detalle, ['Lab 1', 'Laboratorio Reportes', 'Bloque L', '20', '4.0 / 96h', '4.2%',
                                      'M: 11.1%', 'T: 0.0%', 'N: 0.0%'])
        # El top 10 va en otra página, de mayor a menor ocupación
        self.assertEqual(top, ['Top 10 espacios por ocupación', 'Aula 101', 'Lab 1', 'Aula 102',
                               '0', '20', '40', '60', '80', '100'])

    def test_ocupacion_semanal_de_otra_semana_y_por_tipo(self):
        lunes, semana = self.semana(1)
        r, paginas = self.pdf(OCUPACION_SEMANAL, semana_offset=1, tipo_espacio_id=self.lab.id)
        self.assertEqual(r['Content-Disposition'], f'attachment; filename="ocupacion-semanal-{lunes.isoformat()}.pdf"')
        self.assertEqual(paginas[0][1], f'Período: {semana} - Semana: +1')
        self.assertNotIn('Aula 101', paginas[0])
        self.assertEqual(paginas[1][:2], ['Top 10 espacios por ocupación', 'Lab 1'])

    # ------------------------------------------------ ocupación
    def test_reporte_de_ocupacion(self):
        lunes, semana = self.semana()
        r, paginas = self.pdf(OCUPACION)
        self.assertEqual(r['Content-Disposition'], f'attachment; filename="reporte-ocupacion-{lunes.isoformat()}.pdf"')
        self.assertEqual(len(paginas), 1)
        self.assertEqual(paginas[0], [
            'Reporte: Ocupación de Espacios', f'Semana: {semana}',
            'Ocupación por Jornada - Semana Actual', 'Jornada', 'Ocupación', 'Espacios',
            'Mañana (07:00 - 12:00)', '5%', '2', 'Tarde (14:00 - 18:00)', '2%', '1', 'Noche (18:00 - 21:00)', '2%', '1',
            'Espacios Más Utilizados', '#', 'Espacio', 'Usos', 'Ocupación',
            '1', 'Aula 101', '3', '7%', '2', 'Lab 1', '1', '4%', 'Generado por Benji',
        ])

    def test_reporte_de_ocupacion_con_pendientes_y_filtros(self):
        _, (pagina,) = self.pdf(OCUPACION, estado_horario='pendiente')
        self.assertContiene(pagina, ['Mañana (07:00 - 12:00)', '1%', '1', 'Tarde (14:00 - 18:00)', '0%', '0'])
        self.assertContiene(pagina, ['Usos', 'Ocupación', '1', 'Aula 102', '1', '2%', 'Generado por Benji'])
        for datos in ({'tipo_espacio_id': self.lab.id}, {'espacios': ['Lab 1']}):
            _, (pagina,) = self.pdf(OCUPACION, **datos)
            self.assertContiene(pagina, ['Mañana (07:00 - 12:00)', '11%', '1'])
            self.assertContiene(pagina, ['Usos', 'Ocupación', '1', 'Lab 1', '1', '4%', 'Generado por Benji'])
        # Los nombres de espacios tienen prioridad sobre el tipo
        _, (pagina,) = self.pdf(OCUPACION, espacios=['Aula 101'], tipo_espacio_id=self.lab.id)
        self.assertContiene(pagina, ['Usos', 'Ocupación', '1', 'Aula 101', '3', '7%', 'Generado por Benji'])

    # ------------------------------------------------ disponibilidad
    def test_reporte_de_disponibilidad(self):
        lunes, semana = self.semana()
        r, paginas = self.pdf(DISPONIBILIDAD)
        self.assertEqual(r['Content-Disposition'],
                         f'attachment; filename="reporte-disponibilidad-{lunes.isoformat()}.pdf"')
        self.assertEqual(paginas, [[
            'Reporte: Disponibilidad General de Espacios', f'Semana: {semana}',
            'Total disponible', 'Total ocupado', 'Promedio ocupación', '277h', '11h', '3%',
            'Espacio', 'Tipo', 'Disponible', 'Ocupado', 'Ocupación',
            'Aula 101', 'Aula', '89h', '7h', '7%', 'Aula 102', 'Aula', '96h', '0h', '0%',
            'Lab 1', 'Laboratorio Reportes', '92h', '4h', '4%',
        ]])

    # ------------------------------------------------ capacidad
    def test_reporte_de_capacidad(self):
        lunes, semana = self.semana()
        r, paginas = self.pdf(CAPACIDAD)
        self.assertEqual(r['Content-Disposition'], f'attachment; filename="reporte-capacidad-{lunes.isoformat()}.pdf"')
        leyenda = ['Leyenda de Porcentajes:', 'Alta', 'Media', 'Baja', 'Alta (>75%)', '■ Media (40-75%)', 'Baja (<40%)']
        self.assertEqual(paginas, [[
            'Reporte: Capacidad Utilizada', f'Semana: {semana}', 'Capacidad Utilizada por Tipo de Espacio',
            'Aula', '42%', 'Laboratorio Reportes', '50%', *leyenda,
        ]])
        _, (pagina,) = self.pdf(CAPACIDAD, estado_horario='todos')
        self.assertContiene(pagina, ['Aula', '78%', 'Laboratorio Reportes', '50%'])

    # ------------------------------------------------ errores
    def test_solo_post_y_semana_invalida(self):
        for ruta in (OCUPACION_SEMANAL, OCUPACION, DISPONIBILIDAD, CAPACIDAD):
            with self.subTest(ruta=ruta):
                self.assertEqual(self.client.get(ruta).status_code, 405)
                r = self.client.post(ruta, json.dumps({'semana_offset': 'x'}), content_type='application/json')
                self.assertEqual(r.status_code, 500)
                self.assertIn('error', r.json())
