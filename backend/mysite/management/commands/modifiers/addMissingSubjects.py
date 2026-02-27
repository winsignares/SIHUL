from __future__ import annotations

import sys
from typing import List, Tuple

from django.db import transaction

from asignaturas.models import Asignatura


# Formato: (nombre, codigo, creditos, tipo, horas)
# tipo permitido: teórica, práctica, mixta
SubjectTuple = Tuple[str, str, int, str, int]


MISSING_SUBJECTS: List[SubjectTuple] = [
    # Ejemplo:
    # ('Lógica Jurídica', 'DER-LGJU', 3, 'teórica', 144),
]


VALID_TYPES = {'teórica', 'práctica', 'mixta'}


def _normalize_tipo(tipo: str) -> str:
    value = tipo.strip().lower()
    aliases = {
        'teorica': 'teórica',
        'teórica': 'teórica',
        'practica': 'práctica',
        'práctica': 'práctica',
        'mixta': 'mixta',
    }
    return aliases.get(value, value)


def create_missing_subjects(apply_changes: bool = False) -> None:
    created_count = 0
    updated_count = 0
    skipped_count = 0
    errors: List[str] = []

    with transaction.atomic():
        for item in MISSING_SUBJECTS:
            try:
                nombre, codigo, creditos, tipo, horas = item

                tipo_normalizado = _normalize_tipo(tipo)
                if tipo_normalizado not in VALID_TYPES:
                    raise ValueError(f"Tipo inválido '{tipo}'. Usa teórica/práctica/mixta")

                _, created = Asignatura.objects.update_or_create(
                    codigo=codigo.strip().upper(),
                    defaults={
                        'nombre': nombre.strip(),
                        'creditos': int(creditos),
                        'tipo': tipo_normalizado,
                        'horas': int(horas),
                    },
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            except Exception as error:
                skipped_count += 1
                errors.append(f"{item} -> {str(error)}")

        if not apply_changes:
            transaction.set_rollback(True)

    mode = 'APPLY' if apply_changes else 'DRY-RUN'
    print(f"\n=== Materias faltantes [{mode}] ===")
    print(f"Tuplas procesadas: {len(MISSING_SUBJECTS)}")
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
    create_missing_subjects(apply_changes='--apply' in sys.argv)
