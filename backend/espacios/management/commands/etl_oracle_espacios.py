import hashlib
import json
import os

import oracledb
from django.core.management.base import BaseCommand
from django.db import transaction

from espacios.models import StgOracleEspacioFisico
from mysite.oracle_seccional_filter import execute_oracle_query_with_optional_seccional


class Command(BaseCommand):
    help = 'ETL Oracle para espacios fisicos: extrae VW_ESPACIOS_FISICOS y carga staging idempotente'

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
            default='SELECT * FROM UHORARIOS.VW_ESPACIOS_FISICOS',
            help='Consulta Oracle para espacios fisicos',
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
            self.stdout.write(self.style.WARNING('Modo REAL: se escribira en tabla staging de espacios'))
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
                    'ident_aula': self._first_present(data, ['ident_aula']),
                    'bloque': self._first_present(data, ['bloque']),
                    'nombre_espacio': self._first_present(data, ['nombre_espacio']),
                    'tipo_espacio': self._first_present(data, ['tipo_espacio']),
                    'id_sede': self._first_present(data, ['id_sede']),
                    'sede': self._first_present(data, ['sede']),
                    'nombre_facultad': self._first_present(data, ['nombre_facultad']),
                }

                ident_aula = self._to_text(raw_payload['ident_aula'])
                id_sede = self._to_text(raw_payload['id_sede'])
                nombre_espacio = self._to_text(raw_payload['nombre_espacio'])

                row_hash = self._row_hash({'raw_payload': raw_payload, 'raw_row': data})
                if ident_aula and id_sede:
                    external_id = f'{id_sede}:{ident_aula}'
                elif ident_aula:
                    external_id = f'AULA:{ident_aula}'
                else:
                    external_id = f'NOID:{row_hash[:16]}'
                    summary['staging']['without_strong_id'] += 1

                defaults = {
                    'ident_aula_oracle': ident_aula or None,
                    'bloque_oracle': self._to_text(raw_payload['bloque']) or None,
                    'nombre_espacio_oracle': nombre_espacio or None,
                    'tipo_espacio_oracle': self._to_text(raw_payload['tipo_espacio']) or None,
                    'id_sede_oracle': id_sede or None,
                    'nombre_sede_oracle': self._to_text(raw_payload['sede']) or None,
                    'nombre_facultad_oracle': self._to_text(raw_payload['nombre_facultad']) or None,
                    'raw_data': data,
                    'row_hash': row_hash,
                    'estado_registro': 'valido' if ident_aula else 'sin_identificador',
                }

                if external_id in staged_by_external:
                    summary['staging']['duplicate_external_ids_in_batch'] += 1

                staged_by_external[external_id] = defaults

            processed_external_ids = list(staged_by_external.keys())
            summary['staging']['unique_external_ids'] = len(processed_external_ids)

            existing_by_external = {
                row['external_id']: row['row_hash']
                for row in StgOracleEspacioFisico.objects.filter(
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
                self.stdout.write(self.style.WARNING('DRY-RUN: no se guarda staging de espacios'))
                self.stdout.write(str(summary))
                return

            with transaction.atomic():
                for external_id, defaults in staged_by_external.items():
                    StgOracleEspacioFisico.objects.update_or_create(
                        source_system=source_system,
                        external_id=external_id,
                        defaults=defaults,
                    )

            self.stdout.write(self.style.SUCCESS('ETL espacios finalizado (Oracle -> staging)'))
            self.stdout.write(str(summary))

        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Error en ETL espacios: {exc}'))
            import traceback
            traceback.print_exc()
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
