"""Descarga de «Mi horario» en PDF y Excel (GET /api/horarios/exportar-{pdf,excel}-usuario/?usuario_id=…).

- Exporta lo mismo que muestra la pantalla Mi horario: al docente, sus clases aprobadas; al estudiante, las clases
  en que está inscrito. Se decide por el rol, como lo hace el frontend.
- Cada persona descarga su propio horario; un administrador, el de cualquiera.
- El docente recibe una página/hoja con todas sus clases («Asignatura / GRUPO»); el estudiante, una por grupo
  («Asignatura / DOCENTE»).
"""
import datetime
import io

from django.conf import settings
from django.test import Client, TestCase
from openpyxl import load_workbook
from pypdf import PdfReader

from asignaturas.models import Asignatura
from espacios.models import EspacioFisico, TipoEspacio
from facultades.models import Facultad
from grupos.models import Grupo
from periodos.models import PeriodoAcademico
from programas.models import Programa
from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario

from .models import Horario, HorarioEstudiante

PDF = '/api/horarios/exportar-pdf-usuario/'
EXCEL = '/api/horarios/exportar-excel-usuario/'


def _texto(contenido):
    return '\n'.join(p.extract_text() for p in PdfReader(io.BytesIO(contenido)).pages)


class DescargaMiHorarioTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        seccional = Seccional.objects.get_or_create(ciudad='Barranquilla')[0]
        sede = Sede.objects.create(nombre='Sede Prueba', seccional=seccional)
        facultad = Facultad.objects.create(nombre='Ingeniería', sede=sede)
        programa = Programa.objects.create(facultad=facultad, nombre='Ingeniería de Sistemas')
        periodo = PeriodoAcademico.objects.create(nombre='2026-2', fecha_inicio=datetime.date(2026, 7, 1),
                                                  fecha_fin=datetime.date(2026, 12, 15))
        g1 = Grupo.objects.create(programa=programa, periodo=periodo, nombre='I SISTEMAS GA', semestre=1)
        g2 = Grupo.objects.create(programa=programa, periodo=periodo, nombre='II SISTEMAS GA', semestre=2)
        calculo = Asignatura.objects.create(nombre='calculo i', codigo='CAL-1', creditos=3)
        fisica = Asignatura.objects.create(nombre='fisica', codigo='FIS-1', creditos=3)
        espacio = EspacioFisico.objects.create(nombre='SALON 101', sede=sede,
                                               tipo=TipoEspacio.objects.create(nombre='Aula'), capacidad=30)

        cls.docente = Usuario.objects.create_user(correo='docente@prueba.test', nombre='Ana Pérez',
                                                  rol=Rol.objects.get_or_create(nombre='docente')[0], sede=sede)
        cls.estudiante = Usuario.objects.create_user(correo='estudiante@prueba.test', nombre='Luis',
                                                     rol=Rol.objects.get_or_create(nombre='estudiante')[0], sede=sede)
        cls.otro_docente = Usuario.objects.create_user(correo='otro@prueba.test', nombre='Otro',
                                                       rol=Rol.objects.get_or_create(nombre='docente')[0], sede=sede)
        cls.admin = Usuario.objects.create_user(correo='admin@prueba.test', nombre='Admin',
                                                rol=Rol.objects.get_or_create(nombre='admin')[0], es_superusuario=True)

        def clase(grupo, asignatura, dia, inicio, fin, estado='aprobado', docente=cls.docente):
            return Horario.objects.create(grupo=grupo, asignatura=asignatura, espacio=espacio, docente=docente,
                                          dia_semana=dia, hora_inicio=datetime.time(inicio), hora_fin=datetime.time(fin),
                                          estado=estado)

        lunes = clase(g1, calculo, 'lunes', 7, 9)
        miercoles = clase(g2, fisica, 'miercoles', 10, 12)
        clase(g1, fisica, 'viernes', 14, 16, estado='pendiente')
        for h in (lunes, miercoles):
            HorarioEstudiante.objects.create(horario=h, estudiante=cls.estudiante)

    def entrar(self, usuario):
        self.client = Client()
        sesion = self.client.session
        sesion['user_id'] = usuario.id
        sesion.save()
        self.client.cookies[settings.SESSION_COOKIE_NAME] = sesion.session_key

    def descargar(self, ruta, usuario):
        return self.client.get(ruta, {'usuario_id': usuario.id})

    # ------------------------------------------------ docente
    def test_el_docente_descarga_su_horario_en_pdf(self):
        self.entrar(self.docente)
        r = self.descargar(PDF, self.docente)
        self.assertEqual(r.status_code, 200, r.content[:200])
        self.assertEqual(r['Content-Type'], 'application/pdf')
        self.assertEqual(r['Content-Disposition'], 'attachment; filename="mi_horario.pdf"')
        paginas = PdfReader(io.BytesIO(r.content)).pages
        self.assertEqual(len(paginas), 1)
        texto = _texto(r.content)
        self.assertIn('Docente: Ana Pérez', texto)
        self.assertIn('Calculo I / I SISTEMAS GA', texto)
        self.assertIn('Fisica / II SISTEMAS GA', texto)
        self.assertNotIn('Fisica / I SISTEMAS GA', texto)  # la clase pendiente no se exporta

    def test_el_docente_descarga_su_horario_en_excel(self):
        self.entrar(self.docente)
        r = self.descargar(EXCEL, self.docente)
        self.assertEqual(r.status_code, 200, r.content[:200])
        self.assertEqual(r['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.assertEqual(r['Content-Disposition'], 'attachment; filename="mi_horario.xlsx"')
        libro = load_workbook(io.BytesIO(r.content))
        self.assertEqual(libro.sheetnames, ['Ana Pérez'])
        hoja = libro['Ana Pérez']
        self.assertEqual(hoja['A1'].value, 'Docente: Ana Pérez')
        self.assertEqual((hoja['B6'].value, hoja['B7'].value), ('Calculo I / I SISTEMAS GA - SALON 101',) * 2)
        self.assertEqual(hoja['D9'].value, 'Fisica / II SISTEMAS GA - SALON 101')
        self.assertIsNone(hoja['F13'].value)

    # ------------------------------------------------ estudiante
    def test_el_estudiante_descarga_las_clases_en_que_esta_inscrito(self):
        self.entrar(self.estudiante)
        r = self.descargar(PDF, self.estudiante)
        self.assertEqual(r.status_code, 200, r.content[:200])
        texto = _texto(r.content)
        self.assertIn('Grupo: I SISTEMAS GA - Ingeniería de Sistemas', texto)
        self.assertIn('Grupo: II SISTEMAS GA - Ingeniería de Sistemas', texto)
        self.assertIn('Calculo I / ANA PÉREZ', texto)
        r = self.descargar(EXCEL, self.estudiante)
        self.assertEqual(r.status_code, 200)
        libro = load_workbook(io.BytesIO(r.content))
        self.assertEqual(libro.sheetnames, ['I SISTEMAS GA - Ingeniería de S', 'II SISTEMAS GA - Ingeniería de '])
        self.assertEqual(libro.worksheets[0]['B3'].value, 'Calculo I / ANA PÉREZ\nSALON 101')

    # ------------------------------------------------ permisos y errores
    def test_no_se_descarga_el_horario_de_otra_persona(self):
        self.entrar(self.otro_docente)
        for ruta in (PDF, EXCEL):
            r = self.descargar(ruta, self.docente)
            self.assertEqual((r.status_code, r.json()), (403, {'error': 'No autorizado'}))

    def test_el_administrador_descarga_el_de_cualquiera(self):
        self.entrar(self.admin)
        for ruta in (PDF, EXCEL):
            self.assertEqual(self.descargar(ruta, self.docente).status_code, 200)
            self.assertEqual(self.descargar(ruta, self.estudiante).status_code, 200)

    def test_sin_clases_responde_400(self):
        self.entrar(self.otro_docente)
        for ruta in (PDF, EXCEL):
            r = self.descargar(ruta, self.otro_docente)
            self.assertEqual((r.status_code, r.json()), (400, {'error': 'No hay horarios registrados'}))

    def test_datos_faltantes_usuario_inexistente_y_sin_sesion(self):
        self.entrar(self.admin)
        for ruta in (PDF, EXCEL):
            r = self.client.get(ruta)
            self.assertEqual((r.status_code, r.json()), (400, {'error': 'usuario_id es requerido'}))
            r = self.client.get(ruta, {'usuario_id': 999999})
            self.assertEqual((r.status_code, r.json()), (404, {'error': 'Usuario no encontrado'}))
            self.assertNotEqual(Client().get(ruta, {'usuario_id': self.docente.id}).status_code, 200)

    def test_post_no_esta_permitido(self):
        self.entrar(self.docente)
        for ruta in (PDF, EXCEL):
            self.assertEqual(self.client.post(f'{ruta}?usuario_id={self.docente.id}').status_code, 405)
