from django.core.management.base import BaseCommand
from django.db import transaction

from notificaciones.models import Notificacion


class Command(BaseCommand):
    help = (
        "Elimina todas las notificaciones. "
        "Por seguridad, sin --confirmar solo muestra una simulacion."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirmar",
            action="store_true",
            help="Ejecuta la eliminacion real. Sin esta bandera solo simula.",
        )

    def handle(self, *args, **options):
        confirmar = options["confirmar"]
        total = Notificacion.objects.count()

        if total == 0:
            self.stdout.write(
                self.style.SUCCESS("No hay notificaciones para eliminar.")
            )
            return

        self.stdout.write(
            self.style.WARNING(f"Notificaciones encontradas: {total}.")
        )

        if not confirmar:
            self.stdout.write(
                self.style.WARNING(
                    "Modo simulacion: no se elimino ningun registro. "
                    "Ejecuta nuevamente con --confirmar para borrar."
                )
            )
            return

        with transaction.atomic():
            eliminadas, detalle = Notificacion.objects.all().delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Eliminacion completada. Registros eliminados: {eliminadas}."
            )
        )
        for modelo, cantidad in sorted(detalle.items()):
            self.stdout.write(f"  - {modelo}: {cantidad}")
