import hashlib
import json
import os
import re
import unicodedata
from datetime import timedelta

import oracledb
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from facultades.models import Facultad
from mysite.oracle_seccional_filter import execute_oracle_query_with_optional_seccional
from sedes.models import (
    MapOracleSedeSeccional,
    OracleSyncIssue,
    OracleSyncRun,
    Seccional,
    Sede,
    StgOracleFacultad,
    StgOracleSede,
)


class Command(BaseCommand):
    help = 'ETL idempotente desde Oracle a staging, mapping y tablas finales de SIHUL'

    def add_arguments(self, parser):
        parser.add_argument('--host', type=str, default=os.getenv('ORACLE_HOST', ''))
        parser.add_argument('--port', type=int, default=int(os.getenv('ORACLE_PORT', 1521)))
        parser.add_argument('--user', type=str, default=os.getenv('ORACLE_USER', ''))
        parser.add_argument('--password', type=str, default=os.getenv('ORACLE_PASSWORD', ''))
        parser.add_argument('--service', type=str, default=os.getenv('ORACLE_SERVICE', ''))
        parser.add_argument('--source-system', type=str, default='ORACLE_SIU')

        parser.add_argument(
            '--sedes-query',
            type=str,
            default='SELECT id_sede, nombre_sede FROM UHORARIOS.VW_SEDES',
            help='Consulta Oracle para sedes/seccionales mezcladas',
        )
        parser.add_argument(
            '--facultades-query',
            type=str,
            default='',
            help='Consulta Oracle para facultades (opcional)',
        )

        parser.add_argument('--dry-run', action='store_true', help='No guarda cambios en BD local')
        parser.add_argument('--limit', type=int, default=None)
        parser.add_argument('--no-input', action='store_true', help='No pedir confirmacion en modo real')
        parser.add_argument('--max-runtime-min', type=int, default=30)
        parser.add_argument(
            '--seccional',
            type=str,
            default='',
            help='Filtra por seccional (usa columnas SEDE/NOMBRE_SEDE cuando existan)',
        )

    @staticmethod
    def _norm_upper(value):
        text = str(value or '').strip()
        if not text:
            return ''
        no_accents = ''.join(
            ch for ch in unicodedata.normalize('NFD', text.upper()) if unicodedata.category(ch) != 'Mn'
        )
        return re.sub(r'\s+', ' ', no_accents).strip()

    @classmethod
    def _canonical_city(cls, value):
        n = cls._norm_upper(value)
        if not n:
            return ''

        aliases = {
            'BOGOTA': 'Bogota',
            'BARRANQUILLA': 'Barranquilla',
            'CALI': 'Cali',
            'PEREIRA': 'Pereira',
            'CARTAGENA': 'Cartagena',
            'CUCUTA': 'Cucuta',
            'SOCORRO': 'El Socorro',
            'EL SOCORRO': 'El Socorro',
        }
        if n in aliases:
            return aliases[n]
        return ' '.join(p.capitalize() for p in n.split())

    def _city_from_mixed_name(self, text):
        raw = str(text or '').strip()
        if not raw:
            return ''

        # Regla principal: "... SECCIONAL X" -> X
        match = re.search(r'\bSECCIONAL\s+(.+)$', raw, flags=re.IGNORECASE)
        if match:
            return self._canonical_city(match.group(1))

        # Si llega ciudad directa o embebida en texto.
        normalized = self._norm_upper(raw)
        known = {
            'EL SOCORRO': 'El Socorro',
            'BARRANQUILLA': 'Barranquilla',
            'CARTAGENA': 'Cartagena',
            'PEREIRA': 'Pereira',
            'CUCUTA': 'Cucuta',
            'BOGOTA': 'Bogota',
            'CALI': 'Cali',
            'SOCORRO': 'El Socorro',
        }

        # Amplia matching con seccionales locales existentes.
        for local_city in Seccional.objects.values_list('ciudad', flat=True):
            k = self._norm_upper(local_city)
            if k:
                known.setdefault(k, local_city)

        for token, canonical in sorted(known.items(), key=lambda x: len(x[0]), reverse=True):
            if re.search(rf'(^|\s){re.escape(token)}(\s|$)', normalized):
                return canonical

        return self._canonical_city(raw)

    def _classify_oracle_sede(self, nombre_sede):
        """
        Clasifica registros mezclados de Oracle para evitar poblar Sede local
        con entidades que en realidad son seccionales o unidades no fisicas.
        """
        normalized = self._norm_upper(nombre_sede)
        if not normalized:
            return {'kind': 'unknown', 'create_sede_local': False, 'reason': 'nombre_vacio'}

        # Casos explicitos de sedes no operativas para horarios.
        non_physical_markers = [
            'CAMPUS VIRTUAL',
            'AUTORIDADES NACIONALES',
        ]
        for marker in non_physical_markers:
            if marker in normalized:
                return {'kind': 'non_physical', 'create_sede_local': False, 'reason': marker}

        # Casos que representan seccional (ciudad) y no una sede fisica concreta.
        if 'SECCIONAL' in normalized:
            return {'kind': 'seccional_label', 'create_sede_local': False, 'reason': 'contains_seccional'}

        city = self._city_from_mixed_name(nombre_sede)
        if city:
            city_norm = self._norm_upper(city)
            stripped = normalized
            for prefix in ['SEDE ', 'CAMPUS ']:
                if stripped.startswith(prefix):
                    stripped = stripped[len(prefix):].strip()
            if stripped == city_norm:
                return {'kind': 'city_as_sede', 'create_sede_local': False, 'reason': 'name_equals_city'}

        return {'kind': 'sede', 'create_sede_local': True, 'reason': 'ok'}

    def _oracle_sede_override(self, external_id, nombre_sede):
        """
        Reglas de negocio explicitas para normalizar catalogo Oracle mezclado.
        Permite renombrar sedes y ajustar seccional objetivo por registro.
        """
        ext = str(external_id or '').strip()
        norm_name = self._norm_upper(nombre_sede)

        # Reglas exactas por external_id.
        by_external = {
            '1': {
                'canonical_name': 'Sede Cucuta',
                'city': 'Cucuta',
                'kind': 'seccional_with_placeholder_sede',
                'create_sede_local': True,
            },
            '10101': {'canonical_name': 'Sede Candelaria', 'city': 'Bogota', 'kind': 'sede', 'create_sede_local': True},
            '10102': {'canonical_name': 'Sede Bosque', 'city': 'Bogota', 'kind': 'sede', 'create_sede_local': True},
            '20101': {
                'canonical_name': 'Sede Centro',
                'city': 'Barranquilla',
                'kind': 'seccional_with_seed_sedes',
                'create_sede_local': True,
                'extra_sedes': [
                    {'external_id': '20101-NORTE', 'nombre': 'Sede Norte', 'city': 'Barranquilla'},
                ],
            },
            '301': {'canonical_name': 'Sede Belmonte', 'city': 'Pereira', 'kind': 'sede', 'create_sede_local': True},
            '30101': {'canonical_name': 'Sede Santa Isabel', 'city': 'Cali', 'kind': 'sede', 'create_sede_local': True},
            '30102': {'canonical_name': 'Sede Valle del Lili', 'city': 'Cali', 'kind': 'sede', 'create_sede_local': True},
            '5': {
                'canonical_name': 'Sede Socorro',
                'city': 'El Socorro',
                'kind': 'seccional_with_placeholder_sede',
                'create_sede_local': True,
            },
            '6': {'canonical_name': 'Sede Cartagena', 'city': 'Cartagena', 'kind': 'sede', 'create_sede_local': True},
            '7': {'canonical_name': 'Campus Virtual Unilibre', 'city': 'Virtual', 'kind': 'sede_virtual', 'create_sede_local': True},
            '8': {'canonical_name': 'Autoridades Nacionales', 'city': 'Nacional', 'kind': 'sede_nacional', 'create_sede_local': True},
            '004': {'canonical_name': 'Escuela Docente Seccional Pereira', 'city': 'Pereira', 'kind': 'sede', 'create_sede_local': True},
            '005': {'canonical_name': 'Escuela Docente Seccional Cartagena', 'city': 'Cartagena', 'kind': 'sede', 'create_sede_local': True},
            '006': {'canonical_name': 'Escuela Docente Seccional Cucuta', 'city': 'Cucuta', 'kind': 'sede', 'create_sede_local': True},
        }
        if ext in by_external:
            rule = dict(by_external[ext])
            rule['reason'] = f'override_external_id:{ext}'
            return rule

        # Fallback por nombre cuando no exista regla por id.
        by_name = {
            'CUCUTA': {
                'canonical_name': 'Sede Cucuta',
                'city': 'Cucuta',
                'kind': 'seccional_with_placeholder_sede',
                'create_sede_local': True,
            },
            'CANDELARIA': {'canonical_name': 'Sede Candelaria', 'city': 'Bogota', 'kind': 'sede', 'create_sede_local': True},
            'BOSQUE POPULAR': {'canonical_name': 'Sede Bosque', 'city': 'Bogota', 'kind': 'sede', 'create_sede_local': True},
            'BARRANQUILLA': {
                'canonical_name': 'Sede Centro',
                'city': 'Barranquilla',
                'kind': 'seccional_with_seed_sedes',
                'create_sede_local': True,
                'extra_sedes': [{'external_id': f'{ext}-NORTE' if ext else 'BARRANQUILLA-NORTE', 'nombre': 'Sede Norte', 'city': 'Barranquilla'}],
            },
            'SEDE PEREIRA': {'canonical_name': 'Sede Belmonte', 'city': 'Pereira', 'kind': 'sede', 'create_sede_local': True},
            'VALLE DEL LILI 1 (ANTES SANTA ISABEL)': {'canonical_name': 'Sede Santa Isabel', 'city': 'Cali', 'kind': 'sede', 'create_sede_local': True},
            'VALLE DEL LILI 2 (SEDE HISTORICA)': {'canonical_name': 'Sede Valle del Lili', 'city': 'Cali', 'kind': 'sede', 'create_sede_local': True},
            'SOCORRO': {
                'canonical_name': 'Sede Socorro',
                'city': 'El Socorro',
                'kind': 'seccional_with_placeholder_sede',
                'create_sede_local': True,
            },
            'SEDE CARTAGENA': {'canonical_name': 'Sede Cartagena', 'city': 'Cartagena', 'kind': 'sede', 'create_sede_local': True},
            'ESCUELA DOCENTE SECCIONAL PEREIRA': {'canonical_name': 'Escuela Docente Seccional Pereira', 'city': 'Pereira', 'kind': 'sede', 'create_sede_local': True},
            'ESCUELA DOCENTE SECCIONAL CARTAGENA': {'canonical_name': 'Escuela Docente Seccional Cartagena', 'city': 'Cartagena', 'kind': 'sede', 'create_sede_local': True},
            'ESCUELA DOCENTE SECCIONAL CUCUTA': {'canonical_name': 'Escuela Docente Seccional Cucuta', 'city': 'Cucuta', 'kind': 'sede', 'create_sede_local': True},
            'CAMPUS VIRTUAL UNILIBRE': {'canonical_name': 'Campus Virtual Unilibre', 'city': 'Virtual', 'kind': 'sede_virtual', 'create_sede_local': True},
            'AUTORIDADES NACIONALES': {'canonical_name': 'Autoridades Nacionales', 'city': 'Nacional', 'kind': 'sede_nacional', 'create_sede_local': True},
        }
        if norm_name in by_name:
            rule = dict(by_name[norm_name])
            rule['reason'] = f'override_nombre:{norm_name}'
            return rule

        return None

    @staticmethod
    def _row_hash(payload):
        return hashlib.sha256(
            json.dumps(payload, sort_keys=True, ensure_ascii=True, default=str).encode('utf-8')
        ).hexdigest()

    @staticmethod
    def _first_present(data, keys):
        for key in keys:
            if key in data and data[key] is not None and str(data[key]).strip() != '':
                return data[key]
        return None

    def _fetch_rows(self, cursor, query, limit=None, seccional='', seccional_columns=None):
        execute_oracle_query_with_optional_seccional(
            cursor,
            query,
            seccional=seccional,
            seccional_columns=seccional_columns or (),
            stdout=self.stdout,
        )
        rows = cursor.fetchall()
        columns = [desc[0].lower() for desc in cursor.description]
        if limit:
            rows = rows[:limit]
        dict_rows = [dict(zip(columns, row)) for row in rows]
        return dict_rows, columns

    def _issue(self, run, source_system, issue_type, severity, message, external_id='', payload=None):
        OracleSyncIssue.objects.create(
            run=run,
            source_system=source_system,
            issue_type=issue_type,
            severity=severity,
            external_id=str(external_id or ''),
            message=message,
            payload=payload or {},
        )

    def _upsert_sede_local(self, source_system, ext_id, nombre_sede, seccional):
        sede = Sede.objects.filter(source_system=source_system, external_id=ext_id).first()
        created = False

        if sede is None:
            # Backfill de registros previos sin external_id.
            sede = Sede.objects.filter(nombre__iexact=nombre_sede).first()
            if sede is None:
                sede = Sede.objects.create(
                    nombre=nombre_sede,
                    seccional=seccional,
                    activa=True,
                    source_system=source_system,
                    external_id=ext_id,
                )
                created = True
                return sede, created, True

        changed = False
        if sede.nombre != nombre_sede:
            sede.nombre = nombre_sede
            changed = True
        if sede.seccional_id != (seccional.id if seccional else None):
            sede.seccional = seccional
            changed = True
        if not sede.activa:
            sede.activa = True
            changed = True
        if sede.source_system != source_system:
            sede.source_system = source_system
            changed = True
        if sede.external_id != ext_id:
            sede.external_id = ext_id
            changed = True

        if changed:
            sede.save()
        return sede, created, changed

    def handle(self, *args, **options):
        host = options['host']
        port = options['port']
        user = options['user']
        password = options['password']
        service = options['service']
        source_system = options['source_system']
        sedes_query = options['sedes_query']
        facultades_query = options['facultades_query']
        dry_run = options['dry_run']
        limit = options['limit']
        no_input = options['no_input']
        max_runtime_min = options['max_runtime_min']
        seccional = options['seccional']

        if not all([host, user, password, service]):
            self.stdout.write(self.style.ERROR('Faltan credenciales Oracle (host/user/password/service)'))
            return

        if not dry_run and not no_input:
            self.stdout.write(self.style.WARNING('Modo REAL: se escribira staging, mapping y tablas finales.'))
            confirm = input('Deseas continuar? (s/n): ').strip().lower()
            if confirm != 's':
                self.stdout.write(self.style.WARNING('Operacion cancelada'))
                return

        run_type = OracleSyncRun.TYPE_FULL if facultades_query else OracleSyncRun.TYPE_SEDES
        run = OracleSyncRun.objects.create(
            source_system=source_system,
            run_type=run_type,
            dry_run=dry_run,
            status=OracleSyncRun.STATUS_RUNNING,
            report={},
        )

        summary = {
            'sedes': {
                'extracted': 0,
                'staged_created': 0,
                'staged_updated': 0,
                'mapped': 0,
                'pending': 0,
                'classified_as_seccional': 0,
                'classified_as_non_physical': 0,
                'classified_as_sede': 0,
                'classified_as_special': 0,
            },
            'seccionales': {'created': 0, 'reactivated': 0, 'unchanged': 0},
            'sedes_local': {'created': 0, 'updated': 0, 'unchanged': 0},
            'facultades': {'extracted': 0, 'staged_created': 0, 'staged_updated': 0, 'loaded_created': 0, 'loaded_updated': 0, 'ignored': 0},
            'issues': 0,
            'dry_run': dry_run,
        }

        conn = None
        cursor = None
        started = timezone.now()

        try:
            conn = oracledb.connect(user=user, password=password, dsn=f'{host}:{port}/{service}')
            cursor = conn.cursor()

            if timezone.now() - started > timedelta(minutes=max_runtime_min):
                raise TimeoutError('Tiempo maximo de ejecucion excedido antes de iniciar extract')

            # Extract sedes
            sedes_rows, sedes_cols = self._fetch_rows(
                cursor,
                sedes_query,
                limit=limit,
                seccional=seccional,
                seccional_columns=('SEDE', 'NOMBRE_SEDE'),
            )
            summary['sedes']['extracted'] = len(sedes_rows)
            self.stdout.write(self.style.SUCCESS(f'Sedes extraidas: {len(sedes_rows)} columnas={sedes_cols}'))

            sede_changes = []
            for row in sedes_rows:
                ext_id = str(self._first_present(row, ['id_sede', 'idsede', 'id']) or '').strip()
                nombre_sede = str(self._first_present(row, ['nombre_sede', 'sede', 'nombre']) or '').strip()
                if not ext_id or not nombre_sede:
                    summary['issues'] += 1
                    if not dry_run:
                        self._issue(
                            run,
                            source_system,
                            'staging_sede_invalida',
                            OracleSyncIssue.SEVERITY_WARNING,
                            'Fila de sede sin id_sede o nombre_sede',
                            payload=row,
                        )
                    continue

                payload = {
                    'external_id': ext_id,
                    'nombre_sede': nombre_sede,
                    'raw': row,
                }
                row_hash = self._row_hash(payload)
                override = self._oracle_sede_override(ext_id, nombre_sede)
                if override:
                    city = override.get('city') or self._city_from_mixed_name(nombre_sede)
                    has_match = bool(city)
                    classification = {
                        'kind': override.get('kind', 'sede'),
                        'create_sede_local': bool(override.get('create_sede_local', True)),
                        'reason': override.get('reason', 'override'),
                    }
                    normalized_sede_name = override.get('canonical_name') or nombre_sede
                    extra_sedes = override.get('extra_sedes') or []
                else:
                    city = self._city_from_mixed_name(nombre_sede)
                    has_match = bool(city)
                    classification = self._classify_oracle_sede(nombre_sede)
                    normalized_sede_name = nombre_sede
                    extra_sedes = []

                sede_changes.append(
                    {
                        'external_id': ext_id,
                        'nombre_sede': nombre_sede,
                        'nombre_sede_normalizado': normalized_sede_name,
                        'row': row,
                        'row_hash': row_hash,
                        'city': city,
                        'has_match': has_match,
                        'classification': classification,
                        'extra_sedes': extra_sedes,
                    }
                )

                kind = classification['kind']
                if kind in ('seccional_label', 'city_as_sede') or kind.startswith('seccional_'):
                    summary['sedes']['classified_as_seccional'] += 1
                elif kind == 'non_physical':
                    summary['sedes']['classified_as_non_physical'] += 1
                elif kind == 'sede':
                    summary['sedes']['classified_as_sede'] += 1
                else:
                    summary['sedes']['classified_as_special'] += 1

                if has_match:
                    summary['sedes']['mapped'] += 1
                else:
                    summary['sedes']['pending'] += 1

            if dry_run:
                # Solo simulacion: no persiste staging/mapping/load.
                summary['issues'] += summary['sedes']['pending']
            else:
                with transaction.atomic():
                    for item in sede_changes:
                        stg, created = StgOracleSede.objects.update_or_create(
                            source_system=source_system,
                            external_id=item['external_id'],
                            defaults={
                                'nombre_sede': item['nombre_sede'],
                                'raw_data': item['row'],
                                'row_hash': item['row_hash'],
                            },
                        )
                        if created:
                            summary['sedes']['staged_created'] += 1
                        else:
                            summary['sedes']['staged_updated'] += 1

                        metodo = MapOracleSedeSeccional.METHOD_AUTO if item['has_match'] else MapOracleSedeSeccional.METHOD_PENDING
                        estado = MapOracleSedeSeccional.STATUS_MAPPED if item['has_match'] else MapOracleSedeSeccional.STATUS_PENDING
                        confianza = '0.95' if item['has_match'] else '0.00'

                        seccional_obj = None
                        sede_obj = None
                        if item['has_match']:
                            seccional_obj, sec_created = Seccional.objects.get_or_create(
                                ciudad=item['city'], defaults={'activa': True}
                            )
                            if sec_created:
                                summary['seccionales']['created'] += 1
                            elif not seccional_obj.activa:
                                seccional_obj.activa = True
                                seccional_obj.save(update_fields=['activa'])
                                summary['seccionales']['reactivated'] += 1
                            else:
                                summary['seccionales']['unchanged'] += 1

                            if item['classification']['create_sede_local']:
                                sede_obj, sede_created, sede_changed = self._upsert_sede_local(
                                    source_system,
                                    item['external_id'],
                                    item['nombre_sede_normalizado'],
                                    seccional_obj,
                                )
                                if sede_created:
                                    summary['sedes_local']['created'] += 1
                                elif sede_changed:
                                    summary['sedes_local']['updated'] += 1
                                else:
                                    summary['sedes_local']['unchanged'] += 1

                                for extra in item.get('extra_sedes', []):
                                    extra_city = extra.get('city') or item['city']
                                    extra_seccional, extra_sec_created = Seccional.objects.get_or_create(
                                        ciudad=extra_city, defaults={'activa': True}
                                    )
                                    if extra_sec_created:
                                        summary['seccionales']['created'] += 1
                                    elif not extra_seccional.activa:
                                        extra_seccional.activa = True
                                        extra_seccional.save(update_fields=['activa'])
                                        summary['seccionales']['reactivated'] += 1
                                    else:
                                        summary['seccionales']['unchanged'] += 1

                                    _, extra_created, extra_changed = self._upsert_sede_local(
                                        source_system,
                                        str(extra.get('external_id') or f"{item['external_id']}-EXTRA"),
                                        str(extra.get('nombre') or ''),
                                        extra_seccional,
                                    )
                                    if extra_created:
                                        summary['sedes_local']['created'] += 1
                                    elif extra_changed:
                                        summary['sedes_local']['updated'] += 1
                                    else:
                                        summary['sedes_local']['unchanged'] += 1

                        map_obj, _ = MapOracleSedeSeccional.objects.update_or_create(
                            source_system=source_system,
                            external_id_oracle=item['external_id'],
                            defaults={
                                'nombre_oracle': item['nombre_sede'],
                                'seccional': seccional_obj,
                                'sede': sede_obj,
                                'metodo_asignacion': metodo,
                                'estado': estado,
                                'confianza': confianza,
                                'observaciones': (
                                    f"Clasificacion={item['classification']['kind']}; "
                                    f"motivo={item['classification']['reason']}"
                                    if item['has_match']
                                    else 'Pendiente revision manual'
                                ),
                                'ultimo_hash_oracle': item['row_hash'],
                            },
                        )

                        if not item['has_match']:
                            summary['issues'] += 1
                            self._issue(
                                run,
                                source_system,
                                'mapeo_sede_pendiente',
                                OracleSyncIssue.SEVERITY_WARNING,
                                'No se pudo inferir seccional de forma automatica',
                                external_id=item['external_id'],
                                payload={'nombre_sede': item['nombre_sede'], 'mapping_id': map_obj.id},
                            )

            # Extract facultades (opcional)
            if facultades_query:
                fac_rows, fac_cols = self._fetch_rows(
                    cursor,
                    facultades_query,
                    limit=limit,
                    seccional=seccional,
                    seccional_columns=('SEDE', 'NOMBRE_SEDE'),
                )
                summary['facultades']['extracted'] = len(fac_rows)
                self.stdout.write(self.style.SUCCESS(f'Facultades extraidas: {len(fac_rows)} columnas={fac_cols}'))

                if not dry_run:
                    with transaction.atomic():
                        for row in fac_rows:
                            ext_id = str(self._first_present(row, ['id_facultad', 'cod_facultad', 'id']) or '').strip()
                            nombre_fac = str(self._first_present(row, ['nombre_facultad', 'facultad', 'nombre']) or '').strip()
                            id_sede_oracle = str(self._first_present(row, ['id_sede', 'id_sede_oracle']) or '').strip()
                            nombre_sede_oracle = str(self._first_present(row, ['nombre_sede', 'sede']) or '').strip()

                            if not ext_id or not nombre_fac:
                                summary['facultades']['ignored'] += 1
                                summary['issues'] += 1
                                self._issue(
                                    run,
                                    source_system,
                                    'staging_facultad_invalida',
                                    OracleSyncIssue.SEVERITY_WARNING,
                                    'Fila de facultad sin id o nombre',
                                    payload=row,
                                )
                                continue

                            payload = {
                                'external_id': ext_id,
                                'id_sede_oracle': id_sede_oracle,
                                'nombre_sede_oracle': nombre_sede_oracle,
                                'nombre_facultad': nombre_fac,
                                'raw': row,
                            }
                            row_hash = self._row_hash(payload)

                            stg_fac, created = StgOracleFacultad.objects.update_or_create(
                                source_system=source_system,
                                external_id=ext_id,
                                defaults={
                                    'id_sede_oracle': id_sede_oracle,
                                    'nombre_sede_oracle': nombre_sede_oracle,
                                    'nombre_facultad': nombre_fac,
                                    'raw_data': row,
                                    'row_hash': row_hash,
                                },
                            )
                            if created:
                                summary['facultades']['staged_created'] += 1
                            else:
                                summary['facultades']['staged_updated'] += 1

                            if not id_sede_oracle:
                                summary['facultades']['ignored'] += 1
                                summary['issues'] += 1
                                self._issue(
                                    run,
                                    source_system,
                                    'facultad_sin_id_sede',
                                    OracleSyncIssue.SEVERITY_WARNING,
                                    'No se puede cargar facultad sin id_sede_oracle',
                                    external_id=ext_id,
                                    payload={'staging_id': stg_fac.id},
                                )
                                continue

                            mapa = MapOracleSedeSeccional.objects.filter(
                                source_system=source_system,
                                external_id_oracle=id_sede_oracle,
                            ).first()

                            sede_local = mapa.sede if mapa and mapa.sede_id else Sede.objects.filter(
                                source_system=source_system,
                                external_id=id_sede_oracle,
                            ).first()

                            if sede_local is None:
                                summary['facultades']['ignored'] += 1
                                summary['issues'] += 1
                                self._issue(
                                    run,
                                    source_system,
                                    'facultad_sede_no_mapeada',
                                    OracleSyncIssue.SEVERITY_WARNING,
                                    'No hay Sede local para el id_sede_oracle informado',
                                    external_id=ext_id,
                                    payload={
                                        'id_sede_oracle': id_sede_oracle,
                                        'nombre_sede_oracle': nombre_sede_oracle,
                                    },
                                )
                                continue

                            # Validacion de consistencia: id_sede manda, nombre_sede valida.
                            if nombre_sede_oracle and mapa and mapa.nombre_oracle:
                                if self._norm_upper(nombre_sede_oracle) != self._norm_upper(mapa.nombre_oracle):
                                    summary['facultades']['ignored'] += 1
                                    summary['issues'] += 1
                                    self._issue(
                                        run,
                                        source_system,
                                        'facultad_conflicto_sede_nombre',
                                        OracleSyncIssue.SEVERITY_ERROR,
                                        'id_sede_oracle y nombre_sede_oracle no coinciden contra mapping',
                                        external_id=ext_id,
                                        payload={
                                            'id_sede_oracle': id_sede_oracle,
                                            'nombre_sede_oracle': nombre_sede_oracle,
                                            'mapping_nombre_oracle': mapa.nombre_oracle,
                                        },
                                    )
                                    continue

                            facultad, f_created = Facultad.objects.get_or_create(
                                source_system=source_system,
                                external_id=ext_id,
                                defaults={'nombre': nombre_fac, 'sede': sede_local, 'activa': True},
                            )
                            if f_created:
                                summary['facultades']['loaded_created'] += 1
                            else:
                                changed = False
                                if facultad.nombre != nombre_fac:
                                    facultad.nombre = nombre_fac
                                    changed = True
                                if facultad.sede_id != sede_local.id:
                                    facultad.sede = sede_local
                                    changed = True
                                if not facultad.activa:
                                    facultad.activa = True
                                    changed = True
                                if changed:
                                    facultad.save()
                                    summary['facultades']['loaded_updated'] += 1

            run.status = OracleSyncRun.STATUS_SUCCESS if summary['issues'] == 0 else OracleSyncRun.STATUS_PARTIAL
            run.report = summary
            run.finished_at = timezone.now()
            run.save(update_fields=['status', 'report', 'finished_at'])

            self.stdout.write(self.style.SUCCESS('ETL finalizado'))
            self.stdout.write(self.style.SUCCESS(json.dumps(summary, ensure_ascii=True, indent=2, default=str)))

        except Exception as exc:
            run.status = OracleSyncRun.STATUS_FAILED
            run.finished_at = timezone.now()
            summary['error'] = str(exc)
            run.report = summary
            run.save(update_fields=['status', 'report', 'finished_at'])
            self.stdout.write(self.style.ERROR(f'ETL fallido: {exc}'))
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
