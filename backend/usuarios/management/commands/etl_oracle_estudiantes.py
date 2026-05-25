import hashlib
import json
import os

import oracledb
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from mysite.oracle_seccional_filter import (
    execute_oracle_query_with_optional_seccional,
    normalize_seccional_name,
)
from usuarios.models import StgOracleEstudiante


class Command(BaseCommand):
    help = 'ETL Oracle para estudiantes: extrae VW_ESTUDIANTES y carga staging idempotente'
    _SECCIONAL_RELATED_PREDICATES = (
        # Predicado robusto: cubre programa por nombre o por id en una sola pasada.
        (
            "UPPER(TRIM(NVL(TO_CHAR(SRC_Q.PROGRAMA), ''))) IN ("
            "SELECT /*+ MATERIALIZE */ DISTINCT UPPER(TRIM(NVL(TO_CHAR(REL_PRG.NOMBRE_PROGRAMA), ''))) "
            "FROM UHORARIOS.VW_PROGRAMAS_ACADEMICOS REL_PRG "
            "WHERE UPPER(TRIM(NVL(TO_CHAR(REL_PRG.NOMBRE_SEDE), ''))) LIKE UPPER(:seccional_like)"
            ") "
            "OR UPPER(TRIM(NVL(TO_CHAR(SRC_Q.PROGRAMA), ''))) IN ("
            "SELECT /*+ MATERIALIZE */ DISTINCT UPPER(TRIM(NVL(TO_CHAR(REL_PRG.ID_PROGRAMA), ''))) "
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
            default=("SELECT * FROM UHORARIOS.VW_ESTUDIANTES"
            "WHERE PERIODO_ACADEMICO = '20261' "),
            default=f"SELECT * FROM UHORARIOS.VW_ESTUDIANTES WHERE PERIODO_ACADEMICO LIKE '{settings.ETL_PERIODO}'",
            help='Consulta Oracle para estudiantes',
        )
        parser.add_argument('--dry-run', action='store_true', help='Simular sin guardar cambios')
        parser.add_argument('--no-input', action='store_true', help='No pedir confirmacion en modo real')
        parser.add_argument('--limit', type=int, default=None)
        parser.add_argument('--offset', type=int, default=0)
        parser.add_argument(
            '--batch-size',
            type=int,
            default=2000,
            help='Tamano de lote para lectura Oracle y escritura bulk en PostgreSQL',
        )
        parser.add_argument(
            '--seccional',
            type=str,
            default='',
            help='Filtra por seccional (directo por sede o indirecto via programa)',
        )

    @staticmethod
    def _to_text(value):
        return str(value or '').strip()

    @staticmethod
    def _first_present(data, keys):
        for key in keys:
            if key in data and data[key] is not None and str(data[key]).strip() != '':
                return data[key]
        return None

    @staticmethod
    def _to_non_negative_int(value, default=None):
        try:
            num = int(float(str(value).strip()))
            return num if num >= 0 else default
        except (TypeError, ValueError, AttributeError):
            return default

    @staticmethod
    def _row_hash(payload):
        return hashlib.sha256(
            json.dumps(payload, sort_keys=True, ensure_ascii=True, default=str).encode('utf-8')
        ).hexdigest()

    @staticmethod
    def _build_nombre_completo(nombres, apellidos, nombre_completo):
        if nombre_completo:
            return nombre_completo
        joined = f'{nombres} {apellidos}'.strip()
        return joined or None

    @staticmethod
    def _chunked(items, chunk_size):
        for idx in range(0, len(items), chunk_size):
            yield items[idx : idx + chunk_size]

    def _fetch_program_tokens_for_seccional(self, cursor, seccional):
        query = """
            SELECT DISTINCT UPPER(TRIM(NVL(TO_CHAR(id_programa), ''))) AS token
            FROM UHORARIOS.VW_PROGRAMAS_ACADEMICOS
            WHERE UPPER(TRIM(NVL(TO_CHAR(nombre_sede), ''))) LIKE UPPER(:seccional_like)
            UNION
            SELECT DISTINCT UPPER(TRIM(NVL(TO_CHAR(nombre_programa), ''))) AS token
            FROM UHORARIOS.VW_PROGRAMAS_ACADEMICOS
            WHERE UPPER(TRIM(NVL(TO_CHAR(nombre_sede), ''))) LIKE UPPER(:seccional_like)
        """
        cursor.execute(query, {'seccional_like': f'%{seccional}%'})
        tokens = {
            self._to_text(row[0]).upper()
            for row in cursor.fetchall()
            if self._to_text(row[0])
        }
        return sorted(tokens)

    def _execute_students_by_program_tokens(self, cursor, base_query, program_tokens):
        if not program_tokens:
            return

        max_in_list = 900  # Oracle ORA-01795 guard
        normalized_program_expr = "UPPER(TRIM(NVL(TO_CHAR(SRC_Q.PROGRAMA), '')))"
        all_clauses = []
        params = {}
        bind_idx = 0

        for token_chunk in self._chunked(program_tokens, max_in_list):
            placeholders = []
            for token in token_chunk:
                bind_name = f'p{bind_idx}'
                bind_idx += 1
                placeholders.append(f':{bind_name}')
                params[bind_name] = token
            all_clauses.append(f"{normalized_program_expr} IN ({', '.join(placeholders)})")

        filtered_query = f"SELECT * FROM ({base_query}) SRC_Q WHERE ({' OR '.join(all_clauses)})"
        cursor.execute(filtered_query, params)

    @staticmethod
    def _build_paginated_query(base_query, limit=None, offset=0):
        safe_offset = max(0, int(offset or 0))
        safe_limit = int(limit) if limit and int(limit) > 0 else None

        if safe_offset == 0 and safe_limit is None:
            return base_query

        if safe_limit is not None:
            upper_bound = safe_offset + safe_limit
            return (
                "SELECT * FROM ("
                "SELECT SRC_Q.*, ROWNUM AS pg_rn "
                f"FROM ({base_query}) SRC_Q "
                f"WHERE ROWNUM <= {upper_bound}"
                f") PAG_Q WHERE pg_rn > {safe_offset}"
            )

        return (
            "SELECT * FROM ("
            "SELECT SRC_Q.*, ROWNUM AS pg_rn "
            f"FROM ({base_query}) SRC_Q"
            f") PAG_Q WHERE pg_rn > {safe_offset}"
        )

    def _build_staged_entry(self, data, summary):
        raw_payload = {
            'tip_identificacion': self._first_present(data, ['tip_identificacion', 'tipo_identificacion']),
            'id_estudiante': self._first_present(data, ['id_estudiante']),
            'codigo_estudiante': self._first_present(data, ['codigo_estudiante']),
            'nombres': self._first_present(data, ['nombres']),
            'apellidos': self._first_present(data, ['apellidos']),
            'nombre_completo': self._first_present(data, ['nombre_completo']),
            'semestre': self._first_present(data, ['semestre']),
            'periodo_academico': self._first_present(data, ['periodo_academico']),
            'programa': self._first_present(data, ['programa']),
        }

        tipo_identificacion = self._to_text(raw_payload['tip_identificacion'])
        id_estudiante_oracle = self._to_text(raw_payload['id_estudiante'])
        codigo_estudiante_oracle = self._to_text(raw_payload['codigo_estudiante'])
        nombres = self._to_text(raw_payload['nombres'])
        apellidos = self._to_text(raw_payload['apellidos'])
        nombre_completo_oracle = self._to_text(raw_payload['nombre_completo'])

        if tipo_identificacion and id_estudiante_oracle:
            external_id = f'{tipo_identificacion}:{id_estudiante_oracle}'
        elif id_estudiante_oracle:
            external_id = id_estudiante_oracle
        elif codigo_estudiante_oracle:
            external_id = codigo_estudiante_oracle
        else:
            external_id = f'NOID:{self._row_hash({"nombres": nombres, "apellidos": apellidos})[:16]}'
            summary['staging']['without_strong_id'] += 1

        row_hash = self._row_hash({'raw_payload': raw_payload, 'raw_row': data})
        defaults = {
            'tipo_identificacion': tipo_identificacion or None,
            'id_estudiante_oracle': id_estudiante_oracle or None,
            'codigo_estudiante_oracle': codigo_estudiante_oracle or None,
            'nombres': nombres or None,
            'apellidos': apellidos or None,
            'nombre_completo': self._build_nombre_completo(
                nombres,
                apellidos,
                nombre_completo_oracle,
            ),
            'semestre_oracle': self._to_non_negative_int(raw_payload['semestre'], default=None),
            'periodo_academico': self._to_text(raw_payload['periodo_academico']) or None,
            'programa_oracle': self._to_text(raw_payload['programa']) or None,
            'raw_data': data,
            'row_hash': row_hash,
            'estado_registro': (
                'valido'
                if (tipo_identificacion and id_estudiante_oracle)
                or id_estudiante_oracle
                or codigo_estudiante_oracle
                else 'sin_identificador'
            ),
        }
        return external_id, defaults

    def _upsert_batch(self, source_system, staged_by_external, summary):
        if not staged_by_external:
            return

        existing_qs = StgOracleEstudiante.objects.filter(
            source_system=source_system,
            external_id__in=staged_by_external.keys(),
        )
        existing_by_external = {obj.external_id: obj for obj in existing_qs}
        now = timezone.now()
        to_create = []
        to_update = []

        for external_id, defaults in staged_by_external.items():
            current = existing_by_external.get(external_id)
            if current is None:
                summary['staging']['created'] += 1
                to_create.append(
                    StgOracleEstudiante(
                        source_system=source_system,
                        external_id=external_id,
                        fecha_carga=now,
                        **defaults,
                    )
                )
                continue

            if current.row_hash == defaults['row_hash']:
                summary['staging']['unchanged'] += 1
                continue

            summary['staging']['updated'] += 1
            for field_name, field_value in defaults.items():
                setattr(current, field_name, field_value)
            current.fecha_carga = now
            to_update.append(current)

        if to_create:
            StgOracleEstudiante.objects.bulk_create(to_create, batch_size=1000)
        if to_update:
            StgOracleEstudiante.objects.bulk_update(
                to_update,
                fields=[
                    'tipo_identificacion',
                    'id_estudiante_oracle',
                    'codigo_estudiante_oracle',
                    'nombres',
                    'apellidos',
                    'nombre_completo',
                    'semestre_oracle',
                    'periodo_academico',
                    'programa_oracle',
                    'raw_data',
                    'row_hash',
                    'estado_registro',
                    'fecha_carga',
                ],
                batch_size=1000,
            )

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
        offset = options['offset']
        batch_size = max(100, int(options['batch_size'] or 2000))
        seccional = options['seccional']

        if not all([host, user, password, service]):
            self.stdout.write(self.style.ERROR('Faltan credenciales Oracle (host/user/password/service)'))
            return

        if not dry_run and not no_input:
            self.stdout.write(self.style.WARNING('Modo REAL: se escribira en tabla staging de estudiantes'))
            confirm = input('Deseas continuar? (s/n): ').strip().lower()
            if confirm != 's':
                self.stdout.write(self.style.WARNING('Operacion cancelada'))
                return

        conn = None
        cursor = None
        summary = {
            'extract': {'rows': 0, 'columns': []},
            'staging': {
                'created': 0,
                'updated': 0,
                'unchanged': 0,
                'without_strong_id': 0,
                'unique_external_ids': 0,
                'duplicate_external_ids_in_batch': 0,
            },
            'dry_run': dry_run,
        }

        try:
            conn = oracledb.connect(user=user, password=password, dsn=f'{host}:{port}/{service}')
            cursor = conn.cursor()
            cursor.arraysize = batch_size
            normalized_seccional = normalize_seccional_name(seccional)
            columns = []
            paginated_query = self._build_paginated_query(query, limit=limit, offset=offset)

            if normalized_seccional:
                self.stdout.write(f"Filtro seccional optimizado para estudiantes: {normalized_seccional}")
                program_tokens = self._fetch_program_tokens_for_seccional(cursor, normalized_seccional)
                self.stdout.write(f'Programas de la seccional detectados: {len(program_tokens)}')
                self._execute_students_by_program_tokens(cursor, paginated_query, program_tokens)
                columns = [desc[0].lower() for desc in cursor.description]
            else:
                execute_oracle_query_with_optional_seccional(
                    cursor,
                    paginated_query,
                    seccional=seccional,
                    seccional_columns=('SEDE', 'NOMBRE_SEDE'),
                    seccional_related_predicates=self._SECCIONAL_RELATED_PREDICATES,
                    limit=None,
                    stdout=self.stdout,
                )
                columns = [desc[0].lower() for desc in cursor.description]

            summary['extract']['columns'] = columns
            processed_external_ids_global = set()
            while True:
                fetched = cursor.fetchmany(batch_size)
                if not fetched:
                    break

                summary['extract']['rows'] += len(fetched)
                staged_by_external = {}

                for row in fetched:
                    data = dict(zip(columns, row))
                    external_id, defaults = self._build_staged_entry(data, summary)
                    if external_id in staged_by_external:
                        summary['staging']['duplicate_external_ids_in_batch'] += 1
                    staged_by_external[external_id] = defaults

                processed_external_ids_global.update(staged_by_external.keys())
                summary['staging']['unique_external_ids'] = len(processed_external_ids_global)

                if not dry_run:
                    with transaction.atomic():
                        self._upsert_batch(source_system, staged_by_external, summary)

                self.stdout.write(
                    f"Lote procesado: {len(fetched)} filas | "
                    f"Total: {summary['extract']['rows']}"
                )

            self.stdout.write(self.style.SUCCESS(f"Registros Oracle extraidos: {summary['extract']['rows']}"))

            if dry_run:
                self.stdout.write(self.style.WARNING('DRY-RUN: no se guarda staging de estudiantes'))
                self.stdout.write(str(summary))
                return

            self.stdout.write(self.style.SUCCESS('ETL estudiantes finalizado (Oracle -> staging)'))
            self.stdout.write(str(summary))

        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Error en ETL estudiantes: {exc}'))
            import traceback
            traceback.print_exc()
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
