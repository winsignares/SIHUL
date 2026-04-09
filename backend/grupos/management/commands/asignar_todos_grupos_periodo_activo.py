from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q

from grupos.models import Grupo
from periodos.models import PeriodoAcademico


class Command(BaseCommand):
    help = (
        "Asigna el periodo academico activo a los grupos. "
        "Por defecto actualiza todos los grupos."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Muestra cuandos grupos cambiaria sin aplicar cambios.",
        )
        parser.add_argument(
            "--only-invalid",
            action="store_true",
            help=(
                "Solo actualiza grupos sin periodo (NULL) o con periodo huerfano. "
                "Sin esta opcion se actualizan todos los grupos."
            ),
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        only_invalid = options["only_invalid"]

        periodos_activos = PeriodoAcademico.objects.filter(activo=True).order_by("-fecha_inicio", "-id")

        if not periodos_activos.exists():
            raise CommandError("No existe un periodo activo. Activa uno antes de ejecutar el script.")

        if periodos_activos.count() > 1:
            activos = ", ".join(f"{p.id}:{p.nombre}" for p in periodos_activos)
            raise CommandError(
                "Hay multiples periodos activos. Deja solo uno activo y vuelve a ejecutar. "
                f"Activos detectados: {activos}"
            )

        periodo_activo = periodos_activos.first()
        assert periodo_activo is not None

        if only_invalid:
            periodos_validos = PeriodoAcademico.objects.values_list("id", flat=True)
            grupos_qs = Grupo.objects.filter(
                Q(periodo_id__isnull=True) | ~Q(periodo_id__in=periodos_validos)
            )
        else:
            grupos_qs = Grupo.objects.exclude(periodo_id=periodo_activo.id)

        total_objetivo = grupos_qs.count()

        self.stdout.write(
            self.style.WARNING(
                f"Periodo activo: {periodo_activo.id} - {periodo_activo.nombre}. "
                f"Grupos objetivo: {total_objetivo}."
            )
        )

        if dry_run:
            self.stdout.write(self.style.SUCCESS("Dry-run completado. No se aplicaron cambios."))
            transaction.set_rollback(True)
            return

        actualizados = grupos_qs.update(periodo=periodo_activo)

        self.stdout.write(
            self.style.SUCCESS(
                f"Proceso completado. Grupos actualizados: {actualizados}."
            )
        )
