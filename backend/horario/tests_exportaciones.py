"""Exportaciones de horarios a PDF y Excel: caracterización del comportamiento actual.

Reciben en el cuerpo la lista de horarios que muestra el Centro de Horarios y no consultan la base.
- Por programa: una página (PDF) u hoja (Excel) por «grupo - programa»; la celda dice «Asignatura / DOCENTE» y el salón.
- Por docente: una página u hoja por docente, con su facultad; la celda dice «Asignatura / GRUPO» y el salón.
- Solo se exportan los horarios aprobados, salvo que se pidan los pendientes o todos.
"""
import io
import json

from django.conf import settings
from django.test import Client, TestCase
from openpyxl import load_workbook
from pypdf import PdfReader

from usuarios.models import Rol, Usuario

AZUL = '00DBEAFE'
ROJO = '008B0000'
GRIS = '00F3F4F6'


def _horario(grupo, programa, asignatura, docente, espacio, dia, inicio, fin, estado='aprobado'):
    return {'grupo_nombre': grupo, 'programa_nombre': programa, 'asignatura_nombre': asignatura,
            'docente_nombre': docente, 'espacio_nombre': espacio, 'dia_semana': dia,
            'hora_inicio': inicio, 'hora_fin': fin, 'estado': estado}


HORARIOS = [
    _horario('I SISTEMAS GA', 'Ingeniería de Sistemas', 'calculo i', 'Ana Pérez', 'SALON 101', 'Lunes', '07:00:00', '09:00:00'),
    _horario('I SISTEMAS GA', 'Ingeniería de Sistemas', 'programación ii', 'Sin asignar', 'LAB 2', 'Miércoles', '10:00', '11:00'),
    _horario('II DERECHO', 'Derecho', 'derecho romano', 'Ana Pérez', '', 'sábado', '18:00:00', '20:00:00'),
    _horario('I SISTEMAS GA', 'Ingeniería de Sistemas', 'ética', 'Luis Gómez', 'SALON 102', 'Viernes', '14:00', '15:00', 'pendiente'),
]


def _texto_paginas(contenido):
    return [p.extract_text() for p in PdfReader(io.BytesIO(contenido)).pages]


class ExportacionesHorariosTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        rol = Rol.objects.get_or_create(nombre='admin_global')[0]
        cls.usuario = Usuario.objects.create_user(correo='planeacion@prueba.test', nombre='Planeación', rol=rol,
                                                  es_superusuario=True)

    def setUp(self):
        self.client = Client()
        sesion = self.client.session
        sesion['user_id'] = self.usuario.id
        sesion.save()
        self.client.cookies[settings.SESSION_COOKIE_NAME] = sesion.session_key

    def exportar(self, ruta, horarios=HORARIOS, **extra):
        return self.client.post(f'/api/horarios/{ruta}/', json.dumps({'horarios': horarios, **extra}),
                                content_type='application/json')

    # ------------------------------------------------ validaciones comunes
    def test_sin_horarios_o_sin_horarios_exportables_responde_400(self):
        for ruta in ('exportar-pdf', 'exportar-excel', 'exportar-pdf-docente', 'exportar-excel-docente'):
            with self.subTest(ruta=ruta):
                r = self.exportar(ruta, horarios=[])
                self.assertEqual((r.status_code, r.json()), (400, {'error': 'No se proporcionaron horarios'}))
                r = self.exportar(ruta, horarios=[HORARIOS[3]])
                self.assertEqual((r.status_code, r.json()), (400, {'error': 'No hay horarios para exportar'}))

    def test_los_pendientes_se_exportan_si_se_piden(self):
        solo_pendiente = [HORARIOS[3]]
        for extra in ({'estado_horario': 'pendiente'}, {'estadoHorario': 'todos'}, {'include_pending': True},
                      {'includePending': True}):
            with self.subTest(extra=extra):
                self.assertEqual(self.exportar('exportar-pdf', horarios=solo_pendiente, **extra).status_code, 200)
        # «pendiente» exporta solo los pendientes
        r = self.exportar('exportar-excel', estado_horario='pendiente')
        self.assertEqual(load_workbook(io.BytesIO(r.content)).sheetnames, ['I SISTEMAS GA - Ingeniería de S'])

    # ------------------------------------------------ por programa
    def test_pdf_por_programa(self):
        r = self.exportar('exportar-pdf')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r['Content-Type'], 'application/pdf')
        self.assertEqual(r['Content-Disposition'], 'attachment; filename="horarios_centro.pdf"')
        paginas = _texto_paginas(r.content)
        self.assertEqual(len(paginas), 2)
        self.assertIn('Grupo: I SISTEMAS GA - Ingeniería de Sistemas', paginas[0])
        self.assertIn('Calculo I / ANA PÉREZ', paginas[0])
        self.assertIn('Programación II', paginas[0])
        self.assertNotIn('SIN ASIGNAR', paginas[0])
        self.assertNotIn('Ética', paginas[0])
        self.assertIn('Grupo: II DERECHO - Derecho', paginas[1])
        self.assertIn('Derecho Romano / ANA PÉREZ', paginas[1])
        for texto in ('06:00-07:00', '20:00-21:00', 'Lunes', 'Domingo'):
            self.assertIn(texto, paginas[0])
        self.assertNotIn('21:00-22:00', paginas[0])

    def test_excel_por_programa(self):
        r = self.exportar('exportar-excel')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.assertEqual(r['Content-Disposition'], 'attachment; filename="horarios_centro.xlsx"')
        libro = load_workbook(io.BytesIO(r.content))
        self.assertEqual(libro.sheetnames, ['I SISTEMAS GA - Ingeniería de S', 'II DERECHO - Derecho'])
        hoja = libro['I SISTEMAS GA - Ingeniería de S']
        self.assertEqual([c.value for c in hoja[1]], ['Hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'])
        self.assertEqual(hoja.max_row, 16)
        self.assertEqual(hoja['A2'].value, '06:00-07:00')
        self.assertEqual(hoja['A16'].value, '20:00-21:00')
        self.assertEqual((hoja['B3'].value, hoja['B4'].value), ('Calculo I / ANA PÉREZ\nSALON 101',) * 2)
        self.assertIsNone(hoja['B5'].value)
        self.assertEqual(hoja['D6'].value, 'Programación II\nLAB 2')
        self.assertEqual(hoja['B3'].fill.start_color.rgb, AZUL)
        self.assertEqual(hoja['C3'].fill.fill_type, None)
        self.assertEqual(hoja['A1'].fill.start_color.rgb, ROJO)
        self.assertTrue(hoja['A1'].font.bold)
        self.assertEqual(hoja['A2'].fill.fill_type, None)
        self.assertEqual(hoja.column_dimensions['A'].width, 14)
        self.assertEqual(hoja.column_dimensions['H'].width, 25)
        self.assertEqual(hoja.row_dimensions[2].height, 75)
        derecho = libro['II DERECHO - Derecho']
        self.assertEqual((derecho['G14'].value, derecho['G15'].value), ('Derecho Romano / ANA PÉREZ',) * 2)

    # ------------------------------------------------ por docente
    def test_pdf_por_docente(self):
        r = self.exportar('exportar-pdf-docente')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r['Content-Disposition'], 'attachment; filename="horarios_docentes.pdf"')
        paginas = _texto_paginas(r.content)
        self.assertEqual(len(paginas), 2)
        self.assertIn('Docente: Ana Pérez', paginas[0])
        self.assertIn('Facultad: Ingeniería de Sistemas', paginas[0])
        self.assertIn('Calculo I / I SISTEMAS GA', paginas[0])
        self.assertIn('Derecho Romano / II DERECHO', paginas[0])
        self.assertIn('Docente: Sin asignar', paginas[1])
        self.assertIn('Programación II / I SISTEMAS GA', paginas[1])

    def test_excel_por_docente(self):
        r = self.exportar('exportar-excel-docente')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r['Content-Disposition'], 'attachment; filename="horarios_docentes.xlsx"')
        libro = load_workbook(io.BytesIO(r.content))
        self.assertEqual(libro.sheetnames, ['Ana Pérez', 'Sin asignar'])
        hoja = libro['Ana Pérez']
        self.assertEqual((hoja['A1'].value, hoja['A2'].value, hoja['A3'].value),
                         ('Docente: Ana Pérez', 'Facultad: Ingeniería de Sistemas', None))
        self.assertTrue(hoja['A1'].font.bold)
        self.assertEqual([c.value for c in hoja[4]][:3], ['Hora', 'Lunes', 'Martes'])
        self.assertEqual(hoja['A4'].fill.start_color.rgb, ROJO)
        self.assertEqual((hoja['A5'].value, hoja['A5'].fill.start_color.rgb), ('06:00-07:00', GRIS))
        self.assertEqual((hoja['B6'].value, hoja['B7'].value), ('Calculo I / I SISTEMAS GA - SALON 101',) * 2)
        self.assertEqual(hoja['B6'].fill.start_color.rgb, AZUL)
        self.assertEqual(hoja['G17'].value, 'Derecho Romano / II DERECHO')
        self.assertIsNone(hoja['C6'].value)
        self.assertEqual(hoja['C6'].border.left.style, 'thin')
        self.assertEqual(hoja.max_row, 19)
        self.assertEqual(hoja.row_dimensions[1].height, 25)
        self.assertEqual(hoja.row_dimensions[4].height, 75)
        self.assertEqual(hoja.column_dimensions['B'].width, 25)

    def test_horas_sin_minutos_e_invalidas(self):
        raros = [_horario('G', 'P', 'algebra', 'Ana', 'S1', 'Martes', '7', '9'),
                 _horario('G', 'P', 'fisica', 'Ana', 'S2', 'Jueves', 'siete', 'nueve'),
                 _horario('G', 'P', 'quimica', 'Ana', 'S3', 'Feriado', '07:00', '08:00')]
        hoja = load_workbook(io.BytesIO(self.exportar('exportar-excel', horarios=raros).content))['G - P']
        self.assertEqual([c.value for c in hoja['C'][1:]], [None, 'Algebra / ANA\nS1', 'Algebra / ANA\nS1'] + [None] * 12)
        # Una hora que no es número o un día desconocido no aparecen en la cuadrícula
        self.assertEqual([c.value for c in hoja['E'][1:]], [None] * 15)
        self.assertNotIn('Quimica', ''.join(str(c.value) for fila in hoja.iter_rows() for c in fila))

    # ------------------------------------------------ horario individual
    def test_horario_individual_no_responde_por_get_ni_por_post(self):
        for ruta in ('exportar-pdf-usuario', 'exportar-excel-usuario'):
            with self.subTest(ruta=ruta):
                self.assertEqual(self.client.get(f'/api/horarios/{ruta}/?usuario_id={self.usuario.id}').status_code, 405)
                r = self.client.post(f'/api/horarios/{ruta}/?usuario_id={self.usuario.id}')
                self.assertEqual((r.status_code, r.json()), (405, {'error': 'Método no permitido'}))
