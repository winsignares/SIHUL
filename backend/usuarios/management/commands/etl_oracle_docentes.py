import hashlib
import json
import os

import oracledb
from django.core.management.base import BaseCommand
from django.db import transaction

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
            default='SELECT * FROM UHORARIOS.VW_DOCENTES',
            help='Consulta Oracle para docentes',
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
            cursor.execute(query)

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
                    'id_docente': self._first_present(data, ['id_docente', 'cod_docente', 'id_profesor', 'id_doc']),
                    'tipo_documento': self._first_present(
                        data,
                        ['tip_identificacion', 'tipo_documento', 'tip_documento', 'tipo_id'],
                    ),
                    'numero_documento': self._first_present(
                        data,
                        ['numero_documento', 'num_documento', 'documento', 'identificacion'],
                    ),
                    'nombres': self._first_present(data, ['nombres', 'nombre_docente', 'primer_nombre']),
                    'apellidos': self._first_present(data, ['apellidos', 'apellido_docente', 'primer_apellido']),
                    'nombre_completo': self._first_present(data, ['nombre_completo', 'nom_docente', 'docente']),
                    'correo_institucional': self._first_present(
                        data,
                        ['correo_institucional', 'email_institucional', 'correo', 'email'],
                    ),
                    'correo_personal': self._first_present(data, ['correo_personal', 'email_personal']),
                    'id_sede': self._first_present(data, ['id_sede']),
                    'nombre_sede': self._first_present(data, ['nombre_sede']),
                    'id_facultad': self._first_present(data, ['id_facultad']),
                    'nombre_facultad': self._first_present(data, ['nombre_facultad']),
                    'periodo_academico': self._first_present(data, ['periodo_academico']),
                    'estado_docente': self._first_present(data, ['estado_docente', 'estado', 'activo']),
                }

                id_docente_oracle = self._to_text(raw_payload['id_docente'])
                tipo_documento = self._to_text(raw_payload['tipo_documento'])
                numero_documento = self._to_text(raw_payload['numero_documento'])
                correo_institucional = self._to_text(raw_payload['correo_institucional']).lower()
                nombres = self._to_text(raw_payload['nombres'])
                apellidos = self._to_text(raw_payload['apellidos'])

                row_hash = self._row_hash({'raw_payload': raw_payload, 'raw_row': data})
                if id_docente_oracle and tipo_documento:
                    external_id = f'{tipo_documento}:{id_docente_oracle}'
                elif id_docente_oracle:
                    external_id = id_docente_oracle
                elif numero_documento:
                    external_id = f'DOC:{numero_documento}'
                elif correo_institucional:
                    external_id = f'MAIL:{correo_institucional}'
                else:
                    external_id = f'NOID:{self._row_hash({"tipo_documento": tipo_documento, "nombres": nombres, "apellidos": apellidos})[:16]}'
                    summary['staging']['without_strong_id'] += 1

                defaults = {
                    'id_docente_oracle': id_docente_oracle or None,
                    'tipo_documento': tipo_documento or None,
                    'numero_documento': numero_documento or None,
                    'nombres': nombres or None,
                    'apellidos': apellidos or None,
                    'nombre_completo': self._build_nombre_completo(
                        nombres,
                        apellidos,
                        self._to_text(raw_payload['nombre_completo']),
                    ),
                    'correo_institucional': correo_institucional or None,
                    'correo_personal': self._to_text(raw_payload['correo_personal']).lower() or None,
                    'id_sede_oracle': self._to_text(raw_payload['id_sede']) or None,
                    'nombre_sede_oracle': self._to_text(raw_payload['nombre_sede']) or None,
                    'id_facultad_oracle': self._to_text(raw_payload['id_facultad']) or None,
                    'nombre_facultad_oracle': self._to_text(raw_payload['nombre_facultad']) or None,
                    'periodo_academico': self._to_text(raw_payload['periodo_academico']) or None,
                    'estado_docente': self._to_text(raw_payload['estado_docente']) or None,
                    'raw_data': data,
                    'row_hash': row_hash,
                    'estado_registro': 'valido' if id_docente_oracle or numero_documento or correo_institucional else 'sin_identificador',
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
