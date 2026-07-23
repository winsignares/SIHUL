from django.core.management.base import BaseCommand
from django.db import router, transaction
from django.db.models.deletion import Collector

from espacios.models import EspacioFisico


SECCIONAL_OBJETIVO = "Barranquilla"


class Command(BaseCommand):
    help = (
        "Elimina los espacios fisicos de Barranquilla con capacidad mayor a 0. "
        "Por seguridad, sin --confirmar solo muestra una simulacion."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirmar",
            action="store_true",
            help="Ejecuta la eliminacion real. Sin esta bandera solo simula.",
        )
        parser.add_argument(
            "--sin-detalle",
            action="store_true",
            help="No muestra el conteo estimado de objetos eliminados por cascada.",
        )

    def handle(self, *args, **options):
        confirmar = options["confirmar"]
        sin_detalle = options["sin_detalle"]

        espacios = (
            EspacioFisico.objects.filter(
                capacidad__gt=0,
                sede__seccional__ciudad__iexact=SECCIONAL_OBJETIVO,
            )
            .select_related("sede", "sede__seccional")
            .order_by("id")
        )
        total_espacios = espacios.count()

        if total_espacios == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    "No hay espacios fisicos de la seccional "
                    f"{SECCIONAL_OBJETIVO} con capacidad mayor a 0."
                )
            )
            return

        self.stdout.write(
            self.style.WARNING(
                "Espacios fisicos de la seccional "
                f"{SECCIONAL_OBJETIVO} con capacidad mayor a 0: {total_espacios}."
            )
        )

        if not sin_detalle:
            self._mostrar_resumen_cascada(espacios)

        if not confirmar:
            self.stdout.write(
                self.style.WARNING(
                    "Modo simulacion: no se elimino ningun registro. "
                    "Ejecuta nuevamente con --confirmar para borrar."
                )
            )
            return

        with transaction.atomic():
            eliminados, detalle = espacios.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Eliminacion completada. Registros eliminados: {eliminados}."
            )
        )
        for modelo, cantidad in sorted(detalle.items()):
            self.stdout.write(f"  - {modelo}: {cantidad}")

    def _mostrar_resumen_cascada(self, espacios):
        using = router.db_for_write(EspacioFisico)
        collector = Collector(using=using)
        collector.collect(espacios)

        self.stdout.write("Resumen estimado de eliminacion por cascada:")
        for model, objects in sorted(
            collector.data.items(),
            key=lambda item: item[0]._meta.label_lower,
        ):
            self.stdout.write(f"  - {model._meta.label}: {len(objects)}")
