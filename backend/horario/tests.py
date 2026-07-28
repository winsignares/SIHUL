import json
from datetime import date, time

from django.test import RequestFactory, TestCase

from asignaturas.models import Asignatura
from espacios.models import TipoEspacio
from facultades.models import Facultad
from grupos.models import Grupo
from periodos.models import PeriodoAcademico
from programas.models import Programa
from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario

from .api_views import list_horarios_asignacion_espacios
from .models import Horario


class SeccionalScopeTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

        self.rol_admin_planeacion = Rol.objects.create(
            nombre='admin_planeacion',
            descripcion='Administrador de Planeacion',
        )
        self.seccional_a = Seccional.objects.create(ciudad='Norte')
        self.seccional_b = Seccional.objects.create(ciudad='Sur')
        self.sede_a = Sede.objects.create(nombre='Sede Norte', seccional=self.seccional_a)
        self.sede_b = Sede.objects.create(nombre='Sede Sur', seccional=self.seccional_b)
        self.facultad_a = Facultad.objects.create(nombre='Facultad Norte', sede=self.sede_a)
        self.facultad_b = Facultad.objects.create(nombre='Facultad Sur', sede=self.sede_b)
        self.programa_a = Programa.objects.create(nombre='Programa Norte', facultad=self.facultad_a, activo=True)
        self.programa_b = Programa.objects.create(nombre='Programa Sur', facultad=self.facultad_b, activo=True)
        self.periodo = PeriodoAcademico.objects.create(
            nombre='2026-2',
            fecha_inicio=date(2026, 7, 20),
            fecha_fin=date(2026, 11, 30),
        )
        self.asignatura = Asignatura.objects.create(
            nombre='Derecho Civil',
            codigo='DER-001',
            creditos=3,
            horas=2,
            sede=self.sede_a,
        )
        self.grupo_a = Grupo.objects.create(
            nombre='A',
            programa=self.programa_a,
            periodo=self.periodo,
            semestre=1,
        )
        self.grupo_b = Grupo.objects.create(
            nombre='B',
            programa=self.programa_b,
            periodo=self.periodo,
            semestre=1,
        )
        self.horario_a = Horario.objects.create(
            grupo=self.grupo_a,
            asignatura=self.asignatura,
            dia_semana='Lunes',
            hora_inicio=time(8, 0),
            hora_fin=time(10, 0),
            estado='pendiente',
        )
        self.horario_b = Horario.objects.create(
            grupo=self.grupo_b,
            asignatura=self.asignatura,
            dia_semana='Martes',
            hora_inicio=time(8, 0),
            hora_fin=time(10, 0),
            estado='pendiente',
        )
        TipoEspacio.objects.create(nombre='Aula')

    def _crear_usuario_planeacion(self, sede=None):
        usuario = Usuario(
            correo=f'planeacion-{sede.id if sede else "sin-sede"}@sihul.local',
            nombre='Admin Planeacion',
            rol=self.rol_admin_planeacion,
            sede=sede,
            activo=True,
            contrasena_hash='!',
        )
        usuario.set_unusable_password()
        usuario.contrasena_hash = usuario.password
        usuario.save()
        return usuario

    def _get_horarios(self, usuario):
        request = self.factory.get('/api/horarios/sin-espacio/')
        request.user_obj = usuario
        request.sede = usuario.sede
        response = list_horarios_asignacion_espacios(request)
        return json.loads(response.content.decode('utf-8'))['horarios']

    def test_admin_planeacion_con_sede_solo_ve_su_seccional(self):
        usuario = self._crear_usuario_planeacion(self.sede_a)

        ids = {horario['id'] for horario in self._get_horarios(usuario)}

        self.assertIn(self.horario_a.id, ids)
        self.assertNotIn(self.horario_b.id, ids)

    def test_admin_planeacion_sin_sede_no_ve_todas_las_seccionales(self):
        usuario = self._crear_usuario_planeacion()

        self.assertEqual(self._get_horarios(usuario), [])
