from __future__ import annotations

import sys
from datetime import time
from typing import List, Sequence, Tuple

from django.db import transaction
from django.db.models import Q

from asignaturas.models import Asignatura
from espacios.models import EspacioFisico
from grupos.models import Grupo
from horario.models import Horario
from periodos.models import PeriodoAcademico
from sedes.models import Sede


# Formato de cada tupla:
# (grupo_nombre, materia_nombre/código asignatura, profesor_nombre, dia, hora_inicio, hora_fin, espacio_nombre)
ScheduleTuple = Tuple[str, str, str, str, str, str, str]


# -----------------------------------------------------------------------------
# HORARIOS A ELIMINAR - DEBEN COINCIDIR CON LOS DE createAdditionalSchedules.py
# -----------------------------------------------------------------------------
ADDITIONAL_SCHEDULES_CENTRO: List[ScheduleTuple] = [
	# Ejemplo:
	
    # ('V DERECHO C', 'Tutela Penal De Los Bienes Jurídicos II', 'JUAN CARLOS GUTIÉRREZ', 'MARTES', '06:00:00', '09:00:00', 'SALON 103B'),
    	#Lógica Jurídica
	("III DERECHO A", "DER-LGJU", "Yadira García", "LUNES", "18:00:00", "21:00:00", "613NB"),
	#Constitucional Colombiano
	("III DERECHO A", "DER-COCO", "JHONNY MENDOZA", "MARTES", "18:00:00", "21:00:00", "613NB"),
	("III DERECHO A", "DER-COCO", "JHONNY MENDOZA", "MIERCOLES", "18:00:00", "21:00:00", "613NB"),
	#Teoría del derecho
	("III DERECHO A", "DER-TEDE", "CARLOS JIMÉNEZ", "JUEVES", "18:00:00", "21:00:00", "613NB"),
	("III DERECHO A", "DER-TEDE", "CARLOS JIMENEZ", "VIERNES", "18:00:00", "21:00:00", "Salon 514NB"),
	#ELectiva Oratoria y Liderazgo - Grupo II, III, IV y VIII Derecho
	("II III IV Y VIII DERECHO", "ELE-ORALI", "LILIA CEDEÑO", "Lunes", "08:00:00", "10:00:00", "Salon 514NB"),
	#Electronica digital
	(" II ING SISTEMAS GA", "ING-ELDI", "MARVIN MOLINA", "MARTES", "18:00:00", "21:00:00", "Salon 602NB"),
	#Derechos Humanos y D.I.H.
	("II DERECHO A", "DER-DHDH", "MAGDA DJANON", "Lunes", "10:00", "14:00", "SALON 507NB"),
	#Ciencia Política
	("II DERECHO A", "DER-CIPL", "ALEJANDRO BLANCO", "Lunes", "15:00", "18:00", "SALON 507NB"),
]

