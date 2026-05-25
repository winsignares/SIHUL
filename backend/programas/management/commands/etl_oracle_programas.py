import hashlib
import json
import os
import re
import unicodedata

import oracledb
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from facultades.models import Facultad
from mysite.oracle_seccional_filter import execute_oracle_query_with_optional_seccional
from programas.models import Programa, StgOraclePrograma
from sedes.models import StgOracleFacultad


class Command(BaseCommand):
    help = 'ETL Oracle de Programas con flujo Oracle -> Staging -> Programa'

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
            default=(
<<<<<<< Updated upstream
                "SELECT "
                "ID_PROGRAMA AS id_programa, "
                "ID_SEDE AS id_sede, "
                "NOMBRE_SEDE AS nombre_sede, "
                "ID_FACULTAD AS id_facultad, "
                "NOMBRE_FACULTAD AS nombre_facultad, "
                "NOMBRE_PROGRAMA AS nombre_programa, "
                "PERIODO_ACADEMICO AS periodo_academico "
                "FROM UHORARIOS.VW_PROGRAMAS_ACADEMICOS "
                "WHERE PERIODO_ACADEMICO = '20261'"
=======
                'SELECT '
                'ID_PROGRAMA AS id_programa, '
                'ID_SEDE AS id_sede, '
                'NOMBRE_SEDE AS nombre_sede, '
                'ID_FACULTAD AS id_facultad, '
                'NOMBRE_FACULTAD AS nombre_facultad, '
                'NOMBRE_PROGRAMA AS nombre_programa, '
                'PERIODO_ACADEMICO AS periodo_academico '
                'FROM UHORARIOS.VW_PROGRAMAS_ACADEMICOS '
                f"WHERE PERIODO_ACADEMICO LIKE '{settings.ETL_PERIODO}'"
>>>>>>> Stashed changes
            ),
            help='Consulta Oracle para programas academicos',
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
    def _to_non_negative_int(value, default=0):
        try:
            num = int(str(value).strip())
            return num if num >= 0 else default
        except (TypeError, ValueError, AttributeError):
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

    @staticmethod
    def _row_hash(payload):
        return hashlib.sha256(
            json.dumps(payload, sort_keys=True, ensure_ascii=True, default=str).encode('utf-8')
        ).hexdigest()

    @staticmethod
    def _norm_text(value):
        text = str(value or '').strip()
        if not text:
            return ''
        no_accents = ''.join(
            ch for ch in unicodedata.normalize('NFD', text.upper()) if unicodedata.category(ch) != 'Mn'
        )
        return re.sub(r'\s+', ' ', no_accents).strip()

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
            self.stdout.write(self.style.WARNING('Modo REAL: se escribira staging y luego tabla Programa'))
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
                'without_id_programa': 0,
                'unique_external_ids': 0,
                'duplicate_external_ids_in_batch': 0,
            },
            'load_programa': {
                'valid': 0,
                'invalid_id_programa': 0,
                'facultad_not_found': 0,
                'skipped_without_facultad': 0,
                'facultad_resolved_by_external_id': 0,
                'facultad_resolved_by_stg_nombre': 0,
                'truncated_nombre': 0,
                'to_create': 0,
                'to_update': 0,
                'created': 0,
                'updated': 0,
                'unchanged': 0,
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
                raw_payload = {
                    'id_programa': self._first_present(data, ['id_programa']),
                    'id_sede': self._first_present(data, ['id_sede']),
                    'nombre_sede': self._first_present(data, ['nombre_sede']),
                    'id_facultad': self._first_present(data, ['id_facultad']),
                    'nombre_facultad': self._first_present(data, ['nombre_facultad']),
                    'nombre_programa': self._first_present(data, ['nombre_programa', 'nom_programa']),
                    'periodo_academico': self._first_present(data, ['periodo_academico']),
                }

                id_programa_oracle = self._to_text(raw_payload['id_programa'])
                row_hash = self._row_hash(raw_payload)
                external_id = id_programa_oracle if id_programa_oracle else f'NOID:{row_hash[:16]}'

                if not id_programa_oracle:
                    summary['staging']['without_id_programa'] += 1

                defaults = {
                    'id_programa_oracle': id_programa_oracle or None,
                    'id_sede_oracle': self._to_text(raw_payload['id_sede']) or None,
                    'nombre_sede_oracle': self._to_text(raw_payload['nombre_sede']) or None,
                    'id_facultad_oracle': self._to_text(raw_payload['id_facultad']) or None,
                    'nombre_facultad_oracle': self._to_text(raw_payload['nombre_facultad']) or None,
                    'nombre_programa': self._to_text(raw_payload['nombre_programa']),
                    'periodo_academico': self._to_text(raw_payload['periodo_academico']) or None,
                    'raw_data': raw_payload,
                    'row_hash': row_hash,
                    'estado_registro': 'valido' if id_programa_oracle else 'sin_id_programa',
                }

                if external_id in staged_by_external:
                    summary['staging']['duplicate_external_ids_in_batch'] += 1

                # Se conserva la ultima version del external_id dentro del mismo lote.
                staged_by_external[external_id] = defaults

            processed_external_ids = list(staged_by_external.keys())
            summary['staging']['unique_external_ids'] = len(processed_external_ids)

            existing_by_external = {
                row['external_id']: row['row_hash']
                for row in StgOraclePrograma.objects.filter(
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
                self.stdout.write(self.style.WARNING('DRY-RUN: no se guarda staging ni Programa'))
            else:
                with transaction.atomic():
                    for external_id, defaults in staged_by_external.items():
                        StgOraclePrograma.objects.update_or_create(
                            source_system=source_system,
                            external_id=external_id,
                            defaults=defaults,
                        )

            staged_queryset = StgOraclePrograma.objects.filter(
                source_system=source_system,
                external_id__in=processed_external_ids,
            ).exclude(id_programa_oracle__isnull=True).exclude(id_programa_oracle='')

            nombre_max = Programa._meta.get_field('nombre').max_length
            facultades = list(Facultad.objects.all())
            facultades_by_external = {}
            facultades_by_external_any_source = {}
            for fac in facultades:
                ext = self._to_text(fac.external_id)
                if not ext:
                    continue
                facultades_by_external[(self._to_text(fac.source_system), ext)] = fac
                facultades_by_external_any_source.setdefault(ext, fac)

            stg_fac_by_nombre_sede = {}
            stg_fac_by_nombre = {}
            for stg_fac in StgOracleFacultad.objects.filter(source_system=source_system):
                key_nombre = self._norm_text(stg_fac.nombre_facultad)
                key_sede = self._to_text(stg_fac.id_sede_oracle)
                if key_nombre:
                    stg_fac_by_nombre.setdefault(key_nombre, stg_fac)
                    stg_fac_by_nombre_sede.setdefault((key_nombre, key_sede), stg_fac)

            parsed = []
            for stg in staged_queryset:
                id_programa = self._to_non_negative_int(stg.id_programa_oracle, default=None)
                if not id_programa:
                    summary['load_programa']['invalid_id_programa'] += 1
                    continue

                id_fac_oracle = self._to_text(stg.id_facultad_oracle)
                facultad = None
                if id_fac_oracle:
                    facultad = facultades_by_external.get((source_system, id_fac_oracle))
                    if facultad is None:
                        facultad = facultades_by_external_any_source.get(id_fac_oracle)
                    if facultad is not None:
                        summary['load_programa']['facultad_resolved_by_external_id'] += 1

                if facultad is None:
                    key_nombre = self._norm_text(stg.nombre_facultad_oracle)
                    key_sede = self._to_text(stg.id_sede_oracle)
                    stg_fac = stg_fac_by_nombre_sede.get((key_nombre, key_sede))
                    if stg_fac is None:
                        stg_fac = stg_fac_by_nombre.get(key_nombre)

                    if stg_fac is not None:
                        ext_from_stg = self._to_text(stg_fac.external_id)
                        facultad = facultades_by_external.get((source_system, ext_from_stg))
                        if facultad is None:
                            facultad = facultades_by_external_any_source.get(ext_from_stg)
                        if facultad is not None:
                            summary['load_programa']['facultad_resolved_by_stg_nombre'] += 1

                if not facultad:
                    summary['load_programa']['facultad_not_found'] += 1
                    summary['load_programa']['skipped_without_facultad'] += 1
                    continue

                nombre_programa, was_truncated = self._truncate(stg.nombre_programa, nombre_max)
                if not nombre_programa:
                    continue
                if was_truncated:
                    summary['load_programa']['truncated_nombre'] += 1

                summary['load_programa']['valid'] += 1
                parsed.append(
                    {
                        'id_programa': id_programa,
                        'nombre_programa': nombre_programa,
                        'facultad': facultad,
                    }
                )

            programas_by_id = {
                p.id: p for p in Programa.objects.filter(id__in=[p['id_programa'] for p in parsed])
            }

            for item in parsed:
                if item['id_programa'] not in programas_by_id:
                    summary['load_programa']['to_create'] += 1
                else:
                    summary['load_programa']['to_update'] += 1

            if dry_run:
                self.stdout.write(self.style.SUCCESS('Resumen dry-run'))
                self.stdout.write(str(summary))
                return

            with transaction.atomic():
                for item in parsed:
                    programa, created = Programa.objects.get_or_create(
                        id=item['id_programa'],
                        defaults={
                            'nombre': item['nombre_programa'],
                            'facultad': item['facultad'],
                            'semestres': 10,
                            'activo': True,
                        },
                    )

                    if created:
                        summary['load_programa']['created'] += 1
                        continue

                    changed = False
                    if programa.nombre != item['nombre_programa']:
                        programa.nombre = item['nombre_programa']
                        changed = True
                    if programa.facultad_id != item['facultad'].id:
                        programa.facultad = item['facultad']
                        changed = True

                    if changed:
                        programa.save()
                        summary['load_programa']['updated'] += 1
                    else:
                        summary['load_programa']['unchanged'] += 1

            self.stdout.write(self.style.SUCCESS('ETL Programas finalizado (con staging)'))
            self.stdout.write(str(summary))

        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Error en ETL programas: {exc}'))
            import traceback
            traceback.print_exc()
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
