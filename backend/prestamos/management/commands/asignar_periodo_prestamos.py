from django.core.management.base import BaseCommand
from django.db import transaction

from periodos.models import PeriodoAcademico
from prestamos.models import PrestamoEspacio, PrestamoEspacioPublico


class Command(BaseCommand):
    help = (
        "Busca el periodo academico al que pertenece cada prestamo segun su fecha "
        "y lo asigna a los prestamos que aun no tienen periodo."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Muestra cuantos prestamos cambiarian sin aplicar cambios.",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help=(
                "Reevalua el periodo de todos los prestamos, incluso los que ya "
                "tienen uno asignado. Sin esta opcion solo se actualizan los que "
                "tienen periodo=NULL."
            ),
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        reevaluar_todos = options["all"]

        periodos = list(PeriodoAcademico.objects.all())
        if not periodos:
            self.stdout.write(self.style.ERROR("No existen periodos academicos registrados."))
            return

        for modelo, etiqueta in (
            (PrestamoEspacio, "PrestamoEspacio"),
            (PrestamoEspacioPublico, "PrestamoEspacioPublico"),
        ):
            self._procesar_modelo(modelo, etiqueta, periodos, reevaluar_todos, dry_run)

    def _procesar_modelo(self, modelo, etiqueta, periodos, reevaluar_todos, dry_run):
        qs = modelo.objects.all() if reevaluar_todos else modelo.objects.filter(periodo__isnull=True)
        total = qs.count()

        self.stdout.write(f"{etiqueta}: {total} prestamo(s) por revisar.")

        actualizados = 0
        sin_periodo = 0

        with transaction.atomic():
            for prestamo in qs.iterator():
                periodo = next(
                    (
                        p for p in periodos
                        if p.fecha_inicio <= prestamo.fecha <= p.fecha_fin
                    ),
                    None,
                )

                if periodo is None:
                    sin_periodo += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f"  [{etiqueta}#{prestamo.id}] fecha {prestamo.fecha} no esta "
                            "dentro de ningun periodo."
                        )
                    )
                    continue

                if prestamo.periodo_id == periodo.id:
                    continue

                actualizados += 1
                if not dry_run:
                    modelo.objects.filter(pk=prestamo.pk).update(periodo=periodo)

            if dry_run:
                transaction.set_rollback(True)

        self.stdout.write(
            self.style.SUCCESS(
                f"{etiqueta}: actualizados {actualizados}, sin periodo {sin_periodo}."
            )
        )
