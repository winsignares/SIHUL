"""Consulta de horarios por periodo: cada seccional ve solo los suyos; el público, solo aprobados."""
import datetime
import json

from django.conf import settings
from django.test import Client, TestCase

from academico.asignaturas.models import Asignatura
from instalaciones.espacios.models import EspacioFisico, TipoEspacio
from academico.facultades.models import Facultad
from academico.grupos.models import Grupo
from academico.periodos.models import PeriodoAcademico
from academico.programas.models import Programa
from academico.sedes.models import Seccional, Sede
from identidad.usuarios.models import Rol, Usuario

from .models import Horario

H = {'HTTP_HOST': 'localhost'}


def _cliente(usuario=None):
    c = Client()
    if usuario is not None:
        sesion = c.session
        sesion['user_id'] = usuario.id
        sesion.save()
        c.cookies[settings.SESSION_COOKIE_NAME] = sesion.session_key
    return c


class HorariosPorPeriodoPorSeccionalTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.periodo = PeriodoAcademico.objects.create(
            nombre='2026-2', fecha_inicio=datetime.date(2026, 7, 1), fecha_fin=datetime.date(2026, 12, 31))
        asignatura = Asignatura.objects.create(nombre='Cálculo', codigo='C1', creditos=3)
        tipo = TipoEspacio.objects.create(nombre='Aula')
        rol_admin = Rol.objects.get_or_create(nombre='admin')[0]
        cls.horarios = {}
        cls.admins = {}
        for ciudad in ('Barranquilla', 'Cali'):
            seccional = Seccional.objects.create(ciudad=ciudad)
            sede = Sede.objects.create(nombre=f'Sede {ciudad}', seccional=seccional)
            programa = Programa.objects.create(
                nombre=f'Programa {ciudad}', facultad=Facultad.objects.create(nombre=f'Fac {ciudad}', sede=sede))
            grupo = Grupo.objects.create(programa=programa, periodo=cls.periodo, nombre=f'G {ciudad}', semestre=1)
            espacio = EspacioFisico.objects.create(nombre=f'A {ciudad}', sede=sede, tipo=tipo, capacidad=30)
            base = dict(grupo=grupo, asignatura=asignatura, hora_inicio=datetime.time(7), hora_fin=datetime.time(9))
            cls.horarios[ciudad] = {
                'aprobado': Horario.objects.create(espacio=espacio, dia_semana='lunes', estado='aprobado', **base),
                'pendiente': Horario.objects.create(espacio=espacio, dia_semana='martes', estado='pendiente', **base),
                'sin_espacio': Horario.objects.create(espacio=None, dia_semana='jueves', estado='pendiente', **base),
            }
            cls.admins[ciudad] = Usuario.objects.create_user(
                correo=f'admin.{ciudad.lower()}@prueba.test', nombre=f'Admin {ciudad}', rol=rol_admin, sede=sede)
            cls.admins[ciudad].refresh_from_db()
            cls.seccional_cali = seccional
        cls.general = Usuario.objects.create_user(
            correo='general@prueba.test', nombre='General', rol=rol_admin, es_superusuario=True)

    def _ids(self, c, **params):
        r = c.get('/api/horarios/por-periodo/', {'periodo_id': self.periodo.id, 'estados[]': ['aprobado', 'pendiente'], **params}, **H)
        self.assertEqual(r.status_code, 200, r.content)
        return {h['id'] for h in json.loads(r.content)['horarios']}

    def test_cada_seccional_ve_solo_sus_horarios_incluidos_los_que_aun_no_tienen_espacio(self):
        ids = self._ids(_cliente(self.admins['Barranquilla']))
        propios = {h.id for h in self.horarios['Barranquilla'].values()}
        self.assertEqual(ids, propios)

    def test_otra_seccional_no_descubre_pendientes_ajenos(self):
        ids = self._ids(_cliente(self.admins['Cali']))
        self.assertTrue(ids.isdisjoint({h.id for h in self.horarios['Barranquilla'].values()}))

    def test_el_administrador_general_ve_todas(self):
        ids = self._ids(_cliente(self.general))
        self.assertEqual(len(ids), 6)

    def test_el_publico_ve_solo_aprobados_de_la_seccional_que_elige(self):
        publico = Client(HTTP_X_SECCIONAL_PUBLICA=str(self.seccional_cali.id))
        self.assertEqual(self._ids(publico), {self.horarios['Cali']['aprobado'].id})
        self.assertEqual(self._ids(_cliente(), seccional_id=self.seccional_cali.id), {self.horarios['Cali']['aprobado'].id})

    def test_el_publico_sin_elegir_seccional_no_recibe_horarios(self):
        r = _cliente().get('/api/horarios/por-periodo/', {'periodo_id': self.periodo.id}, **H)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(json.loads(r.content)['code'], 'seccional_publica_requerida')


