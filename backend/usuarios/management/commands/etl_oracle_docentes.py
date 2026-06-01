import hashlib
import json
import os

import oracledb
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from mysite.oracle_seccional_filter import execute_oracle_query_with_optional_seccional
from usuarios.models import StgOracleDocente


class Command(BaseCommand):
    help = 'ETL Oracle para docentes: extrae VW_DOCENTES y carga staging idempotente'

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
            default=f"SELECT * FROM UHORARIOS.VW_DOCENTES WHERE PERIODO = '{settings.ETL_PERIODO}'",
            help='Consulta Oracle para docentes',
        )
        parser.add_argument('--dry-run', action='store_true', help='Simular sin guardar cambios')
        parser.add_argument('--no-input', action='store_true', help='No pedir confirmacion en modo real')
        parser.add_argument('--limit', type=int, default=None)
        parser.add_argument(
            '--seccional',
            type=str,
            default='',
            help='Filtra por seccional (si la vista Oracle trae SEDE/NOMBRE_SEDE)',
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

    @staticmethod
    def _build_nombre_completo(nombres, apellidos, nombre_completo):
        if nombre_completo:
            return nombre_completo
        joined = f'{nombres} {apellidos}'.strip()
        return joined or None

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
            self.stdout.write(self.style.WARNING('Modo REAL: se escribira en tabla staging de docentes'))
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
                seccional_columns=('ID_SEDE', 'SEDE', 'NOMBRE_SEDE'),
                limit=limit,
                stdout=self.stdout,
            )

            rows = cursor.fetchall()
            columns = [desc[0].lower() for desc in cursor.description]

            summary['extract']['rows'] = len(rows)
            summary['extract']['columns'] = columns
            self.stdout.write(self.style.SUCCESS(f'Registros Oracle extraidos: {len(rows)}'))

            staged_by_external = {}
            for row in rows:
                data = dict(zip(columns, row))

                # VW_DOCENTES actual:
                # TIP_IDENTIFICACION, ID_DOCENTE, NOMBRES, APELLIDOS, PERIODO, ID_SEDE
                raw_payload = {
                    'tip_identificacion': self._first_present(data, ['tip_identificacion', 'tipo_id']),
                    'id_docente': self._first_present(data, ['id_docente', 'cod_docente']),
                    'nombres': self._first_present(data, ['nombres']),
                    'apellidos': self._first_present(data, ['apellidos']),
                    'periodo': self._first_present(data, ['periodo', 'periodo_academico']),
                    'id_sede': self._first_present(data, ['id_sede']),
                    'cod_sede': self._first_present(data, ['cod_sede']),
                }

                tipo_documento = self._to_text(raw_payload['tip_identificacion'])
                id_docente_oracle = self._to_text(raw_payload['id_docente'])
                nombres = self._to_text(raw_payload['nombres'])
                apellidos = self._to_text(raw_payload['apellidos'])

                # Construir external_id con la información disponible
                if tipo_documento and id_docente_oracle:
                    external_id = f'{tipo_documento}:{id_docente_oracle}'
                elif id_docente_oracle:
                    external_id = id_docente_oracle
                else:
                    external_id = f'NOID:{self._row_hash({"nombres": nombres, "apellidos": apellidos})[:16]}'
                    summary['staging']['without_strong_id'] += 1

                row_hash = self._row_hash({'raw_payload': raw_payload, 'raw_row': data})
                
                nombre_completo = self._build_nombre_completo(nombres, apellidos, None)

                defaults = {
                    'id_docente_oracle': id_docente_oracle or None,
                    'tipo_documento': tipo_documento or None,
                    'numero_documento': id_docente_oracle or None,
                    'nombres': nombres or None,
                    'apellidos': apellidos or None,
                    'nombre_completo': nombre_completo,
                    'correo_institucional': None,  # No disponible en VW_DOCENTES
                    'correo_personal': None,  # No disponible en VW_DOCENTES
                    'id_sede_oracle': (
                        self._to_text(raw_payload['cod_sede']) or self._to_text(raw_payload['id_sede']) or None
                    ),
                    'nombre_sede_oracle': None,  # No disponible en VW_DOCENTES
                    'id_facultad_oracle': None,  # No disponible en VW_DOCENTES
                    'nombre_facultad_oracle': None,  # No disponible en VW_DOCENTES
                    'periodo_academico': self._to_text(raw_payload['periodo']) or None,
                    'estado_docente': None,  # No disponible en VW_DOCENTES
                    'raw_data': data,
                    'row_hash': row_hash,
                    'estado_registro': 'valido' if (tipo_documento and id_docente_oracle) or nombres or apellidos else 'sin_identificador',
                }

                if external_id in staged_by_external:
                    summary['staging']['duplicate_external_ids_in_batch'] += 1

                # Keep latest row for duplicated external_id within the same extraction batch.
                staged_by_external[external_id] = defaults

            processed_external_ids = list(staged_by_external.keys())
            summary['staging']['unique_external_ids'] = len(processed_external_ids)

            existing_by_external = {
                row['external_id']: row['row_hash']
                for row in StgOracleDocente.objects.filter(
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
                self.stdout.write(self.style.WARNING('DRY-RUN: no se guarda staging de docentes'))
                self.stdout.write(str(summary))
                return

            with transaction.atomic():
                for external_id, defaults in staged_by_external.items():
                    StgOracleDocente.objects.update_or_create(
                        source_system=source_system,
                        external_id=external_id,
                        defaults=defaults,
                    )

            self.stdout.write(self.style.SUCCESS('ETL docentes finalizado (Oracle -> staging)'))
            self.stdout.write(str(summary))

        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Error en ETL docentes: {exc}'))
            import traceback
            traceback.print_exc()
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
