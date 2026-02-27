from __future__ import annotations

import re
import sys
from typing import Dict, List

from django.db import transaction

from grupos.models import Grupo
from horario.models import Horario, HorarioFusionado, SolicitudEspacio
from programas.models import Programa


ROMAN_BY_SEMESTER = {
	1: "I",
	2: "II",
	3: "III",
	4: "IV",
	5: "V",
	6: "VI",
	7: "VII",
	8: "VIII",
	9: "IX",
	10: "X",
}


def _normalize_group_name(name: str) -> str:
	normalized = name.strip().upper()
	normalized = re.sub(r"^(I|II|III|IV|V|VI|VII|VIII|IX|X)\s+", "", normalized)
	normalized = re.sub(r"\s+", " ", normalized)
	return normalized


def _is_medicina_base(name: str) -> bool:
	return _normalize_group_name(name) == "MEDICINA"


def _is_medicina_b(name: str) -> bool:
	return _normalize_group_name(name) == "MEDICINA B"


def _is_medicina_ga(name: str) -> bool:
	return _normalize_group_name(name) == "MEDICINA GA"


def _is_medicina_gb(name: str) -> bool:
	return _normalize_group_name(name) == "MEDICINA GB"


def _build_target_name(semestre: int) -> str:
	roman = ROMAN_BY_SEMESTER.get(semestre, str(semestre))
	return f"{roman} MEDICINA GA"


def _build_target_name_gb(semestre: int) -> str:
	roman = ROMAN_BY_SEMESTER.get(semestre, str(semestre))
	return f"{roman} MEDICINA GB"


def _has_any_relations(grupo_id: int) -> bool:
	return (
		Horario.objects.filter(grupo_id=grupo_id).exists()
		or HorarioFusionado.objects.filter(grupo1_id=grupo_id).exists()
		or HorarioFusionado.objects.filter(grupo2_id=grupo_id).exists()
		or HorarioFusionado.objects.filter(grupo3_id=grupo_id).exists()
		or SolicitudEspacio.objects.filter(grupo_id=grupo_id).exists()
	)


def _reassign_group_references(source_group_id: int, target_group_id: int) -> Dict[str, int]:
	moved = {
		"horarios": Horario.objects.filter(grupo_id=source_group_id).update(grupo_id=target_group_id),
		"horarios_fusionados_1": HorarioFusionado.objects.filter(grupo1_id=source_group_id).update(grupo1_id=target_group_id),
		"horarios_fusionados_2": HorarioFusionado.objects.filter(grupo2_id=source_group_id).update(grupo2_id=target_group_id),
		"horarios_fusionados_3": HorarioFusionado.objects.filter(grupo3_id=source_group_id).update(grupo3_id=target_group_id),
		"solicitudes_espacio": SolicitudEspacio.objects.filter(grupo_id=source_group_id).update(grupo_id=target_group_id),
	}
	return moved


def unify_medicina_groups(apply_changes: bool = False) -> None:
	try:
		programa_medicina = Programa.objects.get(nombre__iexact="Medicina")
	except Programa.DoesNotExist:
		print("No se encontró el programa MEDICINA (Programa.nombre='Medicina').")
		return

	grupos_medicina = Grupo.objects.filter(programa=programa_medicina, nombre__icontains="MEDICINA").select_related("periodo")

	grouped: Dict[tuple, List[Grupo]] = {}
	for grupo in grupos_medicina:
		key = (grupo.periodo_id, grupo.semestre)
		grouped.setdefault(key, []).append(grupo)

	if not grouped:
		print("No hay grupos de MEDICINA para procesar.")
		return

	mode = "APPLY" if apply_changes else "DRY-RUN"
	print(f"\n=== Paso 2: Unificación MEDICINA B -> MEDICINA GB ({mode}) ===")

	total_deleted = 0
	total_updated_links = 0
	total_created_targets = 0
	total_deleted_empty_legacy = 0

	with transaction.atomic():
		for (periodo_id, semestre), grupos in sorted(grouped.items(), key=lambda x: (x[0][0], x[0][1])):
			base_b_groups = sorted([g for g in grupos if _is_medicina_b(g.nombre)], key=lambda g: g.id)
			gb_groups = sorted([g for g in grupos if _is_medicina_gb(g.nombre)], key=lambda g: g.id)

			if not base_b_groups:
				continue

			canonical_target = gb_groups[0] if gb_groups else None
			if canonical_target is None:
				seed_group = base_b_groups[0]
				canonical_target = Grupo(
					programa_id=seed_group.programa_id,
					periodo_id=seed_group.periodo_id,
					semestre=seed_group.semestre,
					nombre=_build_target_name_gb(seed_group.semestre),
					activo=True,
				)
				canonical_target.save()
				total_created_targets += 1

			to_merge = [g for g in (base_b_groups + gb_groups) if g.id != canonical_target.id]
			if not to_merge:
				continue

			print(
				f"Periodo {periodo_id} | Semestre {semestre}: "
				f"target={canonical_target.id} '{canonical_target.nombre}' | "
				f"merge={len(to_merge)}"
			)

			for duplicate_group in to_merge:
				moved = _reassign_group_references(duplicate_group.id, canonical_target.id)
				moved_count = sum(moved.values())
				total_updated_links += moved_count
				total_deleted += 1
				print(
					f"  - Grupo {duplicate_group.id} '{duplicate_group.nombre}' -> {canonical_target.id} "
					f"(refs movidas: {moved_count})"
				)
				duplicate_group.delete()

		# Limpieza de grupos legacy sin horarios ni relaciones
		legacy_groups = Grupo.objects.filter(programa=programa_medicina, nombre__icontains="MEDICINA").select_related("periodo")
		for grupo in legacy_groups:
			if not (_is_medicina_base(grupo.nombre) or _is_medicina_b(grupo.nombre)):
				continue

			if _has_any_relations(grupo.id):
				continue

			print(
				f"Eliminando grupo legacy sin horario: "
				f"id={grupo.id} periodo={grupo.periodo_id} semestre={grupo.semestre} nombre='{grupo.nombre}'"
			)
			grupo.delete()
			total_deleted_empty_legacy += 1
			total_deleted += 1

		if not apply_changes:
			print("\nModo simulación: se revierte la transacción.")
			transaction.set_rollback(True)

	print("\n=== Resumen ===")
	print(f"Targets creados: {total_created_targets}")
	print(f"Grupos eliminados: {total_deleted}")
	print(f"Legacy (MEDICINA/MEDICINA B) eliminados sin horario: {total_deleted_empty_legacy}")
	print(f"Referencias actualizadas: {total_updated_links}")
	print("Finalizado.")


if __name__ == "__main__":
	apply_flag = "--apply" in sys.argv
	unify_medicina_groups(apply_changes=apply_flag)

