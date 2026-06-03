import os
from decimal import Decimal, InvalidOperation

import oracledb
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from asignaturas.models import Asignatura
from sedes.models import Sede


class Command(BaseCommand):
    help = (
        'Sincroniza Asignatura.sede desde Oracle: '
        'id_asignatura + id_sede -> Sede.external_id'
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
            default=(
                "SELECT ID_ASIGNATURA AS id_asignatura, ID_SEDE AS id_sede "
                "FROM UHORARIOS.VW_ASIGNATURA "
                f"WHERE COD_PERIODO = '{settings.ETL_PERIODO}'"
            ),
        )
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument('--limit', type=int, default=None)
        parser.add_argument('--no-input', action='store_true')

    @staticmethod
    def _to_text(value):
        return str(value or '').strip()

    @staticmethod
    def _id_variants(value):
        raw = str(value or '').strip()
        if not raw:
            return set()

        variants = {raw}
        compact = raw.replace(' ', '')
        variants.add(compact)

        try:
            dec = Decimal(compact)
            if dec == dec.to_integral_value():
                int_str = str(int(dec))
                variants.add(int_str)
                variants.add(int_str.zfill(3))
        except (InvalidOperation, ValueError, TypeError):
            pass

        if compact.isdigit():
            variants.add(str(int(compact)))
            variants.add(str(int(compact)).zfill(3))

        return {v for v in variants if v}

    def handle(self, *args, **options):
        host = options['host']
        port = options['port']
        user = options['user']
        password = options['password']
        service = options['service']
        query = options['query']
        dry_run = options['dry_run']
        limit = options['limit']
        no_input = options['no_input']

        if not all([host, user, password, service]):
            self.stdout.write(self.style.ERROR('Faltan credenciales Oracle (host/user/password/service)'))
            return

        if not dry_run and not no_input:
            self.stdout.write(self.style.WARNING('Modo REAL: se actualizara Asignatura.sede'))
            confirm = input('Deseas continuar? (s/n): ').strip().lower()
            if confirm != 's':
                self.stdout.write(self.style.WARNING('Operacion cancelada'))
                return

        conn = None
        cursor = None
        summary = {
            'oracle_rows': 0,
            'rows_with_codigo': 0,
            'rows_with_sede': 0,
            'asignatura_not_found': 0,
            'sede_not_found': 0,
            'updated': 0,
            'unchanged': 0,
            'dry_run': dry_run,
        }

        try:
            conn = oracledb.connect(user=user, password=password, dsn=f'{host}:{port}/{service}')
            cursor = conn.cursor()
            # Mapa de traduccion ID_SEDE -> COD_SEDE para compatibilidad entre vistas Oracle.
            sede_id_to_cod = {}
            try:
                cursor.execute("SELECT ID_SEDE, COD_SEDE FROM UHORARIOS.VW_SEDES")
                for sid, cod in cursor.fetchall():
                    sid_txt = self._to_text(sid)
                    cod_txt = self._to_text(cod)
                    if sid_txt and cod_txt:
                        sede_id_to_cod[sid_txt] = cod_txt
            except Exception:
                # Si la vista no expone COD_SEDE o falla este lookup, continuamos con ID_SEDE directo.
                sede_id_to_cod = {}

            if limit and int(limit) > 0:
                cursor.execute(
                    f"SELECT * FROM ({query}) SRC_Q WHERE ROWNUM <= :max_rows",
                    {'max_rows': int(limit)},
                )
            else:
                cursor.execute(query)

            rows = cursor.fetchall()
            columns = [desc[0].lower() for desc in cursor.description]
            summary['oracle_rows'] = len(rows)

            sedes_by_external = {}
            for sede in Sede.objects.all():
                ext = self._to_text(sede.external_id)
                if not ext:
                    continue
                for variant in self._id_variants(ext):
                    sedes_by_external.setdefault(variant, sede)
            asignaturas_by_codigo = {}
            for a in Asignatura.objects.all():
                code = self._to_text(a.codigo)
                if not code:
                    continue
                asignaturas_by_codigo.setdefault(code, a)
                if code.isdigit():
                    asignaturas_by_codigo.setdefault(str(int(code)), a)

            updates_by_id = {}
            for row in rows:
                data = dict(zip(columns, row))
                codigo = self._to_text(data.get('id_asignatura'))
                id_sede_oracle = self._to_text(data.get('cod_sede')) or self._to_text(data.get('id_sede'))
                if id_sede_oracle:
                    id_sede_oracle = sede_id_to_cod.get(id_sede_oracle, id_sede_oracle)

                if not codigo:
                    continue
                summary['rows_with_codigo'] += 1
                if id_sede_oracle:
                    summary['rows_with_sede'] += 1

                asignatura = asignaturas_by_codigo.get(codigo)
                if asignatura is None and codigo.isdigit():
                    asignatura = asignaturas_by_codigo.get(str(int(codigo)))
                if asignatura is None:
                    summary['asignatura_not_found'] += 1
                    continue

                if not id_sede_oracle:
                    summary['sede_not_found'] += 1
                    continue

                sede = None
                for variant in self._id_variants(id_sede_oracle):
                    sede = sedes_by_external.get(variant)
                    if sede is not None:
                        break
                if sede is None:
                    summary['sede_not_found'] += 1
                    continue

                if asignatura.sede_id == sede.id:
                    summary['unchanged'] += 1
                    continue

                summary['updated'] += 1
                if not dry_run:
                    asignatura.sede = sede
                    updates_by_id[asignatura.id] = asignatura

            if not dry_run and updates_by_id:
                with transaction.atomic():
                    Asignatura.objects.bulk_update(list(updates_by_id.values()), ['sede'])

            self.stdout.write(self.style.SUCCESS('Sincronizacion de sede en asignaturas finalizada'))
            self.stdout.write(str(summary))

        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Error en sincronizacion: {exc}'))
            import traceback
            traceback.print_exc()
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
