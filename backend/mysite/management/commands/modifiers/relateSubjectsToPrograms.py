from __future__ import annotations

import sys
from typing import List, Tuple

from django.db import transaction

from asignaturas.models import Asignatura, AsignaturaPrograma
from programas.models import Programa


# Formato:
# (programa_nombre, asignatura_codigo_o_nombre, semestre, componente_formativo)
RelationTuple = Tuple[str, str, int, str]


SUBJECT_PROGRAM_RELATIONS: List[RelationTuple] = [
    # Ejemplo:
    # ('Derecho', 'DER-LGJU', 3, 'profesional'),
]


VALID_COMPONENTS = {'electiva', 'optativa', 'profesional', 'humanística', 'básica'}


def _normalize_component(value: str) -> str:
    raw = value.strip().lower()
    aliases = {
        'electiva': 'electiva',
        'optativa': 'optativa',
        'profesional': 'profesional',
        'humanistica': 'humanística',
        'humanística': 'humanística',
        'basica': 'básica',
        'básica': 'básica',
    }
    return aliases.get(raw, raw)


def _find_subject(codigo_o_nombre: str) -> Asignatura:
    key = codigo_o_nombre.strip()
    by_code = Asignatura.objects.filter(codigo__iexact=key).first()
    if by_code:
        return by_code

    by_name = Asignatura.objects.filter(nombre__iexact=key).first()
    if by_name:
        return by_name

    raise Asignatura.DoesNotExist(f"Asignatura no encontrada por código/nombre: {codigo_o_nombre}")


def create_subject_program_relations(apply_changes: bool = False) -> None:
    created_count = 0
    updated_count = 0
    skipped_count = 0
    errors: List[str] = []

    with transaction.atomic():
        for item in SUBJECT_PROGRAM_RELATIONS:
            try:
                programa_nombre, asignatura_key, semestre, componente = item

                if int(semestre) <= 0:
                    raise ValueError('El semestre debe ser mayor que 0')

                componente_normalizado = _normalize_component(componente)
                if componente_normalizado not in VALID_COMPONENTS:
                    raise ValueError(
                        f"Componente inválido '{componente}'. Usa electiva/optativa/profesional/humanística/básica"
                    )

                programa = Programa.objects.get(nombre__iexact=programa_nombre.strip())
                asignatura = _find_subject(asignatura_key)

                relation, created = AsignaturaPrograma.objects.get_or_create(
                    programa=programa,
                    asignatura=asignatura,
                    semestre=int(semestre),
                    defaults={'componente_formativo': componente_normalizado},
                )

                if created:
                    created_count += 1
                else:
                    if relation.componente_formativo != componente_normalizado:
                        relation.componente_formativo = componente_normalizado
                        relation.save(update_fields=['componente_formativo'])
                        updated_count += 1

            except Exception as error:
                skipped_count += 1
                errors.append(f"{item} -> {str(error)}")

        if not apply_changes:
            transaction.set_rollback(True)

    mode = 'APPLY' if apply_changes else 'DRY-RUN'
    print(f"\n=== Relaciones asignatura-programa [{mode}] ===")
    print(f"Tuplas procesadas: {len(SUBJECT_PROGRAM_RELATIONS)}")
    print(f"Nuevas: {created_count}")
    print(f"Actualizadas: {updated_count}")
    print(f"Omitidas por error: {skipped_count}")

    if errors:
        print('Errores:')
        for index, error_msg in enumerate(errors[:20], start=1):
            print(f"  {index}. {error_msg}")
        if len(errors) > 20:
            print(f"  ... y {len(errors) - 20} errores más")


if __name__ == '__main__':
    create_subject_program_relations(apply_changes='--apply' in sys.argv)