ADDITIONAL_SCHEDULES_PRINCIPAL: List[ScheduleTuple] = [

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


def _find_subject(materia_nombre: str) -> Asignatura | None:
	"""Busca la asignatura por nombre o código."""
	return Asignatura.objects.filter(
		Q(nombre__iexact=materia_nombre.strip()) | Q(codigo__iexact=materia_nombre.strip())
	).first()


def _find_space(espacio_nombre: str, sede: Sede) -> EspacioFisico | None:
	"""Busca el espacio por nombre exacto o similar."""
	espacio_normalizado = espacio_nombre.strip()
	espacio = EspacioFisico.objects.filter(nombre__iexact=espacio_normalizado, sede=sede).first()
	if espacio:
		return espacio

	first_token = espacio_normalizado.split()[0] if espacio_normalizado.split() else espacio_normalizado
	return EspacioFisico.objects.filter(nombre__icontains=first_token, sede=sede).first()


def _find_group(grupo_nombre: str, periodo: PeriodoAcademico) -> Grupo | None:
	"""Busca el grupo por nombre."""
	return Grupo.objects.filter(periodo=periodo, nombre__iexact=grupo_nombre.strip()).first()


def _ensure_sede(nombre_sede: str) -> Sede:
	"""Obtiene la sede o lanza error si no existe."""
	sede = Sede.objects.filter(nombre__iexact=nombre_sede).first()
	if not sede:
		raise ValueError(f"No existe la sede '{nombre_sede}'.")
	return sede


def _ensure_periodo(periodo_nombre: str) -> PeriodoAcademico:
	"""Obtiene el periodo o lanza error si no existe."""
	periodo = PeriodoAcademico.objects.filter(nombre=periodo_nombre).first()
	if not periodo:
		raise ValueError(f"No existe el periodo '{periodo_nombre}'.")
	return periodo


def delete_additional_schedules(
	schedules: Sequence[ScheduleTuple],
	*,
	periodo_nombre: str,
	sede_nombre: str,
	apply_changes: bool,
) -> None:
	"""
	Elimina los horarios especificados en la lista de tuplas.
	
	Args:
		schedules: Lista de tuplas con la información de los horarios a eliminar
		periodo_nombre: Nombre del periodo académico
		sede_nombre: Nombre de la sede
		apply_changes: Si es True, aplica los cambios; si es False, solo simula
	"""
	sede = _ensure_sede(sede_nombre)
	periodo = _ensure_periodo(periodo_nombre)

	deleted_count = 0
	not_found_count = 0
	errors: List[str] = []

	with transaction.atomic():
		for schedule in schedules:
			try:
				grupo_nombre, materia_nombre, profesor_nombre, dia, hora_inicio_str, hora_fin_str, espacio_nombre = schedule

				# Buscar el grupo
				grupo = _find_group(grupo_nombre, periodo)
				if not grupo:
					errors.append(f"{schedule} -> Grupo no encontrado: {grupo_nombre}")
					not_found_count += 1
					continue

				# Buscar la asignatura
				asignatura = _find_subject(materia_nombre)
				if not asignatura:
					errors.append(f"{schedule} -> Asignatura no encontrada: {materia_nombre}")
					not_found_count += 1
					continue

				# Buscar el espacio
				espacio = _find_space(espacio_nombre, sede)
				if not espacio:
					errors.append(f"{schedule} -> Espacio no encontrado: {espacio_nombre}")
					not_found_count += 1
					continue

				# Normalizar día y horas
				dia_normalizado = DAY_MAP.get(dia.upper().strip(), dia.strip())
				hora_inicio = time.fromisoformat(hora_inicio_str)
				hora_fin = time.fromisoformat(hora_fin_str)

				# Buscar y eliminar el horario
				horario = Horario.objects.filter(
					grupo=grupo,
					asignatura=asignatura,
					espacio=espacio,
					dia_semana=dia_normalizado,
					hora_inicio=hora_inicio,
					hora_fin=hora_fin,
				).first()

				if horario:
					horario.delete()
					deleted_count += 1
					print(f"✓ Eliminado: {grupo_nombre} | {materia_nombre} | {dia_normalizado} {hora_inicio}-{hora_fin}")
				else:
					not_found_count += 1
					errors.append(f"{schedule} -> Horario no encontrado en BD")

			except Exception as error:
				errors.append(f"{schedule} -> Error: {str(error)}")
				not_found_count += 1

		if not apply_changes:
			transaction.set_rollback(True)

	mode = 'APPLY' if apply_changes else 'DRY-RUN'
	print(f"\n{'='*80}")
	print(f"=== Eliminación de horarios adicionales [{mode}] ===")
	print(f"Sede: {sede_nombre} | Periodo: {periodo_nombre}")
	print(f"{'='*80}")
	print(f"Tuplas procesadas: {len(schedules)}")
	print(f"Eliminados: {deleted_count}")
	print(f"No encontrados: {not_found_count}")
	
	if errors:
		print(f"\nErrores y advertencias ({len(errors)}):")
		for index, error_msg in enumerate(errors[:20], start=1):
			print(f"  {index}. {error_msg}")
		if len(errors) > 20:
			print(f"  ... y {len(errors) - 20} errores más")
	
	if not apply_changes:
		print(f"\n⚠️  Modo DRY-RUN: Ningún cambio fue aplicado.")
		print(f"    Usa --apply para eliminar los horarios realmente.")
	else:
		print(f"\n✓ Cambios aplicados exitosamente.")


def run(apply_changes: bool = False) -> None:
	"""
	Ejecuta la eliminación de horarios adicionales.
	
	Args:
		apply_changes: Si es False (default), ejecuta en modo simulación (dry-run).
		               Si es True, aplica los cambios realmente.
	"""
	print(f"\n{'='*80}")
	print("ELIMINACIÓN DE HORARIOS ADICIONALES")
	print(f"{'='*80}\n")

	if ADDITIONAL_SCHEDULES_CENTRO:
		delete_additional_schedules(
			ADDITIONAL_SCHEDULES_CENTRO,
			periodo_nombre='2026-1',
			sede_nombre='Sede Centro',
			apply_changes=apply_changes,
		)
	else:
		print('⚠️  No hay tuplas en ADDITIONAL_SCHEDULES_CENTRO.')

	print()  # Separador entre sedes

	if ADDITIONAL_SCHEDULES_PRINCIPAL:
		delete_additional_schedules(
			ADDITIONAL_SCHEDULES_PRINCIPAL,
			periodo_nombre='2026-1',
			sede_nombre='Sede Principal',
			apply_changes=apply_changes,
		)
	else:
		print('⚠️  No hay tuplas en ADDITIONAL_SCHEDULES_PRINCIPAL.')


if __name__ == '__main__':
	run(apply_changes='--apply' in sys.argv)
