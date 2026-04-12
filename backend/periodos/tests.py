from django.test import TestCase
from datetime import timedelta
from django.utils import timezone

from .models import PeriodoAcademico


class PeriodoAcademicoActivoPorFechaTests(TestCase):
	def test_periodo_vigente_se_activa_y_no_vigente_se_desactiva(self):
		hoy = timezone.localdate()

		vigente = PeriodoAcademico.objects.create(
			nombre='Periodo vigente',
			fecha_inicio=hoy,
			fecha_fin=hoy,
			activo=False,
		)
		pasado = PeriodoAcademico.objects.create(
			nombre='Periodo pasado',
			fecha_inicio=hoy - timedelta(days=10),
			fecha_fin=hoy - timedelta(days=1),
			activo=True,
		)

		PeriodoAcademico.sincronizar_activos_por_fecha(fecha=hoy)

		vigente.refresh_from_db()
		pasado.refresh_from_db()

		self.assertTrue(vigente.activo)
		self.assertFalse(pasado.activo)

	def test_periodo_se_desactiva_cuando_pasa_la_fecha(self):
		hoy = timezone.localdate()
		manana = hoy + timedelta(days=1)

		periodo = PeriodoAcademico.objects.create(
			nombre='Periodo de un dia',
			fecha_inicio=hoy,
			fecha_fin=hoy,
			activo=True,
		)

		PeriodoAcademico.sincronizar_activos_por_fecha(fecha=manana)

		periodo.refresh_from_db()
		self.assertFalse(periodo.activo)
