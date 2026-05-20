import hashlib
import json
import os
import time

import oracledb
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from mysite.oracle_seccional_filter import execute_oracle_query_with_optional_seccional
from usuarios.models import StgOracleEstudiante


class Command(BaseCommand):
    help = 'ETL Oracle para estudiantes: extrae VW_ESTUDIANTES y carga staging idempotente'
    _SECCIONAL_RELATED_PREDICATES = (
        (
            "SRC_Q.PROGRAMA IN ("
            "SELECT /*+ MATERIALIZE */ DISTINCT REL_PRG.NOMBRE_PROGRAMA "
            "FROM UHORARIOS.VW_PROGRAMAS_ACADEMICOS REL_PRG "
            "WHERE REL_PRG.NOMBRE_SEDE = :seccional_exact "
            "OR UPPER(TRIM(NVL(TO_CHAR(REL_PRG.NOMBRE_SEDE), ''))) LIKE UPPER(:seccional_like)"
            ")"
        ),
        (
            "SRC_Q.PROGRAMA IN ("
            "SELECT /*+ MATERIALIZE */ DISTINCT REL_PRG.ID_PROGRAMA "
            "FROM UHORARIOS.VW_PROGRAMAS_ACADEMICOS REL_PRG "
            "WHERE REL_PRG.NOMBRE_SEDE = :seccional_exact "
            "OR UPPER(TRIM(NVL(TO_CHAR(REL_PRG.NOMBRE_SEDE), ''))) LIKE UPPER(:seccional_like)"
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
            default='SELECT * FROM UHORARIOS.VW_ESTUDIANTES',
            help='Consulta Oracle para estudiantes',
        )
        parser.add_argument('--dry-run', action='store_true', help='Simular sin guardar cambios')
        parser.add_argument('--no-input', action='store_true', help='No pedir confirmacion en modo real')
        parser.add_argument('--limit', type=int, default=None)
        parser.add_argument(
            '--fetch-size',
            type=int,
            default=int(os.getenv('ORACLE_FETCH_SIZE', 10000)),
            help='Tamano de lote de fetch Oracle (arraysize/prefetchrows)',
        )
        parser.add_argument(
            '--progress-every',
            type=int,
            default=int(os.getenv('ETL_PROGRESS_EVERY', 5000)),
            help='Emitir progreso cada N filas procesadas por fase',
        )
        parser.add_argument(
            '--progress-interval-sec',
            type=int,
            default=int(os.getenv('ETL_PROGRESS_INTERVAL_SEC', 20)),
            help='Emitir progreso al menos cada N segundos',
        )
        parser.add_argument(
            '--write-batch-size',
            type=int,
            default=int(os.getenv('ETL_WRITE_BATCH_SIZE', 1000)),
            help='Tamano de lote para bulk_create/bulk_update en staging',
        )
        parser.add_argument(
            '--diff-batch-size',
            type=int,
            default=int(os.getenv('ETL_DIFF_BATCH_SIZE', 20000)),
            help='Tamano de lote para comparar hash contra staging',
        )
        parser.add_argument(
            '--seccional',
            type=str,
            default='',
            help='Filtra por seccional (directo por sede o indirecto via programa)',
        )
        parser.add_argument(
            '--skip-raw-data',
            action='store_true',
            help='No persistir raw_data (reduce I/O y almacenamiento en cargas grandes)',
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
    def _build_nombre_completo(nombres, apellidos):
        joined = f'{nombres} {apellidos}'.strip()
        return joined or None

    @staticmethod
    def _chunked(items, chunk_size):
        for idx in range(0, len(items), chunk_size):
            yield items[idx : idx + chunk_size]

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
        fetch_size = max(1, int(options['fetch_size'] or 1))
        progress_every = max(1, int(options['progress_every'] or 1))
        progress_interval_sec = max(1, int(options['progress_interval_sec'] or 1))
        write_batch_size = max(1, int(options['write_batch_size'] or 1))
        diff_batch_size = max(1, int(options['diff_batch_size'] or 1))
        seccional = options['seccional']
        skip_raw_data = options['skip_raw_data']

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
        started_at = time.monotonic()

        try:
            conn = oracledb.connect(user=user, password=password, dsn=f'{host}:{port}/{service}')
            cursor = conn.cursor()
            cursor.arraysize = fetch_size
            cursor.prefetchrows = fetch_size
            limit_value = int(limit) if limit and int(limit) > 0 else None
            self.stdout.write(
                f'Iniciando ETL estudiantes: fetch_size={fetch_size}, '
                f'progress_every={progress_every}, progress_interval_sec={progress_interval_sec}, '
                f'limit={limit_value or "sin limite"}, '
                f'skip_raw_data={skip_raw_data}'
            )
            sql_execute_started_at = time.monotonic()
            query_filter_status = execute_oracle_query_with_optional_seccional(
                cursor,
                query,
                seccional=seccional,
                seccional_columns=('SEDE', 'NOMBRE_SEDE'),
                seccional_related_predicates=self._SECCIONAL_RELATED_PREDICATES,
                limit=limit_value,
                stdout=self.stdout,
            )
            self.stdout.write(
                f'[SQL] Consulta Oracle ejecutada en {int(time.monotonic() - sql_execute_started_at)}s'
            )
            columns = [desc[0].lower() for desc in cursor.description]
            summary['extract']['columns'] = columns
            if query_filter_status.get('filter_mode') == 'related_sql':
                self.stdout.write(
                    'Filtro por seccional aplicado en Oracle via relacion SQL '
                    '(estudiantes -> programas_academicos -> sede).'
                )

            col_idx = {name: idx for idx, name in enumerate(columns)}

            def _pick(row, *names):
                for name in names:
                    idx = col_idx.get(name)
                    if idx is None:
                        continue
                    value = row[idx]
                    if value is None:
                        continue
                    if str(value).strip() == '':
                        continue
                    return value
                return None

            update_fields = [
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
            ]

            seen_external_ids = set()
            buffered_by_external = {}
            unique_external_count = 0
            processed_unique = 0
            persisted_count = 0
            total_changed = 0
            last_load_report_count = 0
            last_load_report_ts = time.monotonic()

            self.stdout.write(
                f'[DIFF] Modo streaming: diff_batch_size={diff_batch_size}, '
                f'write_batch_size={write_batch_size}'
            )
            if not dry_run:
                self.stdout.write('[LOAD] Carga incremental por lotes activada (menor uso de memoria).')

            def flush_buffer():
                nonlocal processed_unique
                nonlocal persisted_count
                nonlocal total_changed
                nonlocal last_load_report_count
                nonlocal last_load_report_ts

                if not buffered_by_external:
                    return

                chunk_items = list(buffered_by_external.items())
                buffered_by_external.clear()

                chunk_external_ids = [external_id for external_id, _ in chunk_items]
                existing_meta_by_external = {
                    row['external_id']: {
                        'id': row['id'],
                        'row_hash': row['row_hash'],
                    }
                    for row in StgOracleEstudiante.objects.filter(
                        source_system=source_system,
                        external_id__in=chunk_external_ids,
                    ).values('id', 'external_id', 'row_hash')
                }

                to_create = []
                to_update = []
                now_ts = timezone.now()

                for external_id, defaults in chunk_items:
                    previous_meta = existing_meta_by_external.get(external_id)
                    if previous_meta is None:
                        summary['staging']['created'] += 1
                        total_changed += 1
                        if not dry_run:
                            to_create.append(
                                StgOracleEstudiante(
                                    source_system=source_system,
                                    external_id=external_id,
                                    fecha_carga=now_ts,
                                    **defaults,
                                )
                            )
                        continue

                    if previous_meta['row_hash'] == defaults['row_hash']:
                        summary['staging']['unchanged'] += 1
                        continue

                    summary['staging']['updated'] += 1
                    total_changed += 1
                    if not dry_run:
                        to_update.append(
                            StgOracleEstudiante(
                                id=previous_meta['id'],
                                source_system=source_system,
                                external_id=external_id,
                                fecha_carga=now_ts,
                                **defaults,
                            )
                        )

                if not dry_run:
                    with transaction.atomic():
                        for create_chunk in self._chunked(to_create, write_batch_size):
                            StgOracleEstudiante.objects.bulk_create(create_chunk, batch_size=write_batch_size)
                            persisted_count += len(create_chunk)
                        for update_chunk in self._chunked(to_update, write_batch_size):
                            StgOracleEstudiante.objects.bulk_update(
                                update_chunk,
                                update_fields,
                                batch_size=write_batch_size,
                            )
                            persisted_count += len(update_chunk)

                processed_unique += len(chunk_items)
                now = time.monotonic()
                if (
                    (persisted_count - last_load_report_count) >= progress_every
                    or (now - last_load_report_ts) >= progress_interval_sec
                ):
                    elapsed = int(now - started_at)
                    self.stdout.write(
                        '[LOAD] '
                        f'unique_procesados={processed_unique:,}/{unique_external_count:,} '
                        f'upsert={persisted_count:,} '
                        f'elapsed={elapsed}s'
                    )
                    last_load_report_count = persisted_count
                    last_load_report_ts = now

            rows_processed = 0
            rows_scanned = 0
            last_extract_report_rows = 0
            last_extract_report_ts = time.monotonic()
            while True:
                batch = cursor.fetchmany(size=fetch_size)
                if not batch:
                    break

                for row in batch:
                    rows_scanned += 1

                    rows_processed += 1

                    raw_payload = {
                        'tip_identificacion': _pick(row, 'tip_identificacion'),
                        'id_estudiante': _pick(row, 'id_estudiante'),
                        'codigo_estudiante': _pick(row, 'codigo_estudiante'),
                        'nombres': _pick(row, 'nombres'),
                        'apellidos': _pick(row, 'apellidos'),
                        'semestre': _pick(row, 'semestre'),
                        'periodo_academico': _pick(row, 'periodo_academico'),
                        'programa': _pick(row, 'programa'),
                    }

                    tipo_identificacion = self._to_text(raw_payload['tip_identificacion'])
                    id_estudiante = self._to_text(raw_payload['id_estudiante'])
                    codigo_estudiante = self._to_text(raw_payload['codigo_estudiante'])
                    nombres = self._to_text(raw_payload['nombres'])
                    apellidos = self._to_text(raw_payload['apellidos'])

                    # Hash solo del payload funcional para reducir CPU en lotes grandes.
                    row_hash = self._row_hash(raw_payload)
                    if tipo_identificacion and id_estudiante:
                        external_id = f'{tipo_identificacion}:{id_estudiante}'
                    elif id_estudiante:
                        external_id = f'EST:{id_estudiante}'
                    elif codigo_estudiante:
                        external_id = f'COD:{codigo_estudiante}'
                    else:
                        external_id = f'NOID:{row_hash[:16]}'
                        summary['staging']['without_strong_id'] += 1

                    defaults = {
                        'tipo_identificacion': tipo_identificacion or None,
                        'id_estudiante_oracle': id_estudiante or None,
                        'codigo_estudiante_oracle': codigo_estudiante or None,
                        'nombres': nombres or None,
                        'apellidos': apellidos or None,
                        'nombre_completo': self._build_nombre_completo(nombres, apellidos),
                        'semestre_oracle': self._to_non_negative_int(raw_payload['semestre'], default=None),
                        'periodo_academico': self._to_text(raw_payload['periodo_academico']) or None,
                        'programa_oracle': self._to_text(raw_payload['programa']) or None,
                        # Mantener raw_data compacto (o vacio) reduce serializacion JSON y uso de I/O.
                        'raw_data': {} if skip_raw_data else raw_payload,
                        'row_hash': row_hash,
                        'estado_registro': 'valido' if id_estudiante else 'sin_identificador',
                    }

                    if external_id in seen_external_ids:
                        summary['staging']['duplicate_external_ids_in_batch'] += 1
                    else:
                        seen_external_ids.add(external_id)
                        unique_external_count += 1

                    buffered_by_external[external_id] = defaults
                    if len(buffered_by_external) >= diff_batch_size:
                        flush_buffer()

                now = time.monotonic()
                if (
                    (rows_processed - last_extract_report_rows) >= progress_every
                    or (now - last_extract_report_ts) >= progress_interval_sec
                ):
                    elapsed = int(now - started_at)
                    self.stdout.write(
                        '[EXTRACT] '
                        f'leidas={rows_scanned:,} '
                        f'incluidas={rows_processed:,} '
                        f'unique_external={unique_external_count:,} '
                        f'elapsed={elapsed}s'
                    )
                    last_extract_report_rows = rows_processed
                    last_extract_report_ts = now

            flush_buffer()
            summary['extract']['rows'] = rows_processed
            self.stdout.write(
                self.style.SUCCESS(
                    f'Registros Oracle extraidos: {rows_processed} (leidas={rows_scanned})'
                )
            )

            total_unique = unique_external_count
            summary['staging']['unique_external_ids'] = total_unique
            if dry_run:
                self.stdout.write(self.style.WARNING('DRY-RUN: no se guarda staging de estudiantes'))
                self.stdout.write(str(summary))
                return

            now = time.monotonic()
            elapsed = int(now - started_at)
            unique_percent = int((processed_unique / total_unique) * 100) if total_unique else 100
            self.stdout.write(
                '[LOAD] '
                f'unique_procesados={processed_unique:,}/{total_unique:,} ({unique_percent}%) '
                f'upsert={persisted_count:,} '
                f'elapsed={elapsed}s'
            )

            if total_unique:
                changed_ratio = (total_changed / total_unique) * 100
                self.stdout.write(
                    f'[LOAD] Registros con cambios efectivos: {changed_ratio:.2f}% del total unico'
                )

            self.stdout.write(self.style.SUCCESS('ETL estudiantes finalizado (Oracle -> staging)'))
            self.stdout.write(f'Tiempo total ETL estudiantes: {int(time.monotonic() - started_at)}s')
            self.stdout.write(str(summary))

        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('Operacion interrumpida por usuario durante la lectura de Oracle'))
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Error en ETL estudiantes: {exc}'))
            import traceback
            traceback.print_exc()
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