class PortalPublicoPorSeccionalTests(HorariosPorPeriodoPorSeccionalTests):
    """El resto de consultas del portal público también se acotan a la seccional elegida."""

    def _publico(self, seccional=None):
        return Client(HTTP_X_SECCIONAL_PUBLICA=str(seccional.id)) if seccional else Client()

    def test_lista_de_seccionales_es_publica(self):
        r = self._publico().get('/api/seccionales/', **H)
        self.assertEqual(r.status_code, 200)
        self.assertEqual({s['ciudad'] for s in json.loads(r.content)}, {'Barranquilla', 'Cali'})

    def test_horarios_extendidos(self):
        self.assertEqual(self._publico().get('/api/horarios/list/extendidos/', **H).status_code, 400)
        r = self._publico(self.seccional_cali).get('/api/horarios/list/extendidos/', **H)
        self.assertEqual({h['id'] for h in json.loads(r.content)['horarios']}, {self.horarios['Cali']['aprobado'].id})

    def test_espacios_con_horarios(self):
        self.assertEqual(self._publico().get('/api/espacios/horarios/all/', **H).status_code, 400)
        r = self._publico(self.seccional_cali).get('/api/espacios/horarios/all/', **H)
        self.assertEqual([e['nombre'] for e in json.loads(r.content)['espacios']], ['A Cali'])

    def test_programas(self):
        r = self._publico(self.seccional_cali).get('/api/programas/', **H)
        datos = json.loads(r.content)
        nombres = {p['nombre'] for p in (datos if isinstance(datos, list) else datos['results'])}
        self.assertEqual(nombres, {'Programa Cali'})
        r = self._publico(Seccional.objects.get(ciudad='Barranquilla')).get('/api/programas/', **H)
        datos = json.loads(r.content)
        self.assertEqual({p['nombre'] for p in (datos if isinstance(datos, list) else datos['results'])}, {'Programa Barranquilla'})

    def test_con_sesion_la_cabecera_no_cambia_nada(self):
        c = _cliente(self.admins['Barranquilla'])
        c.defaults['HTTP_X_SECCIONAL_PUBLICA'] = str(self.seccional_cali.id)
        ids = self._ids(c)
        self.assertEqual(ids, {h.id for h in self.horarios['Barranquilla'].values()})


class AdminFinancieroNoEscribeCatalogoAcademicoTests(TestCase):
    def test_no_crea_sedes_ni_facultades(self):
        seccional = Seccional.objects.create(ciudad='Barranquilla')
        sede = Sede.objects.create(nombre='Sede', seccional=seccional)
        fin = Usuario.objects.create_user(
            correo='fin@prueba.test', nombre='Fin', rol=Rol.objects.get_or_create(nombre='Admin Financiero')[0], sede=sede)
        c = _cliente(fin)
        r = c.post('/api/sedes/', json.dumps({'nombre': 'Nueva', 'seccional': seccional.id}), content_type='application/json', **H)
        self.assertEqual(r.status_code, 403)
        r = c.post('/api/facultades/', json.dumps({'nombre': 'Nueva', 'sede': sede.id}), content_type='application/json', **H)
        self.assertEqual(r.status_code, 403)
        self.assertFalse(Sede.objects.filter(nombre='Nueva').exists())
