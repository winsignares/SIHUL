from __future__ import annotations

import hashlib
import sys
from datetime import time
from typing import List, Sequence, Tuple

from django.db import transaction
from django.db.models import Q

from asignaturas.models import Asignatura
from espacios.models import EspacioFisico, TipoEspacio
from grupos.models import Grupo
from horario.models import Horario
from periodos.models import PeriodoAcademico
from programas.models import Programa
from sedes.models import Sede
from usuarios.models import Usuario


# Formato de cada tupla:
# (grupo_nombre, materia_nombre/código asignatura, profesor_nombre, dia, hora_inicio, hora_fin, espacio_nombre)
ScheduleTuple = Tuple[str, str, str, str, str, str, str]


# -----------------------------------------------------------------------------
# AGREGA AQUÍ TUS HORARIOS ADICIONALES
# -----------------------------------------------------------------------------
ADDITIONAL_SCHEDULES_CENTRO: List[ScheduleTuple] = [
	# Ejemplo:
	# ('V DERECHO C', 'Tutela Penal De Los Bienes Jurídicos II', 'JUAN CARLOS GUTIÉRREZ', 'MARTES', '06:00:00', '09:00:00', 'SALON 103B'),
]

ADDITIONAL_SCHEDULES_PRINCIPAL: List[ScheduleTuple] = [
	#Lógica Jurídica
	("III DERECHO A", "DER-LGJU", "Yadira García", "LUNES", "18:00:00", "21:00:00", "613NB"),
	#Constitucional Colombiano
	("III DERECHO A", "DER-COCO", "JHONNY MENDOZA", "MARTES", "18:00:00", "21:00:00", "613NB"),
	("III DERECHO A", "DER-COCO", "JHONNY MENDOZA", "MIERCOLES", "18:00:00", "21:00:00", "613NB"),
	#Teoría del derecho
	("III DERECHO A", "DER-TEDE", "CARLOS JIMÉNEZ", "JUEVES", "18:00:00", "21:00:00", "613NB"),
	("III DERECHO A", "DER-TEDE", "CARLOS JIMENEZ", "VIERNES", "18:00:00", "21:00:00", "Salon 514NB"),
	#ELectiva Oratoria y Liderazgo
	("II III IV Y VIII DERECHO", "ELECTIVA ORATORIA Y LIDERAZGO", "LILIA CEDEÑO", "Lunes", "08:00:00", "10:00:00", "Salon 514NB"),
	#Electronica digital
	(" II ING SISTEMAS GA", "ING-ELDI", "MARVIN MOLINA", "MARTES", "18:00:00", "21:00:00", "Salon 602NB"),
	#Derechos Humanos y D.I.H.
	("II DERECHO A", "DER-DHDH", "MAGDA DJANON", "Lunes", "10:00", "14:00", "SALON 507NB"),
	#Ciencia Política
	("II DERECHO A", "DER-CIPL", "ALEJANDRO BLANCO", "Lunes", "15:00", "18:00", "SALON 507NB"),
]


DAY_MAP = {
	'LUNES': 'Lunes',
	'MARTES': 'Martes',
	'MIÉRCOLES': 'Miércoles',
	'MIERCOLES': 'Miércoles',
	'JUEVES': 'Jueves',
	'VIERNES': 'Viernes',
	'SÁBADO': 'Sábado',
	'SABADO': 'Sábado',
	'DOMINGO': 'Domingo',
}


def _get_or_create_subject(materia_nombre: str) -> Asignatura:
	asignatura = Asignatura.objects.filter(
		Q(nombre__iexact=materia_nombre.strip()) | Q(codigo__iexact=materia_nombre.strip())
	).first()
	if asignatura:
		return asignatura

	codigo_hash = hashlib.md5(materia_nombre.encode()).hexdigest()[:6].upper()
	codigo_final = codigo_hash
	counter = 1
	while Asignatura.objects.filter(codigo=codigo_final).exists():
		codigo_final = f'{codigo_hash}{counter}'
		counter += 1

	return Asignatura.objects.create(
		nombre=materia_nombre.strip(),
		codigo=codigo_final,
		creditos=3,
		horas=3,
		tipo='mixta',
	)


def _find_teacher(profesor_nombre: str) -> Usuario | None:
	if not profesor_nombre.strip():
		return None

	normalized = profesor_nombre.strip().upper()
	docente = Usuario.objects.filter(nombre__icontains=normalized).first()
	if docente:
		return docente

	parts = normalized.split()
	if len(parts) >= 2:
		return Usuario.objects.filter(nombre__icontains=parts[0]).filter(nombre__icontains=parts[-1]).first()
	return None


