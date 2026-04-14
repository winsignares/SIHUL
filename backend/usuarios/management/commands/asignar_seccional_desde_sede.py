from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import F, OuterRef, Q, Subquery

from sedes.models import Sede
from usuarios.models import Usuario


class Command(BaseCommand):
    help = (
        "Asigna la seccional de cada usuario desde su sede "
        "(usuario.seccional = usuario.sede.seccional)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Muestra el conteo de cambios sin guardar en base de datos.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        usuarios_con_sede = Usuario.objects.filter(sede_id__isnull=False)
        usuarios_sin_sede = Usuario.objects.filter(sede_id__isnull=True).count()

        # Incluye diferencias entre valores nulos y no nulos, y valores distintos.
        mismatch_q = (
            Q(seccional_id__isnull=True, sede__seccional_id__isnull=False)
            | Q(seccional_id__isnull=False, sede__seccional_id__isnull=True)
            | (
                Q(seccional_id__isnull=False, sede__seccional_id__isnull=False)
                & ~Q(seccional_id=F("sede__seccional_id"))
            )
        )

        por_actualizar = usuarios_con_sede.filter(mismatch_q).count()
        total_con_sede = usuarios_con_sede.count()

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "Modo simulacion: no se aplicaron cambios. "
                    f"Usuarios con sede: {total_con_sede}. "
                    f"Usuarios sin sede (sin cambios): {usuarios_sin_sede}. "
                    f"Usuarios a actualizar: {por_actualizar}."
                )
            )
            return

        with transaction.atomic():
            actualizados = usuarios_con_sede.update(
                seccional_id=Subquery(
                    Sede.objects.filter(pk=OuterRef("sede_id")).values("seccional_id")[:1]
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Sincronizacion completada. "
                f"Usuarios con sede procesados: {actualizados}. "
                f"Usuarios realmente actualizados: {por_actualizar}. "
                f"Usuarios sin sede (sin cambios): {usuarios_sin_sede}."
            )
        )
