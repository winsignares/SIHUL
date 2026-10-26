"""Consultas públicas (sin sesión): lo que las páginas /public/consulta-horario y /public/disponibilidad-espacios necesitan.

El público puede LEER periodos, el catálogo de programas y los horarios APROBADOS. No puede escribir, ni ver horarios
pendientes o rechazados, ni consultar otros recursos protegidos.
"""
import datetime
import json

from django.test import TestCase

from asignaturas.models import Asignatura
from espacios.models import EspacioFisico, TipoEspacio
from facultades.models import Facultad
from grupos.models import Grupo
from periodos.models import PeriodoAcademico
from programas.models import Programa
from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario

from .models import Horario


def _json(r):
    return json.loads(r.content)


class ConsultasPublicasTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        seccional, _ = Seccional.objects.get_or_create(ciudad='Barranquilla')
        sede = Sede.objects.create(nombre='Sede Centro Prueba', seccional=seccional)
        facultad = Facultad.objects.create(nombre='Ingeniería', sede=sede)
        cls.programa = Programa.objects.create(facultad=facultad, nombre='Ingeniería de Sistemas', activo=False)
        cls.periodo = PeriodoAcademico.objects.create(
            nombre='2026-2', fecha_inicio=datetime.date(2026, 7, 1), fecha_fin=datetime.date(2026, 12, 15))
        grupo = Grupo.objects.create(programa=cls.programa, periodo=cls.periodo, nombre='G1', semestre=3)
        asignatura = Asignatura.objects.create(nombre='Cálculo', codigo='CAL-1', creditos=3)
        tipo = TipoEspacio.objects.create(nombre='Aula prueba')
        espacio = EspacioFisico.objects.create(nombre='A-101', sede=sede, tipo=tipo, capacidad=30)
        base = dict(grupo=grupo, asignatura=asignatura, espacio=espacio, dia_semana='lunes',
                    hora_inicio=datetime.time(7, 0), hora_fin=datetime.time(9, 0))
        cls.aprobado = Horario.objects.create(estado='aprobado', **base)
        cls.pendiente = Horario.objects.create(estado='pendiente', **{**base, 'dia_semana': 'martes'})
        cls.rechazado = Horario.objects.create(estado='rechazado', **{**base, 'dia_semana': 'jueves'})
        cls.admin = Usuario.objects.create(
            nombre='Admin', correo='admin.publico@unilibre.edu.co', contrasena_hash='x',
            rol=Rol.objects.get_or_create(nombre='admin')[0], es_superusuario=True)

    def _entrar(self, usuario):
        sesion = self.client.session
        sesion['user_id'] = usuario.id
        sesion.save()

    # ---- periodo por rango de fechas ----------------------------------------------------

    def test_el_publico_consulta_el_periodo_por_rango_de_fechas(self):
        r = self.client.get('/api/periodos/rango-fechas/', {'fecha_inicio': '2026-10-26', 'fecha_fin': '2026-11-01'})
        self.assertEqual(r.status_code, 200)
        self.assertEqual([p['id'] for p in r.json()['periodos']], [self.periodo.id])

    def test_sin_periodo_en_el_rango_es_404_no_403(self):
        r = self.client.get('/api/periodos/rango-fechas/', {'fecha_inicio': '2031-01-01', 'fecha_fin': '2031-01-07'})
        self.assertEqual(r.status_code, 404)

    # ---- catálogo de programas ----------------------------------------------------------

    def test_el_publico_lista_los_programas_pero_no_escribe_ni_ve_el_detalle(self):
        r = self.client.get('/api/programas/')
        self.assertEqual(r.status_code, 200)
        nombres = [p['nombre'] for p in (r.json() if isinstance(r.json(), list) else r.json()['results'])]
        self.assertIn('Ingeniería de Sistemas', nombres)
        self.assertEqual(self.client.get(f'/api/programas/{self.programa.id}/').status_code, 403)
        crear = self.client.post('/api/programas/', json.dumps({'nombre': 'X', 'facultad': 1}), content_type='application/json')
        self.assertIn(crear.status_code, (401, 403))
        borrar = self.client.delete(f'/api/programas/{self.programa.id}/')
        self.assertIn(borrar.status_code, (401, 403))
        self.assertTrue(Programa.objects.filter(id=self.programa.id).exists())

    # ---- horarios por periodo -----------------------------------------------------------

    def test_el_publico_solo_ve_horarios_aprobados_por_periodo(self):
        r = self.client.get('/api/horarios/por-periodo/', {'periodo_id': self.periodo.id, 'estados[]': ['aprobado', 'pendiente']})
        self.assertEqual(r.status_code, 200)
        estados = {h['estado'] for h in _json(r)['horarios']}
        self.assertEqual(estados, {'aprobado'})

    def test_pedir_pendientes_o_rechazados_no_los_revela(self):
        for pedido in ('pendiente', 'rechazado', 'pendiente,rechazado'):
            r = self.client.get('/api/horarios/por-periodo/', {'periodo_id': self.periodo.id, 'estado': pedido})
            self.assertEqual(r.status_code, 200)
            self.assertEqual(_json(r)['horarios'], [], pedido)
        # sin ningún filtro tampoco
        r = self.client.get('/api/horarios/por-periodo/', {'periodo_id': self.periodo.id})
        self.assertEqual({h['estado'] for h in _json(r)['horarios']}, {'aprobado'})

    def test_con_sesion_se_siguen_viendo_los_pendientes(self):
        self._entrar(self.admin)
        r = self.client.get('/api/horarios/por-periodo/', {'periodo_id': self.periodo.id, 'estados[]': ['aprobado', 'pendiente']})
        self.assertEqual(r.status_code, 200)
        self.assertEqual({h['estado'] for h in _json(r)['horarios']}, {'aprobado', 'pendiente'})

    def test_horarios_por_periodo_valida_sus_parametros(self):
        self.assertEqual(self.client.get('/api/horarios/por-periodo/').status_code, 400)
        self.assertEqual(self.client.get('/api/horarios/por-periodo/', {'periodo_id': 999999}).status_code, 404)

    # ---- lo demás sigue protegido -------------------------------------------------------

    def test_el_resto_del_modulo_de_horarios_sigue_protegido(self):
        self.assertIn(self.client.get('/api/horarios/').status_code, (401, 403))
        self.assertIn(self.client.get('/api/horarios/mi-horario-estudiante/').status_code, (401, 403))
        crear = self.client.post('/api/horarios/', json.dumps({}), content_type='application/json')
        self.assertIn(crear.status_code, (401, 403))
        borrar = self.client.delete(f'/api/horarios/{self.aprobado.id}/')
        self.assertIn(borrar.status_code, (401, 403))
        self.assertTrue(Horario.objects.filter(id=self.aprobado.id).exists())

    def test_otros_catalogos_siguen_sin_abrirse(self):
        self.assertIn(self.client.get('/api/facultades/').status_code, (401, 403))
        self.assertIn(self.client.get('/api/usuarios/').status_code, (401, 403))
