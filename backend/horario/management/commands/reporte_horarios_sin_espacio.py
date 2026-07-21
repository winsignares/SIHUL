from collections import Counter
from datetime import time as time_obj

from django.core.management.base import BaseCommand
from django.db.models import Q

from horario.models import Horario, StgOracleHorario
from usuarios.management.commands.migrate_staging_to_real import Command as MigrateCommand


class Command(BaseCommand):
    help = (
        "Diagnostica horarios sin espacio: cruza Horario(espacio=NULL) con "
        "StgOracleHorario y lista NOM_AULA no asignados."
    )

    DIA_TO_NUM = {
        "lunes": 1,
        "martes": 2,
        "miercoles": 3,
        "miércoles": 3,
        "jueves": 4,
        "viernes": 5,
        "sabado": 6,
        "sábado": 6,
        "domingo": 7,
    }

    def add_arguments(self, parser):
        parser.add_argument(
            "--seccional",
            type=str,
            default="",
            help="Filtra por seccional (ciudad).",
        )
        parser.add_argument(
            "--periodo",
            type=str,
            default="",
            help="Filtra por periodo academico (ej: 20262).",
        )
        parser.add_argument(
            "--top",
            type=int,
            default=50,
            help="Cantidad maxima de NOM_AULA a mostrar.",
        )

    @staticmethod
    def _norm_text(value):
        return str(value or "").strip()

    @staticmethod
    def _norm_time(value):
        if isinstance(value, time_obj):
            return value.replace(second=0, microsecond=0)
        return value

    def handle(self, *args, **options):
        seccional = self._norm_text(options["seccional"])
        periodo = self._norm_text(options["periodo"])
        top = int(options["top"] or 50)

        migrate_cmd = MigrateCommand()

        horarios_qs = Horario.objects.filter(espacio__isnull=True).select_related(
            "grupo",
            "asignatura",
            "grupo__periodo",
            "grupo__programa__facultad__sede__seccional",
        )
        if seccional:
            horarios_qs = horarios_qs.filter(
                grupo__programa__facultad__sede__seccional__ciudad__iexact=seccional
            )
        if periodo:
            horarios_qs = horarios_qs.filter(grupo__periodo__nombre=periodo)

        stg_qs = StgOracleHorario.objects.filter(estado_registro="valido")
        if periodo:
            stg_qs = stg_qs.filter(periodo_oracle=periodo)
        if seccional:
            stg_qs = stg_qs.filter(nombre_sede_oracle__icontains=seccional)

        stg_index = {}
        for stg in stg_qs.iterator():
            hi = migrate_cmd._parse_time_value(stg.hor_inicio_raw)
            hf = migrate_cmd._parse_time_value(stg.hor_fin_raw)
            key = (
                self._norm_text(stg.id_grupo_oracle),
                self._norm_text(stg.id_asignatura_oracle),
                stg.num_dia_oracle,
                self._norm_time(hi),
                self._norm_time(hf),
            )
            stg_index.setdefault(key, []).append(stg)

        total_sin_espacio = 0
        con_match_stg = 0
        sin_match_stg = 0
        nom_aula_counter = Counter()
        sede_counter = Counter()
        ejemplos = []

        for h in horarios_qs.iterator():
            total_sin_espacio += 1
            num_dia = self.DIA_TO_NUM.get(self._norm_text(h.dia_semana).lower())
            key = (
                self._norm_text(h.grupo_id),
                self._norm_text(getattr(h.asignatura, "codigo", None)),
                num_dia,
                self._norm_time(h.hora_inicio),
                self._norm_time(h.hora_fin),
            )
            matches = stg_index.get(key, [])
            if not matches:
                sin_match_stg += 1
                continue

            con_match_stg += 1
            aula = self._norm_text(matches[0].nom_aula_oracle)
            sede = self._norm_text(matches[0].nombre_sede_oracle) or self._norm_text(
                matches[0].id_sede_oracle
            )
            if aula:
                nom_aula_counter[aula] += 1
                sede_counter[sede] += 1
                if len(ejemplos) < 20:
                    ejemplos.append(
                        {
                            "horario_id": h.id,
                            "grupo_id": h.grupo_id,
                            "asignatura": getattr(h.asignatura, "codigo", ""),
                            "dia": h.dia_semana,
                            "inicio": str(h.hora_inicio),
                            "fin": str(h.hora_fin),
                            "nom_aula_oracle": aula,
                            "sede_oracle": sede,
                        }
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"Horarios sin espacio: {total_sin_espacio} | "
                f"con match en staging: {con_match_stg} | "
                f"sin match en staging: {sin_match_stg}"
            )
        )

        self.stdout.write(self.style.WARNING("Top NOM_AULA no asignados:"))
        for nom_aula, cantidad in nom_aula_counter.most_common(top):
            self.stdout.write(f"{cantidad:>5} | {nom_aula}")

        self.stdout.write(self.style.WARNING("Top sedes Oracle del problema:"))
        for sede, cantidad in sede_counter.most_common(15):
            self.stdout.write(f"{cantidad:>5} | {sede}")

        self.stdout.write(self.style.WARNING("Ejemplos (horario local -> NOM_AULA Oracle):"))
        for e in ejemplos:
            self.stdout.write(
                (
                    f"[H{e['horario_id']}] grupo={e['grupo_id']} asig={e['asignatura']} "
                    f"{e['dia']} {e['inicio']}-{e['fin']} -> "
                    f"{e['nom_aula_oracle']} ({e['sede_oracle']})"
                )
            )
