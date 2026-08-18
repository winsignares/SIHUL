import csv
import unicodedata

from django.core.management.base import BaseCommand
from django.db.models import Q

from espacios.models import EspacioFisico
from horario.models import Horario


class Command(BaseCommand):
    help = "Lista los horarios asignados a un espacio fisico."

    DIA_ORDEN = {
        "lunes": 2,
        "martes": 3,
        "miercoles": 4,
        "jueves": 5,
        "viernes": 6,
        "sabado": 7,
        "domingo": 1,
    }

    def add_arguments(self, parser):
        parser.add_argument(
            "--espacio",
            type=str,
            default="C 217",
            help='Nombre del espacio fisico a consultar (default: "C 217").',
        )
        parser.add_argument(
            "--contiene",
            action="store_true",
            help="Busca espacios cuyo nombre contenga el texto indicado.",
        )
        parser.add_argument(
            "--seccional",
            type=str,
            default="",
            help="Filtra por ciudad/seccional, por ejemplo Bogota.",
        )
        parser.add_argument(
            "--periodo",
            type=str,
            default="",
            help="Filtra por periodo academico, por ejemplo 20262.",
        )
        parser.add_argument(
            "--estado",
            type=str,
            default="",
            choices=["", "pendiente", "aprobado", "rechazado"],
            help="Filtra por estado del horario.",
        )
        parser.add_argument(
            "--csv",
            type=str,
            default="",
            help="Ruta para exportar el resultado en CSV.",
        )

    @staticmethod
    def _clean(value):
        return str(value or "").strip()

    @classmethod
    def _normalize(cls, value):
        text = cls._clean(value).lower()
        text = unicodedata.normalize("NFKD", text)
        return "".join(char for char in text if not unicodedata.combining(char))

    @classmethod
    def _dia_sort_key(cls, horario):
        return (
            cls.DIA_ORDEN.get(cls._normalize(horario.dia_semana), 99),
            horario.hora_inicio,
            horario.hora_fin,
            horario.id,
        )

    def _get_espacios(self, nombre, contiene):
        espacios = EspacioFisico.objects.select_related("sede", "sede__seccional")
        if contiene:
            return espacios.filter(nombre__icontains=nombre).order_by("nombre")
        return espacios.filter(nombre__iexact=nombre).order_by("nombre")

    def _build_queryset(self, espacios, seccional, periodo, estado):
        qs = Horario.objects.select_related(
            "espacio",
            "espacio__sede",
            "espacio__sede__seccional",
            "asignatura",
            "docente",
            "grupo",
            "grupo__periodo",
            "grupo__programa",
        ).filter(espacio__in=espacios)

        if seccional:
            qs = qs.filter(
                Q(espacio__sede__seccional__ciudad__iexact=seccional)
                | Q(espacio__sede__nombre__icontains=seccional)
            )
        if periodo:
            qs = qs.filter(grupo__periodo__nombre=periodo)
        if estado:
            qs = qs.filter(estado=estado)

        return qs

    @staticmethod
    def _row(horario):
        espacio = horario.espacio
        sede = getattr(espacio, "sede", None)
        seccional = getattr(sede, "seccional", None)
        docente = horario.docente
        grupo = horario.grupo
        asignatura = horario.asignatura
        programa = getattr(grupo, "programa", None)
        periodo = getattr(grupo, "periodo", None)

        return {
            "id": horario.id,
            "dia": horario.dia_semana,
            "inicio": horario.hora_inicio.strftime("%H:%M"),
            "fin": horario.hora_fin.strftime("%H:%M"),
            "estado": horario.estado,
            "espacio": getattr(espacio, "nombre", "") or "",
            "sede": getattr(sede, "nombre", "") or "",
            "seccional": getattr(seccional, "ciudad", "") or "",
            "asignatura_codigo": getattr(asignatura, "codigo", "") or "",
            "asignatura": getattr(asignatura, "nombre", "") or "",
            "grupo": getattr(grupo, "nombre", "") or "",
            "programa": getattr(programa, "nombre", "") or "",
            "periodo": getattr(periodo, "nombre", "") or "",
            "docente": getattr(docente, "nombre", "") or "",
            "estudiantes": horario.cantidad_estudiantes or "",
        }

    def _write_csv(self, path, rows):
        fieldnames = [
            "id",
            "dia",
            "inicio",
            "fin",
            "estado",
            "espacio",
            "sede",
            "seccional",
            "asignatura_codigo",
            "asignatura",
            "grupo",
            "programa",
            "periodo",
            "docente",
            "estudiantes",
        ]
        with open(path, "w", newline="", encoding="utf-8") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    def handle(self, *args, **options):
        nombre_espacio = self._clean(options["espacio"])
        contiene = options["contiene"]
        seccional = self._clean(options["seccional"])
        periodo = self._clean(options["periodo"])
        estado = self._clean(options["estado"])
        csv_path = self._clean(options["csv"])

        espacios = list(self._get_espacios(nombre_espacio, contiene))
        if not espacios:
            self.stdout.write(
                self.style.ERROR(f'No se encontro el espacio fisico "{nombre_espacio}".')
            )
            sugerencias = EspacioFisico.objects.filter(
                nombre__icontains=nombre_espacio.replace(" ", "")
            )[:10]
            if sugerencias:
                self.stdout.write(self.style.WARNING("Espacios similares:"))
                for espacio in sugerencias:
                    self.stdout.write(f"- {espacio.nombre}")
            return

        horarios = sorted(
            self._build_queryset(espacios, seccional, periodo, estado),
            key=self._dia_sort_key,
        )
        rows = [self._row(horario) for horario in horarios]

        filtros = [f"espacio={nombre_espacio}"]
        if seccional:
            filtros.append(f"seccional={seccional}")
        if periodo:
            filtros.append(f"periodo={periodo}")
        if estado:
            filtros.append(f"estado={estado}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Horarios encontrados: {len(rows)} | " + " | ".join(filtros)
            )
        )

        for row in rows:
            self.stdout.write(
                (
                    f"[{row['id']}] {row['dia']} {row['inicio']}-{row['fin']} | "
                    f"{row['asignatura_codigo']} {row['asignatura']} | "
                    f"Grupo: {row['grupo']} | Docente: {row['docente'] or '-'} | "
                    f"Espacio: {row['espacio']} | Sede: {row['sede']} | "
                    f"Periodo: {row['periodo']} | Estado: {row['estado']}"
                )
            )

        if csv_path:
            self._write_csv(csv_path, rows)
            self.stdout.write(self.style.SUCCESS(f"CSV generado: {csv_path}"))
