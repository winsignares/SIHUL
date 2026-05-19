import hashlib
import json
import os

import oracledb
from django.core.management.base import BaseCommand
from django.db import transaction

from grupos.models import StgOracleGrupoAcademico
from mysite.oracle_seccional_filter import execute_oracle_query_with_optional_seccional


class Command(BaseCommand):
    help = 'ETL Oracle para grupos academicos: extrae VW_GRUPOS_ACADEMICOS y carga staging idempotente'

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
            default='SELECT * FROM UHORARIOS.VW_GRUPOS_ACADEMICOS',
            help='Consulta Oracle para grupos academicos',
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
            num = int(str(value).strip())
            return num if num >= 0 else default
        except (TypeError, ValueError, AttributeError):
            return default

    @staticmethod
    def _row_hash(payload):
        return hashlib.sha256(
            json.dumps(payload, sort_keys=True, ensure_ascii=True, default=str).encode('utf-8')
        ).hexdigest()

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
            self.stdout.write(self.style.WARNING('Modo REAL: se escribira en tabla staging de grupos'))
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
            execute_oracle_query_with_optional_seccional(
                cursor,
                query,
                seccional=seccional,
                seccional_columns=('SEDE', 'NOMBRE_SEDE'),
                stdout=self.stdout,
            )

            rows = cursor.fetchall()
            columns = [desc[0].lower() for desc in cursor.description]
            if limit:
                rows = rows[:limit]

            summary['extract']['rows'] = len(rows)
            summary['extract']['columns'] = columns
            self.stdout.write(self.style.SUCCESS(f'Registros Oracle extraidos: {len(rows)}'))

            staged_by_external = {}
            for row in rows:
                data = dict(zip(columns, row))

                raw_payload = {
                    'id_grupo': self._first_present(data, ['id_grupo']),
                    'id_sede': self._first_present(data, ['id_sede']),
                    'nombre_sede': self._first_present(data, ['nombre_sede']),
                    'id_facultad': self._first_present(data, ['id_facultad']),
                    'nombre_facultad': self._first_present(data, ['nombre_facultad']),
                    'id_programa': self._first_present(data, ['id_programa']),
                    'nombre_programa': self._first_present(data, ['nombre_programa']),
                    'nombre_grupo': self._first_present(data, ['nombre_grupo']),
                    'periodo_academico': self._first_present(data, ['periodo_academico']),
                    'semestre': self._first_present(data, ['semestre']),
                }

                id_grupo = self._to_text(raw_payload['id_grupo'])
                periodo = self._to_text(raw_payload['periodo_academico'])
                semestre = self._to_non_negative_int(raw_payload['semestre'], default=None)

                row_hash = self._row_hash({'raw_payload': raw_payload, 'raw_row': data})
                if id_grupo and periodo:
                    external_id = f'{periodo}:{id_grupo}'
                elif id_grupo:
                    external_id = f'GRUPO:{id_grupo}'
                else:
                    external_id = f'NOID:{row_hash[:16]}'
                    summary['staging']['without_strong_id'] += 1

                defaults = {
                    'id_grupo_oracle': id_grupo or None,
                    'id_sede_oracle': self._to_text(raw_payload['id_sede']) or None,
                    'nombre_sede_oracle': self._to_text(raw_payload['nombre_sede']) or None,
                    'id_facultad_oracle': self._to_text(raw_payload['id_facultad']) or None,
                    'nombre_facultad_oracle': self._to_text(raw_payload['nombre_facultad']) or None,
                    'id_programa_oracle': self._to_text(raw_payload['id_programa']) or None,
                    'nombre_programa_oracle': self._to_text(raw_payload['nombre_programa']) or None,
                    'nombre_grupo_oracle': self._to_text(raw_payload['nombre_grupo']) or None,
                    'periodo_academico': periodo or None,
                    'semestre_oracle': semestre,
                    'raw_data': data,
                    'row_hash': row_hash,
                    'estado_registro': 'valido' if id_grupo else 'sin_identificador',
                }

                if external_id in staged_by_external:
                    summary['staging']['duplicate_external_ids_in_batch'] += 1

                staged_by_external[external_id] = defaults

            processed_external_ids = list(staged_by_external.keys())
            summary['staging']['unique_external_ids'] = len(processed_external_ids)

            existing_by_external = {
                row['external_id']: row['row_hash']
                for row in StgOracleGrupoAcademico.objects.filter(
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
                self.stdout.write(self.style.WARNING('DRY-RUN: no se guarda staging de grupos'))
                self.stdout.write(str(summary))
                return

            with transaction.atomic():
                for external_id, defaults in staged_by_external.items():
                    StgOracleGrupoAcademico.objects.update_or_create(
                        source_system=source_system,
                        external_id=external_id,
                        defaults=defaults,
                    )

            self.stdout.write(self.style.SUCCESS('ETL grupos finalizado (Oracle -> staging)'))
            self.stdout.write(str(summary))

        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Error en ETL grupos: {exc}'))
            import traceback
            traceback.print_exc()
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
