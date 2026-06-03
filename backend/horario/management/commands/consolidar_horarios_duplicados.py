from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count

from horario.models import Horario, HorarioEstudiante, SolicitudEspacio


class Command(BaseCommand):
    help = (
        "Consolida horarios duplicados por bloque "
        "(grupo, asignatura, dia, hora_inicio, hora_fin)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Aplica cambios. Sin esta bandera solo simula.",
        )
        parser.add_argument(
            "--limit-slots",
            type=int,
            default=None,
            help="Limita cantidad de slots duplicados a procesar.",
        )

    @staticmethod
    def _estado_rank(value):
        order = {"aprobado": 3, "pendiente": 2, "rechazado": 1}
        return order.get(str(value or "").strip().lower(), 0)

    @staticmethod
    def _pick_keeper(candidatos):
        def score(h):
            return (
                1 if h.espacio_id else 0,
                1 if h.docente_id else 0,
                1 if h.cantidad_estudiantes is not None else 0,
                Command._estado_rank(h.estado),
                -h.id,  # preferimos menor id
            )

        return sorted(candidatos, key=score, reverse=True)[0]

    def handle(self, *args, **options):
        apply_changes = bool(options["apply"])
        limit_slots = options["limit_slots"]

        slots = (
            Horario.objects.values(
                "grupo_id",
                "asignatura_id",
                "dia_semana",
                "hora_inicio",
                "hora_fin",
            )
            .annotate(total=Count("id"))
            .filter(total__gt=1)
            .order_by("-total")
        )
        if limit_slots:
            slots = slots[: int(limit_slots)]

        summary = {
            "slots_duplicados": 0,
            "horarios_revisados": 0,
            "horarios_eliminados": 0,
            "horarios_consolidados": 0,
            "estudiantes_movidos": 0,
            "solicitudes_movidas": 0,
            "solicitudes_conflicto": 0,
            "keeper_actualizado": 0,
            "dry_run": not apply_changes,
        }

        for slot in slots:
            horarios = list(
                Horario.objects.filter(
                    grupo_id=slot["grupo_id"],
                    asignatura_id=slot["asignatura_id"],
                    dia_semana=slot["dia_semana"],
                    hora_inicio=slot["hora_inicio"],
                    hora_fin=slot["hora_fin"],
                )
                .select_related("docente", "espacio")
                .order_by("id")
            )
            if len(horarios) <= 1:
                continue

            summary["slots_duplicados"] += 1
            summary["horarios_revisados"] += len(horarios)

            keeper = self._pick_keeper(horarios)
            duplicates = [h for h in horarios if h.id != keeper.id]

            if not apply_changes:
                summary["horarios_eliminados"] += len(duplicates)
                continue

            with transaction.atomic():
                keeper_changed = False
                for dup in duplicates:
                    # Completar datos del keeper con campos faltantes.
                    if not keeper.espacio_id and dup.espacio_id:
                        keeper.espacio = dup.espacio
                        keeper_changed = True
                    if not keeper.docente_id and dup.docente_id:
                        keeper.docente = dup.docente
                        keeper_changed = True
                    if keeper.cantidad_estudiantes is None and dup.cantidad_estudiantes is not None:
                        keeper.cantidad_estudiantes = dup.cantidad_estudiantes
                        keeper_changed = True
                    if self._estado_rank(dup.estado) > self._estado_rank(keeper.estado):
                        keeper.estado = dup.estado
                        keeper_changed = True

                if keeper_changed:
                    keeper.save()
                    summary["keeper_actualizado"] += 1

                for dup in duplicates:
                    for he in HorarioEstudiante.objects.filter(horario=dup).select_related("estudiante"):
                        moved, created = HorarioEstudiante.objects.get_or_create(
                            horario=keeper,
                            estudiante=he.estudiante,
                        )
                        if created:
                            summary["estudiantes_movidos"] += 1
                        he.delete()

                    solicitud_dup = SolicitudEspacio.objects.filter(horario_generado=dup).first()
                    if solicitud_dup:
                        solicitud_keeper = SolicitudEspacio.objects.filter(horario_generado=keeper).first()
                        if solicitud_keeper is None:
                            solicitud_dup.horario_generado = keeper
                            solicitud_dup.save(update_fields=["horario_generado"])
                            summary["solicitudes_movidas"] += 1
                        else:
                            summary["solicitudes_conflicto"] += 1

                    dup.delete()
                    summary["horarios_eliminados"] += 1

            summary["horarios_consolidados"] += 1

        self.stdout.write(self.style.SUCCESS(str(summary)))
