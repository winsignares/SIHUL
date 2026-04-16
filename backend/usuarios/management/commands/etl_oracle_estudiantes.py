import hashlib
import json
import os

import oracledb
from django.core.management.base import BaseCommand
from django.db import transaction

from usuarios.models import StgOracleEstudiante


class Command(BaseCommand):
    help = 'ETL Oracle para estudiantes: extrae VW_ESTUDIANTES y carga staging idempotente'

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
    def _execute_oracle_query(cursor, query, limit=None):
        if limit and limit > 0:
            limited_query = f'SELECT * FROM ({query}) WHERE ROWNUM <= :max_rows'
            cursor.execute(limited_query, {'max_rows': limit})
            return
        cursor.execute(query)

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
            self._execute_oracle_query(cursor, query, limit=limit)
            columns = [desc[0].lower() for desc in cursor.description]
            summary['extract']['columns'] = columns

            staged_by_external = {}
            rows_processed = 0
            while True:
                batch = cursor.fetchmany(size=1000)
                if not batch:
                    break

                for row in batch:
                    rows_processed += 1
                    data = dict(zip(columns, row))

                    raw_payload = {
                        'tip_identificacion': self._first_present(data, ['tip_identificacion']),
                        'id_estudiante': self._first_present(data, ['id_estudiante']),
                        'codigo_estudiante': self._first_present(data, ['codigo_estudiante']),
                        'nombres': self._first_present(data, ['nombres']),
                        'apellidos': self._first_present(data, ['apellidos']),
                        'semestre': self._first_present(data, ['semestre']),
                        'periodo_academico': self._first_present(data, ['periodo_academico']),
                        'programa': self._first_present(data, ['programa']),
                    }

                    tipo_identificacion = self._to_text(raw_payload['tip_identificacion'])
                    id_estudiante = self._to_text(raw_payload['id_estudiante'])
                    codigo_estudiante = self._to_text(raw_payload['codigo_estudiante'])
                    nombres = self._to_text(raw_payload['nombres'])
                    apellidos = self._to_text(raw_payload['apellidos'])

                    row_hash = self._row_hash({'raw_payload': raw_payload, 'raw_row': data})
                    if tipo_identificacion and id_estudiante:
                        external_id = f'{tipo_identificacion}:{id_estudiante}'
                    elif id_estudiante:
                        external_id = f'EST:{id_estudiante}'
                    elif codigo_estudiante:
                        external_id = f'COD:{codigo_estudiante}'
                    else:
                        external_id = f'NOID:{self._row_hash({"nombres": nombres, "apellidos": apellidos})[:16]}'
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
                        'raw_data': data,
                        'row_hash': row_hash,
                        'estado_registro': 'valido' if id_estudiante else 'sin_identificador',
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
                for row in StgOracleEstudiante.objects.filter(
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
                self.stdout.write(self.style.WARNING('DRY-RUN: no se guarda staging de estudiantes'))
                self.stdout.write(str(summary))
                return

            with transaction.atomic():
                for external_id, defaults in staged_by_external.items():
                    StgOracleEstudiante.objects.update_or_create(
                        source_system=source_system,
                        external_id=external_id,
                        defaults=defaults,
                    )

            self.stdout.write(self.style.SUCCESS('ETL estudiantes finalizado (Oracle -> staging)'))
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
