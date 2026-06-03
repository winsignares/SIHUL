import hashlib
import json
import os

import oracledb
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from horario.models import StgOracleHorario
from mysite.oracle_seccional_filter import (
    execute_oracle_query_with_optional_seccional,
    normalize_seccional_name,
)


class Command(BaseCommand):
    help = 'ETL Oracle para horario: extrae VW_HORARIO y carga staging idempotente'

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
            default=f"SELECT * FROM UHORARIOS.VW_HORARIO WHERE PERIODO LIKE '{settings.ETL_PERIODO}'",
            help='Consulta Oracle para horario',
        )
        parser.add_argument('--dry-run', action='store_true', help='Simular sin guardar cambios')
        parser.add_argument('--no-input', action='store_true', help='No pedir confirmacion en modo real')
        parser.add_argument('--limit', type=int, default=None)
        parser.add_argument(
            '--seccional',
            type=str,
            default='',
            help='Filtra por seccional (usa columnas SEDE/NOMBRE_SEDE cuando existan)',
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
    def _chunked(items, chunk_size):
        for idx in range(0, len(items), chunk_size):
            yield items[idx : idx + chunk_size]

    def _fetch_sede_tokens_for_seccional(self, cursor, seccional):
        cursor.execute(
            """
            SELECT DISTINCT UPPER(TRIM(NVL(TO_CHAR(id_sede), ''))) AS token
            FROM UHORARIOS.VW_PROGRAMAS_ACADEMICOS
            WHERE UPPER(TRIM(NVL(TO_CHAR(nombre_sede), ''))) LIKE UPPER(:seccional_like)
            UNION
            SELECT DISTINCT UPPER(TRIM(NVL(TO_CHAR(nombre_sede), ''))) AS token
            FROM UHORARIOS.VW_PROGRAMAS_ACADEMICOS
            WHERE UPPER(TRIM(NVL(TO_CHAR(nombre_sede), ''))) LIKE UPPER(:seccional_like)
            """,
            {'seccional_like': f'%{seccional}%'},
        )
        return sorted(
            {
                self._to_text(row[0]).upper()
                for row in cursor.fetchall()
                if self._to_text(row[0])
            }
        )

    def _execute_rows_by_sede_tokens(self, cursor, base_query, sede_tokens, limit):
        if not sede_tokens:
            cursor.execute(f"SELECT * FROM ({base_query}) SRC_Q WHERE 1 = 0")
            return cursor.fetchall()

        max_in_list = 900  # Oracle ORA-01795 guard
        id_expr = "UPPER(TRIM(NVL(TO_CHAR(SRC_Q.ID_SEDE), '')))"
        name_expr = "UPPER(TRIM(NVL(TO_CHAR(SRC_Q.NOMBRE_SEDE), '')))"
        clauses = []
        params = {}
        bind_idx = 0

        for token_chunk in self._chunked(sede_tokens, max_in_list):
            placeholders = []
            for token in token_chunk:
                bind_name = f'p{bind_idx}'
                bind_idx += 1
                placeholders.append(f':{bind_name}')
                params[bind_name] = token
            ph = ', '.join(placeholders)
            clauses.append(f"({id_expr} IN ({ph}) OR {name_expr} IN ({ph}))")

        filtered_query = f"SELECT * FROM ({base_query}) SRC_Q WHERE ({' OR '.join(clauses)})"
        if limit and int(limit) > 0:
            filtered_query = f"SELECT * FROM ({filtered_query}) LIM_Q WHERE ROWNUM <= :max_rows"
            params['max_rows'] = int(limit)

        cursor.execute(filtered_query, params)
        return cursor.fetchall()

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
            self.stdout.write(self.style.WARNING('Modo REAL: se escribira en tabla staging de horario'))
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
            normalized_seccional = normalize_seccional_name(seccional)
            if normalized_seccional:
                self.stdout.write(f'Filtro seccional optimizado para horario: {normalized_seccional}')
                sede_tokens = self._fetch_sede_tokens_for_seccional(cursor, normalized_seccional)
                self.stdout.write(f'Tokens de sede detectados para la seccional: {len(sede_tokens)}')
                rows = self._execute_rows_by_sede_tokens(cursor, query, sede_tokens, limit)
            else:
                execute_oracle_query_with_optional_seccional(
                    cursor,
                    query,
                    seccional=seccional,
                    seccional_columns=('SEDE', 'NOMBRE_SEDE'),
                    limit=limit,
                    stdout=self.stdout,
                )
                rows = cursor.fetchall()
            columns = [desc[0].lower() for desc in cursor.description]
            summary['extract']['columns'] = columns

            staged_by_external = {}
            rows_processed = len(rows)
            for row in rows:
                data = dict(zip(columns, row))

                raw_payload = {
                    'id_grupo': self._first_present(data, ['id_grupo']),
                    'programa': self._first_present(data, ['programa']),
                    'id_asignatura': self._first_present(data, ['id_asignatura']),
                    'nombre_grupo': self._first_present(data, ['nombre_grupo']),
                    'periodo': self._first_present(data, ['periodo']),
                    'cantidad_estudiantes': self._first_present(data, ['cantidad_estudiantes']),
                    'asignatura': self._first_present(data, ['asignatura']),
                    'nombre_programa': self._first_present(data, ['nombre_programa']),
                    'id_sede': self._first_present(data, ['id_sede']),
                    'cod_sede': self._first_present(data, ['cod_sede']),
                    'nombre_sede': self._first_present(data, ['nombre_sede']),
                    'num_identificacion': self._first_present(data, ['num_identificacion']),
                    'nombre_docente': self._first_present(data, ['nombre_docente', 'nombres']),
                    'apellidos_docente': self._first_present(data, ['apellidos_docente', 'apellidos']),
                    'nom_aula': self._first_present(data, ['nom_aula']),
                    'num_dia': self._first_present(data, ['num_dia', 'numero_dia', 'dia_numero']),
                    'hor_inicio': self._first_present(data, ['hor_inicio']),
                    'hor_fin': self._first_present(data, ['hor_fin']),
                }

                id_grupo = self._to_text(raw_payload['id_grupo'])
                id_asignatura = self._to_text(raw_payload['id_asignatura'])
                periodo = self._to_text(raw_payload['periodo'])
                hor_inicio = self._to_text(raw_payload['hor_inicio'])
                hor_fin = self._to_text(raw_payload['hor_fin'])
                nom_aula = self._to_text(raw_payload['nom_aula'])
                num_dia = self._to_non_negative_int(raw_payload['num_dia'], default=None)

                row_hash = self._row_hash({'raw_payload': raw_payload, 'raw_row': data})
                if id_grupo or id_asignatura or periodo:
                    key_payload = {
                        'id_grupo': id_grupo,
                        'id_asignatura': id_asignatura,
                        'periodo': periodo,
                        'num_dia': num_dia,
                        'hor_inicio': hor_inicio,
                        'hor_fin': hor_fin,
                        'nom_aula': nom_aula,
                    }
                    external_id = f'HOR:{self._row_hash(key_payload)[:32]}'
                else:
                    external_id = f'NOID:{row_hash[:16]}'
                    summary['staging']['without_strong_id'] += 1

                effective_sede_id = self._to_text(raw_payload['cod_sede']) or self._to_text(raw_payload['id_sede'])
                defaults = {
                    'id_grupo_oracle': id_grupo or None,
                    'programa_oracle': self._to_text(raw_payload['programa']) or None,
                    'id_asignatura_oracle': id_asignatura or None,
                    'nombre_grupo_oracle': self._to_text(raw_payload['nombre_grupo']) or None,
                    'periodo_oracle': periodo or None,
                    'cantidad_estudiantes_oracle': self._to_non_negative_int(raw_payload['cantidad_estudiantes'], default=None),
                    'asignatura_oracle': self._to_text(raw_payload['asignatura']) or None,
                    'nombre_programa_oracle': self._to_text(raw_payload['nombre_programa']) or None,
                    # Priorizamos COD_SEDE por ser el identificador homologado de sede.
                    'id_sede_oracle': effective_sede_id or None,
                    'nombre_sede_oracle': self._to_text(raw_payload['nombre_sede']) or None,
                    'num_identificacion_docente': self._to_text(raw_payload['num_identificacion']) or None,
                    'nombre_docente_oracle': self._to_text(raw_payload['nombre_docente']) or None,
                    'apellidos_docente_oracle': self._to_text(raw_payload['apellidos_docente']) or None,
                    'nom_aula_oracle': nom_aula or None,
                    'num_dia_oracle': num_dia,
                    'hor_inicio_raw': hor_inicio or None,
                    'hor_fin_raw': hor_fin or None,
                    'raw_data': data,
                    'row_hash': row_hash,
                    'estado_registro': 'valido' if id_grupo or id_asignatura else 'sin_identificador',
                }

                if external_id in staged_by_external:
                    summary['staging']['duplicate_external_ids_in_batch'] += 1

                staged_by_external[external_id] = defaults

            summary['extract']['rows'] = rows_processed
            self.stdout.write(self.style.SUCCESS(f'Registros Oracle extraidos: {rows_processed}'))

            processed_external_ids = list(staged_by_external.keys())
            summary['staging']['unique_external_ids'] = len(processed_external_ids)

            existing_by_external = {
                row['external_id']: row['row_hash']
                for row in StgOracleHorario.objects.filter(
                    source_system=source_system,
                    external_id__in=processed_external_ids,
                ).values('external_id', 'row_hash')
            }

            for external_id, defaults in staged_by_external.items():
                previous_hash = existing_by_external.get(external_id)
                if previous_hash is None:
                    summary['staging']['created'] += 1
                elif previous_hash != defaults['row_hash']:
                    summary['staging']['updated'] += 1
                else:
                    summary['staging']['unchanged'] += 1

            if dry_run:
                self.stdout.write(self.style.WARNING('DRY-RUN: no se guarda staging de horario'))
                self.stdout.write(str(summary))
                return

            with transaction.atomic():
                for external_id, defaults in staged_by_external.items():
                    StgOracleHorario.objects.update_or_create(
                        source_system=source_system,
                        external_id=external_id,
                        defaults=defaults,
                    )

            self.stdout.write(self.style.SUCCESS('ETL horario finalizado (Oracle -> staging)'))
            self.stdout.write(str(summary))

        except KeyboardInterrupt as exc:
            self.stdout.write(self.style.WARNING('Operacion interrumpida por usuario durante la lectura de Oracle'))
            raise CommandError('ETL horario interrumpido por usuario') from exc

        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Error en ETL horario: {exc}'))
            import traceback
            traceback.print_exc()
            raise CommandError(f'Falló el ETL horario: {exc}') from exc
            
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
