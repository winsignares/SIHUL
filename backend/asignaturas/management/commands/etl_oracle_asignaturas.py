import os

import oracledb
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from asignaturas.models import Asignatura
from mysite.oracle_seccional_filter import execute_oracle_query_with_optional_seccional
from sedes.models import Sede


class Command(BaseCommand):
    help = 'ETL Oracle dedicado para Asignaturas con upsert idempotente en Asignatura.codigo'
    _SECCIONAL_RELATED_PREDICATES = (
        (
            "UPPER(TRIM(NVL(TO_CHAR(SRC_Q.ID_ASIGNATURA), ''))) IN ("
            "SELECT /*+ MATERIALIZE */ DISTINCT UPPER(TRIM(NVL(TO_CHAR(REL_AP.ID_ASIGNATURA), ''))) "
            "FROM UHORARIOS.VW_ASIGNATURA_PROGRAMA REL_AP "
            "JOIN UHORARIOS.VW_PROGRAMAS_ACADEMICOS REL_PRG "
            "ON UPPER(TRIM(NVL(TO_CHAR(REL_PRG.ID_PROGRAMA), ''))) = "
            "UPPER(TRIM(NVL(TO_CHAR(REL_AP.ID_PROGRAMA), ''))) "
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
        parser.add_argument(
            '--query',
            type=str,
            default=f"SELECT * FROM UHORARIOS.VW_ASIGNATURA WHERE COD_PERIODO = '{settings.ETL_PERIODO}'",
            help='Consulta Oracle para asignaturas',
        )
        parser.add_argument('--dry-run', action='store_true', help='Simular sin guardar cambios')
        parser.add_argument('--no-input', action='store_true', help='No pedir confirmacion en modo real')
        parser.add_argument('--limit', type=int, default=None)
        parser.add_argument(
            '--seccional',
            type=str,
            default='',
            help='Filtra por seccional (si la consulta expone SEDE/NOMBRE_SEDE)',
        )
        parser.add_argument(
            '--only-active',
            action='store_true',
            help='Importar solo materias activas (por defecto se importan activas e inactivas)',
        )
        parser.add_argument(
            '--import-inactive',
            action='store_true',
            help='Compatibilidad retro: no es necesario, por defecto ya se importan inactivas',
        )

    @staticmethod
    def _to_bool(value):
        if isinstance(value, bool):
            return value
        if value is None:
            return False
        text = str(value).strip().lower()
        return text in {'1', 'true', 't', 'si', 'sí', 'y', 'yes'}

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
    def _truncate(value, max_length):
        text = str(value or '').strip()
        if len(text) <= max_length:
            return text, False
        return text[:max_length], True

    @staticmethod
    def _map_tipo(nombre_tipo_materia, codigo_tipo_materia):
        text = str(nombre_tipo_materia or '').strip().lower()
        code = str(codigo_tipo_materia or '').strip()

        # Reglas por nombre
        if any(token in text for token in ['practica', 'práctica', 'laboratorio', 'lab']):
            return 'práctica'
        if any(token in text for token in ['teorica', 'teórica']):
            return 'teórica'
        if any(token in text for token in ['mixta', 'teorico-practica', 'teórico-práctica']):
            return 'mixta'

        # Reglas por codigo (ajustable segun catalogo real)
        if code == '1':
            return 'teórica'
        if code == '2':
            return 'práctica'
        if code == '3':
            return 'mixta'

        return 'mixta'

    def handle(self, *args, **options):
        host = options['host']
        port = options['port']
        user = options['user']
        password = options['password']
        service = options['service']
        query = options['query']
        dry_run = options['dry_run']
        no_input = options['no_input']
        limit = options['limit']
        # Comportamiento por defecto: importar todo (activas e inactivas).
        only_active = options['only_active']
        import_inactive = options['import_inactive'] or not only_active
        seccional = options['seccional']

        if not all([host, user, password, service]):
            self.stdout.write(self.style.ERROR('Faltan credenciales Oracle (host/user/password/service)'))
            return

        if not dry_run and not no_input:
            self.stdout.write(self.style.WARNING('Modo REAL: se guardaran cambios en asignaturas'))
            confirm = input('Deseas continuar? (s/n): ').strip().lower()
            if confirm != 's':
                self.stdout.write(self.style.WARNING('Operacion cancelada'))
                return

        conn = None
        cursor = None
        summary = {
            'extracted': 0,
            'valid': 0,
            'unique_codes': 0,
            'duplicate_rows': 0,
            'codes_with_multiple_sedes': 0,
            'invalid': 0,
            'invalid_codigo_too_long': 0,
            'truncated_nombre': 0,
            'active': 0,
            'inactive': 0,
            'skipped_inactive': 0,
            'to_create': 0,
            'to_update': 0,
            'created': 0,
            'updated': 0,
            'unchanged': 0,
            'dry_run': dry_run,
        }

        try:
            conn = oracledb.connect(user=user, password=password, dsn=f'{host}:{port}/{service}')
            cursor = conn.cursor()
            # Mapa de traduccion ID_SEDE -> COD_SEDE para armonizar con Sede.external_id local.
            sede_id_to_cod = {}
            try:
                cursor.execute("SELECT ID_SEDE, COD_SEDE FROM UHORARIOS.VW_SEDES")
                for sid, cod in cursor.fetchall():
                    sid_txt = str(sid or '').strip()
                    cod_txt = str(cod or '').strip()
                    if sid_txt and cod_txt:
                        sede_id_to_cod[sid_txt] = cod_txt
            except Exception:
                # Si no se puede consultar VW_SEDES, seguimos con ID_SEDE directo.
                sede_id_to_cod = {}

            query_filter_status = execute_oracle_query_with_optional_seccional(
                cursor,
                query,
                seccional=seccional,
                seccional_columns=('ID_SEDE', 'SEDE', 'NOMBRE_SEDE'),
                seccional_related_predicates=self._SECCIONAL_RELATED_PREDICATES,
                limit=limit,
                stdout=self.stdout,
            )
            if query_filter_status.get('filter_mode') == 'related_sql':
                self.stdout.write(
                    'Filtro por seccional aplicado en Oracle via relacion SQL '
                    '(asignatura -> asignatura_programa -> programas_academicos -> sede).'
                )

            rows = cursor.fetchall()
            columns = [desc[0].lower() for desc in cursor.description]

            summary['extracted'] = len(rows)
            self.stdout.write(self.style.SUCCESS(f'Asignaturas extraidas: {len(rows)} columnas={columns}'))

            codigo_max = Asignatura._meta.get_field('codigo').max_length
            nombre_max = Asignatura._meta.get_field('nombre').max_length

            parsed_by_code = {}
            sedes_by_code = {}
            for row in rows:
                data = dict(zip(columns, row))
                codigo = str(self._first_present(data, ['id_asignatura', 'cod_materia']) or '').strip()
                nombre_raw = self._first_present(data, ['nombre_asignatura', 'nom_materia'])
                nombre, was_truncated = self._truncate(nombre_raw, nombre_max)
                estado_activo = self._to_bool(
                    self._first_present(data, ['estado_materia', 'est_materia'])
                )

                if codigo and len(codigo) > codigo_max:
                    summary['invalid'] += 1
                    summary['invalid_codigo_too_long'] += 1
                    continue

                codigo_tipo = self._first_present(data, ['codigo_tipo_materia', 'cod_tip_materia'])
                nombre_tipo = self._first_present(
                    data,
                    ['nombre_tipo_materia', 'tip_materia', 'emp_tip_materia'],
                )
                tipo = self._map_tipo(nombre_tipo, codigo_tipo)

                creditos_raw = self._first_present(data, ['creditos'])
                if creditos_raw is None:
                    # Fallback para esquema legado de Oracle.
                    uni_teorica = self._to_non_negative_int(data.get('uni_teorica'), default=0)
                    uni_practica = self._to_non_negative_int(data.get('uni_practica'), default=0)
                    uni_asesoria = self._to_non_negative_int(data.get('uni_asesoria'), default=0)
                    creditos = uni_teorica + uni_practica + uni_asesoria
                else:
                    creditos = self._to_non_negative_int(creditos_raw, default=0)

                horas = self._to_non_negative_int(
                    self._first_present(data, ['horas', 'int_horaria', 'hor_docente', 'dur_sesion']),
                    default=0,
                )

                if not codigo or not nombre:
                    summary['invalid'] += 1
                    continue

                if was_truncated:
                    summary['truncated_nombre'] += 1

                summary['valid'] += 1
                if estado_activo:
                    summary['active'] += 1
                else:
                    summary['inactive'] += 1

                sede_code = (
                    str(self._first_present(data, ['cod_sede']) or '').strip()
                    or str(self._first_present(data, ['id_sede']) or '').strip()
                    or None
                )
                if sede_code:
                    sede_code = sede_id_to_cod.get(sede_code, sede_code)

                item = {
                    'codigo': codigo,
                    'nombre': nombre,
                    'tipo': tipo,
                    'creditos': creditos,
                    'horas': horas,
                    'estado_activo': estado_activo,
                    'id_sede_oracle': sede_code,
                }
                if codigo in parsed_by_code:
                    summary['duplicate_rows'] += 1
                parsed_by_code[codigo] = item
                if sede_code:
                    sedes_by_code.setdefault(codigo, set()).add(sede_code)

            parsed = list(parsed_by_code.values())
            summary['unique_codes'] = len(parsed)
            summary['codes_with_multiple_sedes'] = sum(
                1 for sede_codes in sedes_by_code.values() if len(sede_codes) > 1
            )
            if summary['duplicate_rows']:
                self.stdout.write(
                    self.style.WARNING(
                        'Oracle contiene filas repetidas por codigo: '
                        f'{summary["duplicate_rows"]} filas adicionales, '
                        f'{summary["unique_codes"]} codigos unicos, '
                        f'{summary["codes_with_multiple_sedes"]} codigos asociados a varias sedes. '
                        'Asignatura.codigo es unico; se procesa un registro por codigo.'
                    )
                )

            existing_by_code = {
                a.codigo: a for a in Asignatura.objects.filter(codigo__in=[p['codigo'] for p in parsed])
            }

            for item in parsed:
                if not item['estado_activo'] and not import_inactive:
                    summary['skipped_inactive'] += 1
                    continue

                current = existing_by_code.get(item['codigo'])
                if current is None:
                    summary['to_create'] += 1
                    continue

                changed = (
                    current.nombre != item['nombre']
                    or current.tipo != item['tipo']
                    or current.creditos != item['creditos']
                    or current.horas != item['horas']
                    or (
                        (current.sede.external_id if current.sede else None)
                        != item['id_sede_oracle']
                    )
                )
                if changed:
                    summary['to_update'] += 1

            if dry_run:
                self.stdout.write(self.style.WARNING('DRY-RUN: no se guardaron cambios'))
                self.stdout.write(str(summary))
                return

            with transaction.atomic():
                for item in parsed:
                    if not item['estado_activo'] and not import_inactive:
                        continue
                    sede = None
                    if item.get('id_sede_oracle'):
                        sede = Sede.objects.filter(external_id=item['id_sede_oracle']).first()

                    asignatura, created = Asignatura.objects.get_or_create(
                        codigo=item['codigo'],
                        defaults={
                            'nombre': item['nombre'],
                            'tipo': item['tipo'],
                            'creditos': item['creditos'],
                            'horas': item['horas'],
                            'sede': sede,
                        },
                    )

                    if created:
                        summary['created'] += 1
                        continue

                    changed = False
                    if asignatura.nombre != item['nombre']:
                        asignatura.nombre = item['nombre']
                        changed = True
                    if asignatura.tipo != item['tipo']:
                        asignatura.tipo = item['tipo']
                        changed = True
                    if asignatura.creditos != item['creditos']:
                        asignatura.creditos = item['creditos']
                        changed = True
                    if asignatura.horas != item['horas']:
                        asignatura.horas = item['horas']
                        changed = True
                    if (asignatura.sede.external_id if asignatura.sede else None) != item['id_sede_oracle']:
                        asignatura.sede = sede
                        changed = True

                    if changed:
                        asignatura.save()
                        summary['updated'] += 1
                    else:
                        summary['unchanged'] += 1

            self.stdout.write(self.style.SUCCESS('ETL asignaturas finalizado'))
            self.stdout.write(str(summary))

        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Error en ETL asignaturas: {exc}'))
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