def _find_space(espacio_nombre: str, sede: Sede, default_tipo: TipoEspacio) -> EspacioFisico:
	espacio_normalizado = espacio_nombre.strip()
	espacio = EspacioFisico.objects.filter(nombre__iexact=espacio_normalizado, sede=sede).first()
	if espacio:
		return espacio

	first_token = espacio_normalizado.split()[0] if espacio_normalizado.split() else espacio_normalizado
	espacio = EspacioFisico.objects.filter(nombre__icontains=first_token, sede=sede).first()
	if espacio:
		return espacio

	return EspacioFisico.objects.create(
		nombre=espacio_normalizado,
		sede=sede,
		tipo=default_tipo,
		capacidad=30,
		estado='Disponible',
	)


def _find_group(grupo_nombre: str, periodo: PeriodoAcademico) -> Grupo:
	grupo = Grupo.objects.filter(periodo=periodo, nombre__iexact=grupo_nombre.strip()).first()
	if grupo:
		return grupo

	raise ValueError(f"Grupo no encontrado para periodo '{periodo.nombre}': {grupo_nombre}")


def _ensure_sede(nombre_sede: str) -> Sede:
	sede = Sede.objects.filter(nombre__iexact=nombre_sede).first()
	if not sede:
		raise ValueError(f"No existe la sede '{nombre_sede}'.")
	return sede


def _ensure_periodo(periodo_nombre: str) -> PeriodoAcademico:
	periodo = PeriodoAcademico.objects.filter(nombre=periodo_nombre).first()
	if not periodo:
		raise ValueError(f"No existe el periodo '{periodo_nombre}'.")
	return periodo


def _ensure_default_space_type() -> TipoEspacio:
	tipo = TipoEspacio.objects.filter(nombre__iexact='Aula').first()
	if tipo:
		return tipo
	tipo = TipoEspacio.objects.first()
	if tipo:
		return tipo
	raise ValueError('No existe ningún TipoEspacio en la base de datos.')


def create_additional_schedules(
	schedules: Sequence[ScheduleTuple],
	*,
	periodo_nombre: str,
	sede_nombre: str,
	apply_changes: bool,
) -> None:
	sede = _ensure_sede(sede_nombre)
	periodo = _ensure_periodo(periodo_nombre)
	tipo_aula = _ensure_default_space_type()

	created_count = 0
	skipped_count = 0
	errors: List[str] = []

	with transaction.atomic():
		for schedule in schedules:
			try:
				grupo_nombre, materia_nombre, profesor_nombre, dia, hora_inicio_str, hora_fin_str, espacio_nombre = schedule

				grupo = _find_group(grupo_nombre, periodo)
				asignatura = _get_or_create_subject(materia_nombre)
				docente = _find_teacher(profesor_nombre)
				espacio = _find_space(espacio_nombre, sede, tipo_aula)

				dia_normalizado = DAY_MAP.get(dia.upper().strip(), dia.strip())
				hora_inicio = time.fromisoformat(hora_inicio_str)
				hora_fin = time.fromisoformat(hora_fin_str)

				_, created = Horario.objects.get_or_create(
					grupo=grupo,
					asignatura=asignatura,
					docente=docente,
					espacio=espacio,
					dia_semana=dia_normalizado,
					hora_inicio=hora_inicio,
					hora_fin=hora_fin,
					defaults={'estado': 'aprobado'},
				)

				if created:
					created_count += 1
				else:
					skipped_count += 1

			except Exception as error:
				errors.append(f"{schedule} -> {str(error)}")
				skipped_count += 1

		if not apply_changes:
			transaction.set_rollback(True)

	mode = 'APPLY' if apply_changes else 'DRY-RUN'
	print(f"\n=== Horarios adicionales [{mode}] | sede={sede_nombre} | periodo={periodo_nombre} ===")
	print(f"Tuplas procesadas: {len(schedules)}")
	print(f"Creados: {created_count}")
	print(f"Omitidos: {skipped_count}")
	if errors:
		print("Errores:")
		for index, error_msg in enumerate(errors[:20], start=1):
			print(f"  {index}. {error_msg}")
		if len(errors) > 20:
			print(f"  ... y {len(errors) - 20} errores más")


def run(apply_changes: bool = False) -> None:
	if ADDITIONAL_SCHEDULES_CENTRO:
		create_additional_schedules(
			ADDITIONAL_SCHEDULES_CENTRO,
			periodo_nombre='2026-1',
			sede_nombre='Sede Centro',
			apply_changes=apply_changes,
		)
	else:
		print('No hay tuplas en ADDITIONAL_SCHEDULES_CENTRO.')

	if ADDITIONAL_SCHEDULES_PRINCIPAL:
		create_additional_schedules(
			ADDITIONAL_SCHEDULES_PRINCIPAL,
			periodo_nombre='2026-1',
			sede_nombre='Sede Principal',
			apply_changes=apply_changes,
		)
	else:
		print('No hay tuplas en ADDITIONAL_SCHEDULES_PRINCIPAL.')


if __name__ == '__main__':
	run(apply_changes='--apply' in sys.argv)

