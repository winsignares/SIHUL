from django.core.management.base import BaseCommand
from django.db import transaction

from espacios.models import EspacioFisico


class Command(BaseCommand):
    help = "Pone todos los espacios fisicos en estado 'Disponible'."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Muestra cuantos registros se actualizarian sin guardar cambios.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        total = EspacioFisico.objects.count()
        por_actualizar = EspacioFisico.objects.exclude(estado="Disponible").count()

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "Modo simulacion: no se aplicaron cambios. "
                    f"Espacios totales: {total}. "
                    f"Espacios a actualizar: {por_actualizar}."
                )
            )
            return

        with transaction.atomic():
            actualizados = EspacioFisico.objects.exclude(estado="Disponible").update(
                estado="Disponible"
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Actualizacion completada. "
                f"Espacios totales: {total}. "
                f"Espacios actualizados: {actualizados}."
            )
        )
