from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from asignaturas.models import Asignatura
from sedes.models import Sede


class Command(BaseCommand):
    help = "Asigna la Sede Centro a todas las asignaturas existentes"

    def add_arguments(self, parser):
        parser.add_argument(
            "--sede",
            default="Sede Centro",
            help="Nombre de la sede a asignar (default: Sede Centro)",
        )

    def handle(self, *args, **options):
        sede_nombre = options["sede"]

        try:
            sede = Sede.objects.get(nombre=sede_nombre)
        except Sede.DoesNotExist as exc:
            raise CommandError(
                f'No existe una sede con nombre "{sede_nombre}".'
            ) from exc

        total_asignaturas = Asignatura.objects.count()
        if total_asignaturas == 0:
            self.stdout.write(self.style.WARNING("No hay asignaturas para actualizar."))
            return

        with transaction.atomic():
            actualizadas = Asignatura.objects.exclude(sede=sede).update(sede=sede)

        ya_en_sede = total_asignaturas - actualizadas
        self.stdout.write(
            self.style.SUCCESS(
                f"Asignaturas totales: {total_asignaturas}. "
                f"Actualizadas: {actualizadas}. "
                f"Ya estaban en {sede_nombre}: {ya_en_sede}."
            )
        )
