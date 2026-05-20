import os

import oracledb
from django.core.management.base import BaseCommand
from django.db import transaction

from asignaturas.models import Asignatura, AsignaturaPrograma
from facultades.models import Facultad
from mysite.oracle_seccional_filter import execute_oracle_query_with_optional_seccional
from programas.models import Programa, StgOraclePrograma


class Command(BaseCommand):
    help = 'ETL Oracle dedicado para AsignaturasPrograma desde VW_ASIGNATURA_PROGRAMA'
    _SECCIONAL_RELATED_PREDICATES = (
        (
            "UPPER(TRIM(NVL(TO_CHAR(SRC_Q.ID_PROGRAMA), ''))) IN ("
            "SELECT /*+ MATERIALIZE */ DISTINCT UPPER(TRIM(NVL(TO_CHAR(REL_PRG.ID_PROGRAMA), ''))) "
            "FROM UHORARIOS.VW_PROGRAMAS_ACADEMICOS REL_PRG "
            "WHERE UPPER(TRIM(NVL(TO_CHAR(REL_PRG.NOMBRE_SEDE), ''))) LIKE UPPER(:seccional_like)"
            ")"
        ),
        (
            "UPPER(TRIM(NVL(TO_CHAR(SRC_Q.NOMBRE_PROGRAMA), ''))) IN ("
            "SELECT /*+ MATERIALIZE */ DISTINCT UPPER(TRIM(NVL(TO_CHAR(REL_PRG.NOMBRE_PROGRAMA), ''))) "
            "FROM UHORARIOS.VW_PROGRAMAS_ACADEMICOS REL_PRG "
            "WHERE UPPER(TRIM(NVL(TO_CHAR(REL_PRG.NOMBRE_SEDE), ''))) LIKE UPPER(:seccional_like)"
            ")"
        ),
    )

    def add_arguments(self, parser):
        parser.add_argument('--host', type=str, default=os.getenv('ORACLE_HOST', ''))
        parser.add_argument('--port', type=int, default=int(os.getenv('ORACLE_PORT', 1521)))
        parser.add_argument('--user', type=str, default=os.getenv('ORACLE_USER', ''))
        parser.add_argument('--password', type=str, default=os.getenv('ORACLE_PASSWORD', ''))
        parser.add_argument('--service', type=str, default=os.getenv('ORACLE_SERVICE', ''))
        parser.add_argument('--source-system', type=str, default='ORACLE_SIU')
        parser.add_argument(
            '--query',
            type=str,
            default='SELECT * FROM UHORARIOS.VW_ASIGNATURA_PROGRAMA',
            help='Consulta Oracle para asignaturas por programa',
        )
        parser.add_argument('--dry-run', action='store_true', help='Simular sin guardar cambios')
        parser.add_argument('--no-input', action='store_true', help='No pedir confirmacion en modo real')
        parser.add_argument('--limit', type=int, default=None)
        parser.add_argument(
            '--seccional',
            type=str,
            default='',
            help='Filtra por seccional (directo por sede o indirecto por id_sede/programa)',
        )

    @staticmethod
    def _to_non_negative_int(value, default=0):
        try:
            num = int(value)
            return num if num >= 0 else default
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _first_present(data, keys):
        for key in keys:
            if key in data and data[key] is not None and str(data[key]).strip() != '':
                return data[key]
        return None

    @staticmethod
    def _to_text(value):
        return str(value or '').strip()

    @staticmethod
    def _truncate(value, max_length):
        text = str(value or '').strip()
        if len(text) <= max_length:
            return text, False
        return text[:max_length], True

    def handle(self, *args, **options):
        host = options['host']
        port = options['port']
        user = options['user']
        password = options['password']
        service = options['service']
        source_system = options['source_system']
        query = options['query']
        dry_run = options['dry_run']
        no_input = options['no_input']
        limit = options['limit']
        seccional = options['seccional']

        if not all([host, user, password, service]):
            self.stdout.write(self.style.ERROR('Faltan credenciales Oracle (host/user/password/service)'))
            return

        if not dry_run and not no_input:
            self.stdout.write(self.style.WARNING('Modo REAL: se guardaran cambios en asignaturas_programa'))
            confirm = input('Deseas continuar? (s/n): ').strip().lower()
            if confirm != 's':
                self.stdout.write(self.style.WARNING('Operacion cancelada'))
                return

        conn = None
        cursor = None
        summary = {
            'extracted': 0,
            'valid': 0,
            'invalid': 0,
            'programa_not_found': 0,
            'asignatura_not_found': 0,
            'programa_resolved_from_staging': 0,
            'programa_created_from_staging': 0,
            'programa_would_create_from_staging': 0,
            'programa_staging_not_found': 0,
            'programa_staging_without_facultad': 0,
            'programa_nombre_truncated': 0,
            'to_create': 0,
            'to_update': 0,
            'created': 0,
            'updated': 0,
            'unchanged': 0,
            'duplicates_skipped': 0,
            'dry_run': dry_run,
        }

        try:
            conn = oracledb.connect(user=user, password=password, dsn=f'{host}:{port}/{service}')
            cursor = conn.cursor()
            query_filter_status = execute_oracle_query_with_optional_seccional(
                cursor,
                query,
                seccional=seccional,
                seccional_columns=('SEDE', 'NOMBRE_SEDE'),
                seccional_related_predicates=self._SECCIONAL_RELATED_PREDICATES,
                stdout=self.stdout,
            )

            rows = cursor.fetchall()
            columns = [desc[0].lower() for desc in cursor.description]
            if query_filter_status.get('filter_mode') == 'related_sql':
                self.stdout.write(
                    'Filtro por seccional aplicado en Oracle via relacion SQL '
                    '(asignatura_programa -> programas_academicos -> sede).'
                )

            if limit:
                rows = rows[:limit]

            summary['extracted'] = len(rows)
            self.stdout.write(self.style.SUCCESS(f'Registros extraidos: {len(rows)} columnas={columns}'))

            # Pre-cargar lookups para mejor rendimiento
            programas_by_id = {p.id: p for p in Programa.objects.all()}
            program_name_max = Programa._meta.get_field('nombre').max_length

            requested_program_ids = {
                self._to_text(self._first_present(dict(zip(columns, row)), ['id_programa']))
                for row in rows
            }
            requested_program_ids.discard('')

            stg_programas_by_external = {
                stg.external_id: stg
                for stg in StgOraclePrograma.objects.filter(
                    source_system=source_system,
                    external_id__in=requested_program_ids,
                )
            }

            facultades = list(Facultad.objects.all())
            facultades_by_external = {
                (self._to_text(f.source_system), self._to_text(f.external_id)): f
                for f in facultades
                if self._to_text(f.external_id)
            }
            facultades_by_external_any_source = {
                self._to_text(f.external_id): f
                for f in facultades
                if self._to_text(f.external_id)
            }

            resolved_program_ids = set()
            created_program_ids = set()
            would_create_program_ids = set()
            asignaturas_by_codigo = {}
            for asignatura in Asignatura.objects.all():
                codigo = self._to_text(asignatura.codigo)
                if not codigo:
                    continue
                # Clave exacta.
                asignaturas_by_codigo.setdefault(codigo, asignatura)
                # Clave numerica normalizada para absorber formatos como 00123 vs 123.
                if codigo.isdigit():
                    asignaturas_by_codigo.setdefault(str(int(codigo)), asignatura)

            self.stdout.write(f'  Programas en DB: {len(programas_by_id)}')
            self.stdout.write(f'  Asignaturas en DB: {len(asignaturas_by_codigo)} codigos indexados')

            parsed = []
            seen_keys = set()

            for row in rows:
                data = dict(zip(columns, row))

                id_programa = self._to_non_negative_int(
                    self._first_present(data, ['id_programa']), default=None
                )
                id_asignatura_raw = self._first_present(data, ['id_asignatura'])
                codigo_asignatura = self._to_text(id_asignatura_raw)
                semestre = self._to_non_negative_int(
                    self._first_present(data, ['semestre']), default=1
                )

                if not id_programa or not codigo_asignatura:
                    summary['invalid'] += 1
                    continue

                # Validar que existan en la BD local
                programa = programas_by_id.get(id_programa)
                asignatura = asignaturas_by_codigo.get(codigo_asignatura)
                if asignatura is None:
                    id_asignatura_num = self._to_non_negative_int(id_asignatura_raw, default=None)
                    if id_asignatura_num is not None:
                        asignatura = asignaturas_by_codigo.get(str(id_asignatura_num))

                if not programa:
                    stg = stg_programas_by_external.get(str(id_programa))
                    if stg is None:
                        summary['programa_not_found'] += 1
                        summary['programa_staging_not_found'] += 1
                        continue

                    id_fac_oracle = self._to_text(stg.id_facultad_oracle)
                    facultad = None
                    if id_fac_oracle:
                        facultad = facultades_by_external.get((source_system, id_fac_oracle))
                        if facultad is None:
                            facultad = facultades_by_external_any_source.get(id_fac_oracle)

                    if facultad is None:
                        summary['programa_not_found'] += 1
                        summary['programa_staging_without_facultad'] += 1
                        continue

                    nombre_programa, was_truncated = self._truncate(stg.nombre_programa, program_name_max)
                    if was_truncated:
                        summary['programa_nombre_truncated'] += 1

                    if dry_run:
                        programa = Programa(
                            id=id_programa,
                            nombre=nombre_programa,
                            facultad=facultad,
                            semestres=10,
                            activo=True,
                        )
                        if id_programa not in would_create_program_ids:
                            summary['programa_would_create_from_staging'] += 1
                            would_create_program_ids.add(id_programa)
                    else:
                        programa, created = Programa.objects.get_or_create(
                            id=id_programa,
                            defaults={
                                'nombre': nombre_programa,
                                'facultad': facultad,
                                'semestres': 10,
                                'activo': True,
                            },
                        )
                        if created and id_programa not in created_program_ids:
                            summary['programa_created_from_staging'] += 1
                            created_program_ids.add(id_programa)

                    programas_by_id[id_programa] = programa
                    if id_programa not in resolved_program_ids:
                        summary['programa_resolved_from_staging'] += 1
                        resolved_program_ids.add(id_programa)

                if not asignatura:
                    summary['asignatura_not_found'] += 1
                    continue

                # Evitar duplicados en el mismo lote
                key = (id_programa, asignatura.id, semestre)
                if key in seen_keys:
                    summary['duplicates_skipped'] += 1
                    continue

                seen_keys.add(key)
                summary['valid'] += 1

                parsed.append(
                    {
                        'programa': programa,
                        'asignatura': asignatura,
                        'semestre': semestre,
                        'nombre_programa': self._first_present(data, ['nombre_programa']),
                        'nombre_asignatura': self._first_present(data, ['nombre_asignatura']),
                    }
                )

            self.stdout.write(
                self.style.SUCCESS(
                    f'Registros validos para procesar: {summary["valid"]}'
                )
            )

            # Determinar acciones
            existing_by_key = {
                (ap.programa.id, ap.asignatura.id, ap.semestre): ap
                for ap in AsignaturaPrograma.objects.filter(
                    programa__in=[p['programa'].id for p in parsed],
                    asignatura__in=[p['asignatura'].id for p in parsed],
                )
            }

            for item in parsed:
                key = (item['programa'].id, item['asignatura'].id, item['semestre'])
                if key not in existing_by_key:
                    summary['to_create'] += 1
                else:
                    summary['to_update'] += 1

            if dry_run:
                self.stdout.write(self.style.WARNING('DRY-RUN: no se guardaron cambios'))
                self.stdout.write(str(summary))
                return

            # Ejecutar cambios
            with transaction.atomic():
                for item in parsed:
                    _, created = AsignaturaPrograma.objects.get_or_create(
                        programa=item['programa'],
                        asignatura=item['asignatura'],
                        semestre=item['semestre'],
                        defaults={'componente_formativo': 'profesional'},
                    )

                    if created:
                        summary['created'] += 1
                    else:
                        summary['unchanged'] += 1

            self.stdout.write(self.style.SUCCESS('ETL asignaturas_programa finalizado'))
            self.stdout.write(str(summary))

        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Error en ETL asignaturas_programa: {exc}'))
            import traceback
            traceback.print_exc()
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
