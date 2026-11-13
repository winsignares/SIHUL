"""El ETL de Oracle asigna el rol base, pero no pisa un rol puesto a mano (administrativo, gestor...)."""
import io

from django.core.management import call_command
from django.test import TestCase

from .models import Rol, StgOracleDocente, StgOracleEstudiante, Usuario


def correr(etapa):
    call_command('migrate_staging_to_real', '--etapa', etapa, stdout=io.StringIO())


class EtlRespetaRolesTests(TestCase):
    def setUp(self):
        self.docente = Rol.objects.create(nombre='docente')
        self.estudiante = Rol.objects.create(nombre='estudiante')
        self.administrativo = Rol.objects.create(nombre='administrativo_test')

    def _docente_oracle(self, correo, n='1'):
        StgOracleDocente.objects.create(
            external_id=n, correo_institucional=correo, nombres='Ana', apellidos='Prueba',
            nombre_completo='ANA PRUEBA', estado_docente='activo', row_hash=f'h{n}',
        )

    def _usuario(self, correo, rol):
        return Usuario.objects.create(nombre='Ana Prueba', correo=correo, contrasena_hash='x', rol=rol)

    def test_un_rol_administrativo_no_se_vuelve_docente(self):
        persona = self._usuario('ana@unilibre.edu.co', self.administrativo)
        self._docente_oracle('ana@unilibre.edu.co')
        correr('docentes')
        persona.refresh_from_db()
        self.assertEqual(persona.rol_id, self.administrativo.id)

    def test_quien_no_tiene_rol_recibe_el_de_docente(self):
        persona = self._usuario('ana@unilibre.edu.co', None)
        self._docente_oracle('ana@unilibre.edu.co')
        correr('docentes')
        persona.refresh_from_db()
        self.assertEqual(persona.rol_id, self.docente.id)

    def test_un_rol_base_si_se_reasigna(self):
        persona = self._usuario('ana@unilibre.edu.co', self.estudiante)
        self._docente_oracle('ana@unilibre.edu.co')
        correr('docentes')
        persona.refresh_from_db()
        self.assertEqual(persona.rol_id, self.docente.id)

    def test_un_docente_nuevo_se_crea_con_el_rol_docente(self):
        self._docente_oracle('nuevo@unilibre.edu.co', n='9')
        correr('docentes')
        self.assertEqual(Usuario.objects.get(correo='nuevo@unilibre.edu.co').rol_id, self.docente.id)

    def test_los_estudiantes_tampoco_pisan_un_rol_administrativo(self):
        persona = self._usuario('555@estudiante.local', self.administrativo)
        StgOracleEstudiante.objects.create(
            external_id='555', codigo_estudiante_oracle='555', nombres='Ana', apellidos='Prueba', row_hash='e1',
        )
        correr('estudiantes')
        persona.refresh_from_db()
        self.assertEqual(persona.rol_id, self.administrativo.id)
