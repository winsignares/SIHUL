from django.core.management.base import BaseCommand

from horario.models import Horario


class Command(BaseCommand):
    help = (
        "Lista horarios con espacio asignado para una seccional "
        "(por defecto: Bogota)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--seccional",
            type=str,
            default="Bogota",
            help="Nombre de la ciudad/seccional a filtrar (default: Bogota).",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=100,
            help="Cantidad maxima de filas a mostrar en detalle (default: 100).",
        )
        parser.add_argument(
            "--solo-resumen",
            action="store_true",
            help="Muestra solo el resumen y no el detalle de horarios.",
        )

    def handle(self, *args, **options):
        seccional = str(options["seccional"] or "").strip()
        limit = int(options["limit"] or 0)
        solo_resumen = options["solo_resumen"]

        base_qs = (
            Horario.objects.select_related(
                "espacio",
                "espacio__sede",
                "espacio__sede__seccional",
                "asignatura",
                "grupo",
            )
            .filter(
                espacio__isnull=False,
                espacio__sede__seccional__ciudad__iexact=seccional,
            )
            .order_by("dia_semana", "hora_inicio", "hora_fin", "id")
        )

        total = base_qs.count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Seccional: {seccional} | Horarios con espacio asignado: {total}"
            )
        )

        if solo_resumen or total == 0:
            return

        shown = 0
        for horario in base_qs[:limit]:
            asignatura = getattr(horario.asignatura, "nombre", "") or "-"
            grupo = getattr(horario.grupo, "nombre", "") or "-"
            espacio = getattr(horario.espacio, "nombre", "") or "-"
            sede = getattr(horario.espacio.sede, "nombre", "") or "-"
            self.stdout.write(
                (
                    f"[{horario.id}] {horario.dia_semana} "
                    f"{horario.hora_inicio}-{horario.hora_fin} | "
                    f"Asignatura: {asignatura} | Grupo: {grupo} | "
                    f"Espacio: {espacio} | Sede: {sede}"
                )
            )
            shown += 1

        if total > shown:
            self.stdout.write(
                self.style.WARNING(
                    f"Mostrados: {shown} de {total}. "
                    "Ajusta --limit para ver mas registros."
                )
            )
