from __future__ import annotations

import sys

from mysite.management.commands.modifiers.addMissingSubjects import create_missing_subjects
from mysite.management.commands.modifiers.relateSubjectsToPrograms import create_subject_program_relations
from mysite.management.commands.modifiers.createAdditionalSchedules import run as create_additional_schedules
from mysite.management.commands.modifiers.unifyGroups import unify_medicina_groups


def run_all_modifiers(apply_changes: bool = False) -> None:
    mode = 'APPLY' if apply_changes else 'DRY-RUN'
    print(f"\n=== Ejecutando modificadores [{mode}] ===")

    print("\n[1/4] addMissingSubjects.py")
    create_missing_subjects(apply_changes=apply_changes)

    print("\n[2/4] relateSubjectsToPrograms.py")
    create_subject_program_relations(apply_changes=apply_changes)

    print("\n[3/4] createAdditionalSchedules.py")
    create_additional_schedules(apply_changes=apply_changes)

    print("\n[4/4] unifyGroups.py")
    unify_medicina_groups(apply_changes=apply_changes)

    print("\n=== Modificadores finalizados ===")


if __name__ == '__main__':
    run_all_modifiers(apply_changes='--apply' in sys.argv)
