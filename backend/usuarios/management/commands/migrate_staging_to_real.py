#!/usr/bin/env python
"""
Migraciones de datos desde staging -> modelos reales
Orden de ejecucion:
1. PeriodosAcademicos
2. Grupos (requiere Programa + PeriodoAcademico)
3. Usuarios/Docentes (desde StgOracleDocente)
4. Usuarios/Estudiantes (desde StgOracleEstudiante)
5. EspaciosFisicos (desde StgOracleEspacioFisico)
6. Horarios (requiere Grupo + Asignatura + Usuario + Espacio)
"""

from datetime import datetime, time as time_obj
import re
import unicodedata

from django.core.management.base import BaseCommand
from django.db.models import Q

from asignaturas.models import Asignatura
from espacios.models import EspacioFisico, StgOracleEspacioFisico, TipoEspacio
from grupos.models import Grupo, StgOracleGrupoAcademico
from horario.models import Horario, StgOracleHorario
from periodos.models import PeriodoAcademico
from programas.models import Programa
from sedes.models import MapOracleSedeSeccional, Seccional, Sede
from usuarios.models import Rol, StgOracleDocente, StgOracleEstudiante, Usuario


class Command(BaseCommand):
    help = 'Migra datos desde staging Oracle a modelos reales'

    def add_arguments(self, parser):
        parser.add_argument(
            '--etapa',
            type=str,
            choices=['periodos', 'grupos', 'docentes', 'estudiantes', 'espacios', 'horarios', 'all'],
            default='all',
            help='Etapa de migracion a ejecutar',
        )
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument('--limit', type=int, default=None)
        parser.add_argument(
            '--seccional',
            type=str,
            default='',
            help='Filtra por seccional (nombre/ciudad o id). Ej: Barranquilla o 1',
        )

    def handle(self, *args, **options):
        etapa = options['etapa']
        dry_run = options['dry_run']
        limit = options['limit']
        seccional_filter = self._resolve_seccional_filter(options.get('seccional'))

        if etapa in ['periodos', 'all']:
            self.migrate_periodos(dry_run, limit)
        if etapa in ['grupos', 'all']:
            self.migrate_grupos(dry_run, limit, seccional_filter=seccional_filter)
        if etapa in ['docentes', 'all']:
            self.migrate_docentes(dry_run, limit, seccional_filter=seccional_filter)
        if etapa in ['estudiantes', 'all']:
            self.migrate_estudiantes(dry_run, limit, seccional_filter=seccional_filter)
        if etapa in ['espacios', 'all']:
            self.migrate_espacios(dry_run, limit, seccional_filter=seccional_filter)
        if etapa in ['horarios', 'all']:
            self.migrate_horarios(dry_run, limit, seccional_filter=seccional_filter)

    def _resolve_seccional_filter(self, raw_value):
        raw = self._to_text(raw_value)
        if not raw:
            return None
        seccional = None
        if raw.isdigit():
            seccional = Seccional.objects.filter(id=int(raw)).first()
        if not seccional:
            seccional = Seccional.objects.filter(ciudad__iexact=raw).first()
        if not seccional:
            self.stdout.write(self.style.WARNING(f'Seccional "{raw}" no encontrada. Se ejecuta sin filtro.'))
            return None
        self.stdout.write(self.style.SUCCESS(f'Filtro seccional activo: {seccional.ciudad} (id={seccional.id})'))
        return seccional

    @staticmethod
    def _to_text(value):
        return str(value or '').strip()

    @staticmethod
    def _to_int(value, default=None):
        try:
            return int(str(value).strip())
        except (TypeError, ValueError, AttributeError):
            return default

    @staticmethod
    def _normalize_text(value):
        text = str(value or '').strip()
        if not text:
            return ''
        upper = text.upper()
        no_accents = ''.join(
            ch for ch in unicodedata.normalize('NFD', upper) if unicodedata.category(ch) != 'Mn'
        )
        return re.sub(r'\s+', ' ', no_accents).strip()

    @staticmethod
    def _coerce_semestre(value, default=1):
        parsed = Command._to_int(value, default=default)
        if parsed is None:
            return default
        if parsed < 1:
            return 1
        if parsed > 10:
            return 10
        return parsed

    @staticmethod
    def _find_role(nombre):
        return Rol.objects.filter(nombre__iexact=nombre).first()

    @classmethod
    def _find_usuario_by_normalized_name(cls, nombre, rol_nombre=None):
        nombre_normalizado = cls._normalize_text(nombre)
        if not nombre_normalizado:
            return None

        usuarios = Usuario.objects.exclude(nombre__isnull=True).exclude(nombre='')
        if rol_nombre:
            usuarios = usuarios.filter(rol__nombre__iexact=rol_nombre)

        for usuario in usuarios.order_by('id'):
            if cls._normalize_text(usuario.nombre) == nombre_normalizado:
                return usuario

        return None

    @staticmethod
    def _resolve_sede(source_system, external_id):
        external = str(external_id or '').strip()
        if not external:
            return None
        sede = Sede.objects.filter(
            Q(source_system=source_system, external_id=external) |
            Q(external_id=external)
        ).first()
        if sede:
            return sede

        mapping = MapOracleSedeSeccional.objects.select_related('sede').filter(
            source_system=source_system,
            external_id_oracle=external,
            sede__isnull=False,
        ).first()
        if mapping:
            return mapping.sede

        return None

    @classmethod
    def _resolve_sede_from_oracle_payload(cls, source_system, primary_external_id=None, raw_data=None, nombre_sede=None):
        candidates = [
            primary_external_id,
            (raw_data or {}).get('cod_sede'),
            (raw_data or {}).get('id_sede'),
            (raw_data or {}).get('idsede'),
            (raw_data or {}).get('sede_id'),
        ]
        seen = set()
        for candidate in candidates:
            candidate_text = cls._to_text(candidate)
            if not candidate_text or candidate_text in seen:
                continue
            seen.add(candidate_text)
            sede = cls._resolve_sede(source_system, candidate_text)
            if sede:
                return sede

        nombre_norm = cls._normalize_text(nombre_sede or (raw_data or {}).get('nombre_sede') or (raw_data or {}).get('sede'))
        if nombre_norm:
            for sede in Sede.objects.select_related('seccional').all():
                if cls._normalize_text(sede.nombre) == nombre_norm:
                    return sede
                if sede.seccional and cls._normalize_text(sede.seccional.ciudad) == nombre_norm:
                    return sede

        return None

    @staticmethod
    def _resolve_facultad(source_system, external_id):
        from facultades.models import Facultad
        external = str(external_id or '').strip()
        if not external:
            return None
        return Facultad.objects.filter(
            Q(source_system=source_system, external_id=external) |
            Q(external_id=external)
        ).first()

    @staticmethod
    def _build_unique_email(base_email, current_user_id=None):
        candidate = (base_email or '').strip().lower()
        if not candidate:
            candidate = 'usuario.local@localdomain.local'

        if '@' not in candidate:
            candidate = f'{candidate}@localdomain.local'

        owner = Usuario.objects.filter(correo=candidate).first()
        if owner and owner.id == current_user_id:
            return candidate
        if not owner:
            return candidate

        local, domain = candidate.rsplit('@', 1)
        suffix = 1
        while True:
            test_email = f'{local}{suffix}@{domain}'
            owner = Usuario.objects.filter(correo=test_email).first()
            if owner and owner.id == current_user_id:
                return test_email
            if not owner:
                return test_email
            suffix += 1

    @staticmethod
    def _resolve_periodo_year_term(periodo_nombre):
        """
        Resuelve (anio, semestre) desde codigos de periodo Oracle.
        Convenciones soportadas:
        - YYYY1 / YYYY2
        - YYYYA / YYYYB
        - YYYY-1 / YYYY-2
        - YYYY_A / YYYY_B
        Cualquier otro formato se considera ambiguo y no se infiere.
        """
        raw = Command._to_text(periodo_nombre).upper()
        if not raw:
            return None, None

        compact = re.sub(r'[\s\-_]+', '', raw)
        match = re.match(r'^(\d{4})([12AB])$', compact)
        if not match:
            return None, None

        year = int(match.group(1))
        term_token = match.group(2)
        term = 1 if term_token in ('1', 'A') else 2
        return year, term

    @staticmethod
    def _parse_time_value(raw_value):
        if raw_value is None:
            return None
        if isinstance(raw_value, time_obj):
            return raw_value
        if hasattr(raw_value, 'time'):
            try:
                return raw_value.time()
            except Exception:
                pass

        text = str(raw_value).strip()
        if not text:
            return None

        # Soporte para formatos 12h con AM/PM, por ejemplo:
        # 11:00 am, 12:00 PM, 07:30a.m., 7 pm
        text_ampm = re.sub(r'\s+', ' ', text.lower()).strip()
        text_ampm = text_ampm.replace('.', '')
        for fmt in ('%I:%M %p', '%I %p', '%I:%M%p', '%I%p'):
            try:
                return datetime.strptime(text_ampm.upper(), fmt).time()
            except ValueError:
                pass

        text = text.replace('.', ':')
        text = re.sub(r'\s+', '', text)

        for fmt in ('%H:%M:%S', '%H:%M'):
            try:
                return datetime.strptime(text, fmt).time()
            except ValueError:
                pass

        if text.isdigit():
            if len(text) <= 2:
                hh = int(text)
                if 0 <= hh <= 23:
                    return time_obj(hh, 0)
            if len(text) == 3:
                hh = int(text[0])
                mm = int(text[1:])
                if 0 <= hh <= 23 and 0 <= mm <= 59:
                    return time_obj(hh, mm)
            if len(text) == 4:
                hh = int(text[:2])
                mm = int(text[2:])
                if 0 <= hh <= 23 and 0 <= mm <= 59:
                    return time_obj(hh, mm)
            if len(text) == 6:
                hh = int(text[:2])
                mm = int(text[2:4])
                ss = int(text[4:])
                if 0 <= hh <= 23 and 0 <= mm <= 59 and 0 <= ss <= 59:
                    return time_obj(hh, mm, ss)

        return None

    @staticmethod
    def _resolve_dia_semana(stg_horario):
        num_dia = Command._to_int(getattr(stg_horario, 'num_dia_oracle', None), default=None)
        if num_dia is not None:
            # Convencion operativa SIU esperada: 1=Lunes ... 7=Domingo
            mapping_num = {
                1: 'Lunes',
                2: 'Martes',
                3: 'Miercoles',
                4: 'Jueves',
                5: 'Viernes',
                6: 'Sabado',
                7: 'Domingo',
            }
            if num_dia in mapping_num:
                return mapping_num[num_dia]

        raw = stg_horario.raw_data or {}
        possible = None
        for key in ('dia_semana', 'dia', 'nombre_dia', 'dia_clase', 'day', 'num_dia', 'numero_dia', 'dia_numero'):
            if key in raw and str(raw[key] or '').strip():
                possible = raw[key]
                break

        possible_num = Command._to_int(possible, default=None)
        if possible_num is not None:
            mapping_num = {
                1: 'Lunes',
                2: 'Martes',
                3: 'Miercoles',
                4: 'Jueves',
                5: 'Viernes',
                6: 'Sabado',
                7: 'Domingo',
            }
            if possible_num in mapping_num:
                return mapping_num[possible_num]

        norm = Command._normalize_text(possible)
        mapping = {
            'LUNES': 'Lunes',
            'MARTES': 'Martes',
            'MIERCOLES': 'Miercoles',
            'JUEVES': 'Jueves',
            'VIERNES': 'Viernes',
            'SABADO': 'Sabado',
            'DOMINGO': 'Domingo',
            'MONDAY': 'Lunes',
            'TUESDAY': 'Martes',
            'WEDNESDAY': 'Miercoles',
            'THURSDAY': 'Jueves',
            'FRIDAY': 'Viernes',
            'SATURDAY': 'Sabado',
            'SUNDAY': 'Domingo',
        }
        return mapping.get(norm, 'Lunes')

    @staticmethod
    def _map_tipo_espacio(tipo_oracle):
        code = Command._normalize_text(tipo_oracle)
        if 'LAB' in code:
            return 'Laboratorio', 'Laboratorio academico'
        if 'AUD' in code:
            return 'Auditorio', 'Auditorio'
        if 'SALA' in code:
            return 'Sala', 'Sala'
        if 'BIB' in code:
            return 'Biblioteca', 'Espacio de biblioteca'
        if 'CAN' in code or 'CANCHA' in code:
            return 'Cancha', 'Espacio deportivo'
        return 'Aula', 'Aula de clase'

    @staticmethod
    def _is_placeholder_space_name(value):
        norm = Command._normalize_text(value)
        if not norm:
            return True
        placeholders = {
            'NO DISPONIBLE',
            'NO DISPONIBLE)',
            'N DISPONIBLE',
            'N ODISPONIBLE',
            'NO DIPONIBLE',
        }
        return norm in placeholders

    @staticmethod
    def _space_match_key(value):
        base = Command._normalize_text(value)
        if not base:
            return ''
        return re.sub(r'[^A-Z0-9]+', '', base)

    @staticmethod
    def _space_match_keys(value):
        base = Command._normalize_text(value)
        if not base:
            return set()

        variants = {base}
        variants.add(re.sub(r'\([^)]*\)', ' ', base))
        variants.add(base.replace('-', ' '))
        variants.add(base.replace('SALON', 'AULA'))
        variants.add(base.replace('AULA', 'SALON'))
        variants.add(base.replace('SALA DE COMPUTO', 'SALA COMPUTO'))
        variants.add(base.replace('SALA DE INFORMATICA', 'SALA INFORMATICA'))
        variants.add(base.replace('SALA COMPUTO', 'SALA DE COMPUTO'))
        variants.add(base.replace('SALA INFORMATICA', 'SALA DE INFORMATICA'))

        normalized_variants = set()
        for variant in variants:
            cleaned = re.sub(r'\s+', ' ', variant or '').strip()
            if cleaned:
                normalized_variants.add(cleaned)
                normalized_variants.add(re.sub(r'\b([A-Z])\s+(\d{2,4})\b', r'\1\2', cleaned))

        keys = set()
        for variant in normalized_variants:
            key = Command._space_match_key(variant)
            if key:
                keys.add(key)
        return keys

    @staticmethod
    def _space_alias_candidates(value):
        """
        Genera alias para acercar NOM_AULA descriptivo a codigos de espacio.
        Ej: "Aula C 104" -> "C104", "A104C", "104C".
        """
        base = Command._normalize_text(value)
        if not base:
            return []

        aliases = set()
        pattern = re.search(
            r'\b(?:AULA|SALON|SALA DE COMPUTO|SALA COMPUTO)\s+([A-Z])\s*(\d{2,4})\b',
            base,
        )
        if pattern:
            bloque = pattern.group(1)
            numero = pattern.group(2)
            aliases.update(
                {
                    f'{bloque}{numero}',
                    f'{numero}{bloque}',
                    f'A{numero}{bloque}',
                    f'A{numero}{bloque}C',
                }
            )

        return sorted(aliases)

    def migrate_periodos(self, dry_run=False, limit=None):
        self.stdout.write('=' * 60)
        self.stdout.write('ETAPA 1: Migrando Periodos Academicos')
        self.stdout.write('=' * 60)

        periodos_unicos = (
            StgOracleGrupoAcademico.objects
            .filter(estado_registro='valido')
            .exclude(periodo_academico__isnull=True)
            .exclude(periodo_academico='')
            .order_by('periodo_academico')
            .values_list('periodo_academico', flat=True)
            .distinct()
        )

        if limit:
            periodos_unicos = periodos_unicos[:limit]

        periodos_creados = 0
        periodos_actualizados = 0
        periodos_existentes = 0
        periodos_ambiguos = 0

        for periodo_nombre in periodos_unicos:
            year, term = self._resolve_periodo_year_term(periodo_nombre)

            if year is None or term not in (1, 2):
                periodos_ambiguos += 1
                fallback_year = year if year is not None else datetime.now().year
                fecha_inicio = datetime(fallback_year, 1, 15).date()
                fecha_fin = datetime(fallback_year, 12, 15).date()
            elif term == 1:
                fecha_inicio = datetime(year, 2, 2).date()
                fecha_fin = datetime(year, 6, 30).date()
            else:
                fecha_inicio = datetime(year, 7, 28).date()
                fecha_fin = datetime(year, 12, 19).date()

            if dry_run:
                existing = PeriodoAcademico.objects.filter(nombre=periodo_nombre).first()
                if existing:
                    if existing.fecha_inicio != fecha_inicio or existing.fecha_fin != fecha_fin:
                        periodos_actualizados += 1
                    else:
                        periodos_existentes += 1
                else:
                    periodos_creados += 1
                continue

            periodo, created = PeriodoAcademico.objects.get_or_create(
                nombre=periodo_nombre,
                defaults={
                    'fecha_inicio': fecha_inicio,
                    'fecha_fin': fecha_fin,
                    'activo': True,
                },
            )
            if created:
                periodos_creados += 1
                continue

            changed = False
            if periodo.fecha_inicio != fecha_inicio:
                periodo.fecha_inicio = fecha_inicio
                changed = True
            if periodo.fecha_fin != fecha_fin:
                periodo.fecha_fin = fecha_fin
                changed = True
            if changed:
                periodo.save()
                periodos_actualizados += 1
            else:
                periodos_existentes += 1

        self.stdout.write(
            self.style.SUCCESS(
                'Periodos - '
                f'Creados: {periodos_creados}, '
                f'Actualizados: {periodos_actualizados}, '
                f'Existentes: {periodos_existentes}, '
                f'Codigo ambiguo (15-ene a 15-dic): {periodos_ambiguos}'
            )
        )

    def migrate_grupos(self, dry_run=False, limit=None, seccional_filter=None):
        self.stdout.write('=' * 60)
        self.stdout.write('ETAPA 2: Migrando Grupos Academicos')
        self.stdout.write('=' * 60)

        stg_grupos = StgOracleGrupoAcademico.objects.filter(estado_registro='valido')
        if seccional_filter:
            sedes_ids = list(Sede.objects.filter(seccional=seccional_filter).values_list('external_id', flat=True))
            sedes_ids = [self._to_text(s) for s in sedes_ids if self._to_text(s)]
            stg_grupos = stg_grupos.filter(id_sede_oracle__in=sedes_ids)
        if limit:
            stg_grupos = stg_grupos[:limit]

        grupos_creados = 0
        grupos_actualizados = 0
        grupos_sin_cambio = 0
        grupos_error = 0
        programa_no_encontrado = 0
        periodo_no_encontrado = 0
        id_grupo_invalido = 0

        for stg_grupo in stg_grupos:
            try:
                id_grupo = self._to_int(stg_grupo.id_grupo_oracle, default=None)
                if id_grupo is None:
                    id_grupo_invalido += 1

                programa = None
                id_programa = self._to_int(stg_grupo.id_programa_oracle, default=None)
                if id_programa:
                    programa = Programa.objects.filter(id=id_programa).first()

                if not programa:
                    nombre_prog = self._to_text(stg_grupo.nombre_programa_oracle)
                    if nombre_prog:
                        programa = Programa.objects.filter(nombre__icontains=nombre_prog[:50]).first()

                if not programa:
                    programa_no_encontrado += 1
                    grupos_error += 1
                    continue

                periodo = PeriodoAcademico.objects.filter(
                    nombre=stg_grupo.periodo_academico
                ).first()
                if not periodo:
                    periodo_no_encontrado += 1
                    grupos_error += 1
                    continue

                nombre = self._to_text(stg_grupo.nombre_grupo_oracle)
                if not nombre:
                    nombre = f'Grupo {stg_grupo.id_grupo_oracle}'
                semestre = self._coerce_semestre(stg_grupo.semestre_oracle, default=1)

                if dry_run:
                    if id_grupo and Grupo.objects.filter(id=id_grupo).exists():
                        grupos_actualizados += 1
                    else:
                        grupos_creados += 1
                    continue

                if id_grupo:
                    grupo, created = Grupo.objects.get_or_create(
                        id=id_grupo,
                        defaults={
                            'programa': programa,
                            'periodo': periodo,
                            'nombre': nombre,
                            'semestre': semestre,
                            'activo': True,
                        },
                    )
                else:
                    grupo, created = Grupo.objects.get_or_create(
                        programa=programa,
                        periodo=periodo,
                        nombre=nombre,
                        defaults={
                            'semestre': semestre,
                            'activo': True,
                        },
                    )

                if created:
                    grupos_creados += 1
                    continue

                changed = False
                if grupo.programa_id != programa.id:
                    grupo.programa = programa
                    changed = True
                if grupo.periodo_id != periodo.id:
                    grupo.periodo = periodo
                    changed = True
                if grupo.nombre != nombre:
                    grupo.nombre = nombre
                    changed = True
                if grupo.semestre != semestre:
                    grupo.semestre = semestre
                    changed = True
                if not grupo.activo:
                    grupo.activo = True
                    changed = True

                if changed:
                    grupo.save()
                    grupos_actualizados += 1
                else:
                    grupos_sin_cambio += 1

            except Exception as exc:
                self.stdout.write(self.style.ERROR(f'  Error en grupo {stg_grupo.id_grupo_oracle}: {exc}'))
                grupos_error += 1

        self.stdout.write(
            self.style.SUCCESS(
                'Grupos - '
                f'Creados: {grupos_creados}, '
                f'Actualizados: {grupos_actualizados}, '
                f'Sin cambio: {grupos_sin_cambio}, '
                f'Errores: {grupos_error}, '
                f'Programa no encontrado: {programa_no_encontrado}, '
                f'Periodo no encontrado: {periodo_no_encontrado}, '
                f'ID grupo invalido: {id_grupo_invalido}'
            )
        )

    def migrate_docentes(self, dry_run=False, limit=None, seccional_filter=None):
        self.stdout.write('=' * 60)
        self.stdout.write('ETAPA 3: Migrando Docentes')
        self.stdout.write('=' * 60)

        stg_docentes = StgOracleDocente.objects.filter(estado_registro='valido')
        if seccional_filter:
            sedes_ids = list(Sede.objects.filter(seccional=seccional_filter).values_list('external_id', flat=True))
            sedes_ids = [self._to_text(s) for s in sedes_ids if self._to_text(s)]
            stg_docentes = stg_docentes.filter(id_sede_oracle__in=sedes_ids)
        if limit:
            stg_docentes = stg_docentes[:limit]

        docentes_creados = 0
        docentes_actualizados = 0
        docentes_sin_cambio = 0
        docentes_error = 0
        rol_docente = self._find_role('docente')

        for stg_docente in stg_docentes:
            try:
                nombre = self._to_text(stg_docente.nombre_completo)
                if not nombre:
                    nombres = self._to_text(stg_docente.nombres)
                    apellidos = self._to_text(stg_docente.apellidos)
                    nombre = f'{nombres} {apellidos}'.strip()
                if not nombre:
                    nombre = f'Docente {stg_docente.numero_documento or stg_docente.external_id}'

                source_system = stg_docente.source_system or 'ORACLE_SIU'
                correo_pref = (
                    self._to_text(stg_docente.correo_institucional).lower()
                    or self._to_text(stg_docente.correo_personal).lower()
                )
                numero_doc = self._to_text(stg_docente.numero_documento)
                id_docente = self._to_text(stg_docente.id_docente_oracle)
                if not correo_pref:
                    base = numero_doc or id_docente or self._to_text(stg_docente.external_id) or 'docente'
                    correo_pref = f'{base}@docente.local'

                usuario = Usuario.objects.filter(correo=correo_pref).first()
                matched_by_name = False
                if not usuario and numero_doc:
                    usuario = Usuario.objects.filter(correo=f'{numero_doc}@docente.local').first()
                if not usuario and id_docente:
                    usuario = Usuario.objects.filter(correo=f'{id_docente}@docente.local').first()
                if not usuario:
                    usuario = self._find_usuario_by_normalized_name(nombre)
                    matched_by_name = usuario is not None

                sede = self._resolve_sede_from_oracle_payload(
                    source_system,
                    stg_docente.id_sede_oracle,
                    getattr(stg_docente, 'raw_data', None),
                )
                facultad = self._resolve_facultad(source_system, stg_docente.id_facultad_oracle)
                activo = (self._to_text(stg_docente.estado_docente).lower() not in ('inactivo', '0', 'false', 'no'))

                if dry_run:
                    if usuario:
                        docentes_actualizados += 1
                    else:
                        docentes_creados += 1
                    continue

                if not usuario:
                    correo_final = self._build_unique_email(correo_pref)
                    usuario = Usuario.objects.create(
                        correo=correo_final,
                        nombre=nombre,
                        activo=activo,
                        is_active=activo,
                        rol=rol_docente,
                        sede=sede,
                        facultad=facultad,
                    )
                    docentes_creados += 1
                    continue

                changed = False
                if usuario.nombre != nombre:
                    usuario.nombre = nombre
                    changed = True
                if not matched_by_name and usuario.activo != activo:
                    usuario.activo = activo
                    usuario.is_active = activo
                    changed = True
                if not matched_by_name and rol_docente and usuario.rol_id != rol_docente.id:
                    usuario.rol = rol_docente
                    changed = True
                if sede and usuario.sede_id != sede.id:
                    usuario.sede = sede
                    changed = True
                if facultad and usuario.facultad_id != facultad.id:
                    usuario.facultad = facultad
                    changed = True

                if changed:
                    usuario.save()
                    docentes_actualizados += 1
                else:
                    docentes_sin_cambio += 1

            except Exception as exc:
                self.stdout.write(
                    self.style.ERROR(f'  Error en docente {stg_docente.numero_documento}: {exc}')
                )
                docentes_error += 1

        self.stdout.write(
            self.style.SUCCESS(
                'Docentes - '
                f'Creados: {docentes_creados}, '
                f'Actualizados: {docentes_actualizados}, '
                f'Sin cambio: {docentes_sin_cambio}, '
                f'Errores: {docentes_error}'
            )
        )

    def migrate_estudiantes(self, dry_run=False, limit=None, seccional_filter=None):
        self.stdout.write('=' * 60)
        self.stdout.write('ETAPA 3B: Migrando Estudiantes')
        self.stdout.write('=' * 60)

        stg_estudiantes = StgOracleEstudiante.objects.filter(estado_registro='valido')
        if seccional_filter:
            sedes_ids = list(Sede.objects.filter(seccional=seccional_filter).values_list('external_id', flat=True))
            sedes_ids = [self._to_text(s) for s in sedes_ids if self._to_text(s)]
            stg_estudiantes = stg_estudiantes.filter(id_sede_oracle__in=sedes_ids)
        if limit:
            stg_estudiantes = stg_estudiantes[:limit]

        estudiantes_creados = 0
        estudiantes_actualizados = 0
        estudiantes_sin_cambio = 0
        estudiantes_error = 0
        rol_estudiante = self._find_role('estudiante')

        for stg_estudiante in stg_estudiantes:
            try:
                nombre = (
                    f'{self._to_text(stg_estudiante.nombres)} {self._to_text(stg_estudiante.apellidos)}'.strip()
                    or self._to_text(stg_estudiante.nombre_completo)
                    or f'Estudiante {stg_estudiante.external_id}'
                )

                base_id = (
                    self._to_text(stg_estudiante.codigo_estudiante_oracle)
                    or self._to_text(stg_estudiante.id_estudiante_oracle)
                    or self._to_text(stg_estudiante.external_id)
                    or 'estudiante'
                )
                correo_pref = f'{base_id}@estudiante.local'.lower()

                usuario = Usuario.objects.filter(correo=correo_pref).first()
                matched_by_name = False
                if not usuario:
                    id_est = self._to_text(stg_estudiante.id_estudiante_oracle)
                    if id_est:
                        usuario = Usuario.objects.filter(correo=f'{id_est}@estudiante.local').first()
                if not usuario:
                    usuario = self._find_usuario_by_normalized_name(nombre)
                    matched_by_name = usuario is not None
                source_system = stg_estudiante.source_system or 'ORACLE_SIU'
                sede = self._resolve_sede_from_oracle_payload(
                    source_system,
                    getattr(stg_estudiante, 'id_sede_oracle', None),
                    getattr(stg_estudiante, 'raw_data', None),
                )

                if dry_run:
                    if usuario:
                        estudiantes_actualizados += 1
                    else:
                        estudiantes_creados += 1
                    continue

                if not usuario:
                    correo_final = self._build_unique_email(correo_pref)
                    Usuario.objects.create(
                        correo=correo_final,
                        nombre=nombre,
                        activo=True,
                        is_active=True,
                        rol=rol_estudiante,
                        sede=sede,
                    )
                    estudiantes_creados += 1
                    continue

                changed = False
                if usuario.nombre != nombre:
                    usuario.nombre = nombre
                    changed = True
                if not matched_by_name and rol_estudiante and usuario.rol_id != rol_estudiante.id:
                    usuario.rol = rol_estudiante
                    changed = True
                if not matched_by_name and not usuario.activo:
                    usuario.activo = True
                    usuario.is_active = True
                    changed = True
                if sede and usuario.sede_id != sede.id:
                    usuario.sede = sede
                    changed = True

                if changed:
                    usuario.save()
                    estudiantes_actualizados += 1
                else:
                    estudiantes_sin_cambio += 1

            except Exception as exc:
                self.stdout.write(
                    self.style.ERROR(f'  Error en estudiante {stg_estudiante.external_id}: {exc}')
                )
                estudiantes_error += 1

        self.stdout.write(
            self.style.SUCCESS(
                'Estudiantes - '
                f'Creados: {estudiantes_creados}, '
                f'Actualizados: {estudiantes_actualizados}, '
                f'Sin cambio: {estudiantes_sin_cambio}, '
                f'Errores: {estudiantes_error}'
            )
        )

    def migrate_espacios(self, dry_run=False, limit=None, seccional_filter=None):
        self.stdout.write('=' * 60)
        self.stdout.write('ETAPA 4: Migrando Espacios Fisicos')
        self.stdout.write('=' * 60)

        stg_espacios = StgOracleEspacioFisico.objects.filter(estado_registro='valido')
        if seccional_filter:
            sedes_ids = list(Sede.objects.filter(seccional=seccional_filter).values_list('external_id', flat=True))
            sedes_ids = [self._to_text(s) for s in sedes_ids if self._to_text(s)]
            stg_espacios = stg_espacios.filter(id_sede_oracle__in=sedes_ids)
        if limit:
            stg_espacios = stg_espacios[:limit]

        espacios_creados = 0
        espacios_actualizados = 0
        espacios_sin_cambio = 0
        espacios_error = 0
        sede_no_encontrada = 0
        tipo_creado = 0
        sedes_no_resueltas = {}

        for stg_espacio in stg_espacios:
            try:
                source_system = stg_espacio.source_system or 'ORACLE_SIU'
                sede = self._resolve_sede_from_oracle_payload(
                    source_system,
                    stg_espacio.id_sede_oracle,
                    stg_espacio.raw_data,
                    stg_espacio.nombre_sede_oracle,
                )
                if not sede:
                    sede_no_encontrada += 1
                    espacios_error += 1
                    raw = stg_espacio.raw_data or {}
                    key = (
                        self._to_text(stg_espacio.id_sede_oracle),
                        self._to_text(raw.get('cod_sede')),
                        self._to_text(raw.get('id_sede')),
                        self._to_text(stg_espacio.nombre_sede_oracle),
                    )
                    sedes_no_resueltas[key] = sedes_no_resueltas.get(key, 0) + 1
                    continue

                tipo_nombre, tipo_desc = self._map_tipo_espacio(stg_espacio.tipo_espacio_oracle)
                tipo, created_tipo = TipoEspacio.objects.get_or_create(
                    nombre=tipo_nombre,
                    defaults={'descripcion': tipo_desc},
                )
                if created_tipo:
                    tipo_creado += 1

                nombre_oracle = self._to_text(stg_espacio.nombre_espacio_oracle)
                ident = self._to_text(stg_espacio.ident_aula_oracle)
                if self._is_placeholder_space_name(nombre_oracle) and ident:
                    nombre = ident
                else:
                    nombre = nombre_oracle or ident
                if not nombre:
                    nombre = f'Espacio {stg_espacio.external_id}'

                bloque = self._to_text(stg_espacio.bloque_oracle)
                ubicacion = ' '.join([piece for piece in [bloque, ident] if piece]).strip() or ident or None

                espacio = EspacioFisico.objects.filter(sede=sede, nombre=nombre).first()
                if not espacio and ident:
                    espacio = EspacioFisico.objects.filter(sede=sede, ubicacion__icontains=ident).first()

                if dry_run:
                    if espacio:
                        espacios_actualizados += 1
                    else:
                        espacios_creados += 1
                    continue

                if not espacio:
                    EspacioFisico.objects.create(
                        nombre=nombre,
                        sede=sede,
                        tipo=tipo,
                        capacidad=0,
                        ubicacion=ubicacion,
                        estado='Disponible',
                        esta_abierto=True,
                    )
                    espacios_creados += 1
                    continue

                changed = False
                if espacio.tipo_id != tipo.id:
                    espacio.tipo = tipo
                    changed = True
                if espacio.ubicacion != ubicacion:
                    espacio.ubicacion = ubicacion
                    changed = True
                if espacio.estado != 'Disponible':
                    espacio.estado = 'Disponible'
                    changed = True
                if not espacio.esta_abierto:
                    espacio.esta_abierto = True
                    changed = True

                if changed:
                    espacio.save()
                    espacios_actualizados += 1
                else:
                    espacios_sin_cambio += 1

            except Exception as exc:
                self.stdout.write(
                    self.style.ERROR(f'  Error en espacio {stg_espacio.ident_aula_oracle}: {exc}')
                )
                espacios_error += 1

        self.stdout.write(
            self.style.SUCCESS(
                'Espacios - '
                f'Creados: {espacios_creados}, '
                f'Actualizados: {espacios_actualizados}, '
                f'Sin cambio: {espacios_sin_cambio}, '
                f'Errores: {espacios_error}, '
                f'Sede no encontrada: {sede_no_encontrada}, '
                f'Tipos nuevos: {tipo_creado}'
            )
        )
        if sedes_no_resueltas:
            muestras = sorted(sedes_no_resueltas.items(), key=lambda item: item[1], reverse=True)[:10]
            detalle = [
                {
                    'id_sede_oracle': key[0],
                    'raw_cod_sede': key[1],
                    'raw_id_sede': key[2],
                    'nombre_sede_oracle': key[3],
                    'filas': count,
                }
                for key, count in muestras
            ]
            self.stdout.write(self.style.WARNING(f'Muestras de sedes no resueltas en espacios: {detalle}'))

    def migrate_horarios(self, dry_run=False, limit=None, seccional_filter=None):
        self.stdout.write('=' * 60)
        self.stdout.write('ETAPA 5: Migrando Horarios')
        self.stdout.write('=' * 60)

        stg_horarios = StgOracleHorario.objects.filter(estado_registro='valido')
        if seccional_filter:
            sedes_ids = list(Sede.objects.filter(seccional=seccional_filter).values_list('external_id', flat=True))
            sedes_ids = [self._to_text(s) for s in sedes_ids if self._to_text(s)]
            stg_horarios = stg_horarios.filter(id_sede_oracle__in=sedes_ids)
        if limit:
            stg_horarios = stg_horarios[:limit]

        horarios_creados = 0
        horarios_actualizados = 0
        horarios_sin_cambio = 0
        horarios_error = 0
        grupo_no_encontrado = 0
        asignatura_no_encontrada = 0
        espacio_no_encontrado = 0
        espacio_autocreado = 0
        espacio_autocreado_sede_no_resuelta = 0
        hora_default = 0
        duplicados_horario_reutilizados = 0

        grupos = list(Grupo.objects.select_related('periodo', 'programa'))
        grupos_by_id = {str(g.id): g for g in grupos}
        grupos_by_name_periodo = {}
        for g in grupos:
            key = (self._normalize_text(g.nombre), self._normalize_text(g.periodo.nombre))
            grupos_by_name_periodo.setdefault(key, []).append(g)

        asignaturas = list(Asignatura.objects.all())
        asignaturas_by_codigo = {self._to_text(a.codigo): a for a in asignaturas}
        asignaturas_by_nombre = {}
        for a in asignaturas:
            asignaturas_by_nombre.setdefault(self._normalize_text(a.nombre), []).append(a)

        docentes = list(Usuario.objects.select_related('rol').filter(rol__nombre__iexact='docente'))
        docentes_by_email_prefix = {}
        docentes_by_name = {}
        for doc in docentes:
            correo = self._to_text(doc.correo).lower()
            prefix = correo.split('@', 1)[0] if '@' in correo else correo
            if prefix:
                docentes_by_email_prefix.setdefault(prefix, doc)
            docentes_by_name.setdefault(self._normalize_text(doc.nombre), []).append(doc)

        espacios = list(EspacioFisico.objects.select_related('sede'))
        espacios_by_match_key = {}
        espacios_by_match_key_sede = {}

        def _indexar_espacio(espacio_obj):
            sede_key = self._to_text(espacio_obj.sede.external_id)
            for source in [espacio_obj.nombre, espacio_obj.ubicacion]:
                for key in self._space_match_keys(source):
                    espacios_by_match_key.setdefault(key, []).append(espacio_obj)
                    if sede_key:
                        espacios_by_match_key_sede.setdefault((sede_key, key), []).append(espacio_obj)

        for e in espacios:
            _indexar_espacio(e)

        signal_validacion_desconectada = False
        signal_fusionado_desconectada = False
        if not dry_run:
            try:
                from django.db.models.signals import post_save, pre_save
                from horario.signals import crear_horario_fusionado, validar_horario
                signal_validacion_desconectada = bool(pre_save.disconnect(validar_horario, sender=Horario))
                signal_fusionado_desconectada = bool(post_save.disconnect(crear_horario_fusionado, sender=Horario))
                if signal_validacion_desconectada:
                    self.stdout.write(self.style.WARNING('Validacion de solapamientos desactivada temporalmente para ETL de horarios.'))
                if signal_fusionado_desconectada:
                    self.stdout.write(self.style.WARNING('Generacion de HorarioFusionado desactivada temporalmente para ETL de horarios.'))
            except Exception as exc:
                self.stdout.write(self.style.WARNING(f'No fue posible desactivar signals de horarios: {exc}'))

        try:
            for stg_horario in stg_horarios:
                try:
                    raw = stg_horario.raw_data or {}

                    grupo = None
                    id_grupo_txt = self._to_text(stg_horario.id_grupo_oracle)
                    if id_grupo_txt:
                        grupo = grupos_by_id.get(id_grupo_txt)
                    if not grupo:
                        key = (
                            self._normalize_text(stg_horario.nombre_grupo_oracle),
                            self._normalize_text(stg_horario.periodo_oracle),
                        )
                        candidates = grupos_by_name_periodo.get(key, [])
                        if len(candidates) == 1:
                            grupo = candidates[0]
                        elif len(candidates) > 1:
                            id_programa = self._to_int(stg_horario.programa_oracle, default=None)
                            if id_programa:
                                grupo = next((g for g in candidates if g.programa_id == id_programa), candidates[0])
                            else:
                                grupo = candidates[0]

                    if not grupo:
                        grupo_no_encontrado += 1
                        horarios_error += 1
                        continue

                    asignatura = asignaturas_by_codigo.get(self._to_text(stg_horario.id_asignatura_oracle))
                    if not asignatura:
                        nom_asig = self._normalize_text(stg_horario.asignatura_oracle)
                        candidates_asg = asignaturas_by_nombre.get(nom_asig, [])
                        if candidates_asg:
                            asignatura = candidates_asg[0]

                    if not asignatura:
                        asignatura_no_encontrada += 1
                        horarios_error += 1
                        continue

                    espacio = None
                    id_sede_raw = self._to_text(stg_horario.id_sede_oracle)
                    cod_sede_raw = self._to_text((raw or {}).get('cod_sede'))
                    # En VW_HORARIO, ID_SEDE puede venir como codigo corto (4,49,89...)
                    # y COD_SEDE como codigo homologado (10102,30101,301...).
                    id_sede = cod_sede_raw or id_sede_raw
                    nom_aula_raw = self._to_text(stg_horario.nom_aula_oracle)
                    if nom_aula_raw:
                        candidates_esp = []
                        seen_ids = set()
                        for key in self._space_match_keys(nom_aula_raw):
                            for c in espacios_by_match_key_sede.get((id_sede, key), []):
                                if c.id not in seen_ids:
                                    candidates_esp.append(c)
                                    seen_ids.add(c.id)
                            for c in espacios_by_match_key.get(key, []):
                                if c.id not in seen_ids:
                                    candidates_esp.append(c)
                                    seen_ids.add(c.id)

                        if len(candidates_esp) == 1:
                            espacio = candidates_esp[0]
                        elif len(candidates_esp) > 1:
                            espacio = next(
                                (e for e in candidates_esp if self._to_text(e.sede.external_id) == id_sede),
                                candidates_esp[0],
                            )

                    if not espacio:
                        espacio_no_encontrado += 1
                        if nom_aula_raw and not self._is_placeholder_space_name(nom_aula_raw):
                            source_system = stg_horario.source_system or 'ORACLE_SIU'
                            sede_horario = self._resolve_sede_from_oracle_payload(
                                source_system,
                                id_sede,
                                raw,
                                stg_horario.nombre_sede_oracle,
                            )
                            if sede_horario:
                                # Reintento por alias de aula descriptiva antes de crear fallback.
                                alias_sources = [nom_aula_raw] + self._space_alias_candidates(nom_aula_raw)
                                alias_candidates = []
                                seen_alias_ids = set()
                                for alias in alias_sources:
                                    for key in self._space_match_keys(alias):
                                        for c in espacios_by_match_key_sede.get((id_sede, key), []):
                                            if c.id not in seen_alias_ids:
                                                alias_candidates.append(c)
                                                seen_alias_ids.add(c.id)
                                        for c in espacios_by_match_key.get(key, []):
                                            if c.id not in seen_alias_ids:
                                                alias_candidates.append(c)
                                                seen_alias_ids.add(c.id)
                                if len(alias_candidates) == 1:
                                    espacio = alias_candidates[0]
                                elif len(alias_candidates) > 1:
                                    espacio = next(
                                        (e for e in alias_candidates if self._to_text(e.sede.external_id) == id_sede),
                                        alias_candidates[0],
                                    )

                                # Si no hay match por nomenclatura, crear/reusar espacio fallback por sede+nombre.
                                if not espacio:
                                    espacio = EspacioFisico.objects.filter(
                                        sede=sede_horario,
                                        nombre__iexact=nom_aula_raw,
                                    ).first()

                                if not espacio and not dry_run:
                                    tipo_nombre, tipo_desc = self._map_tipo_espacio(nom_aula_raw)
                                    tipo_fallback, _ = TipoEspacio.objects.get_or_create(
                                        nombre=tipo_nombre,
                                        defaults={'descripcion': tipo_desc},
                                    )
                                    espacio = EspacioFisico.objects.create(
                                        nombre=nom_aula_raw,
                                        sede=sede_horario,
                                        tipo=tipo_fallback,
                                        capacidad=0,
                                        ubicacion=nom_aula_raw,
                                        estado='Disponible',
                                        esta_abierto=True,
                                    )
                                    espacio_autocreado += 1
                                    _indexar_espacio(espacio)
                            else:
                                espacio_autocreado_sede_no_resuelta += 1

                    docente = None
                    num_doc = self._to_text(stg_horario.num_identificacion_docente)
                    if num_doc:
                        docente = docentes_by_email_prefix.get(num_doc)
                    if not docente:
                        nombre_doc = self._normalize_text(
                            f'{self._to_text(stg_horario.nombre_docente_oracle)} {self._to_text(stg_horario.apellidos_docente_oracle)}'
                        )
                        candidates_doc = docentes_by_name.get(nombre_doc, [])
                        if candidates_doc:
                            docente = candidates_doc[0]

                    dia_semana = self._resolve_dia_semana(stg_horario)
                    hora_inicio = self._parse_time_value(stg_horario.hor_inicio_raw)
                    hora_fin = self._parse_time_value(stg_horario.hor_fin_raw)
                    if not hora_inicio:
                        hora_inicio = time_obj(8, 0)
                        hora_default += 1
                    if not hora_fin:
                        hora_fin = time_obj(10, 0)
                        hora_default += 1
                    if hora_fin <= hora_inicio:
                        hora_fin = time_obj((hora_inicio.hour + 1) % 24, hora_inicio.minute)
                        hora_default += 1

                    cantidad = stg_horario.cantidad_estudiantes_oracle
                    if cantidad is None:
                        cantidad = self._to_int(raw.get('cantidad_estudiantes'), default=None)

                    if dry_run:
                        exists = Horario.objects.filter(
                            grupo=grupo,
                            asignatura=asignatura,
                            espacio=espacio,
                            dia_semana=dia_semana,
                            hora_inicio=hora_inicio,
                            hora_fin=hora_fin,
                        ).exists()
                        if exists:
                            horarios_actualizados += 1
                        else:
                            horarios_creados += 1
                        continue

                    lookup = {
                        'grupo': grupo,
                        'asignatura': asignatura,
                        'espacio': espacio,
                        'dia_semana': dia_semana,
                        'hora_inicio': hora_inicio,
                        'hora_fin': hora_fin,
                    }

                    coincidencias = Horario.objects.filter(**lookup).order_by('id')
                    # Evita duplicados cuando ya existe el mismo bloque horario sin espacio.
                    # Caso comun: corrida anterior creo slot con espacio=NULL y una nueva corrida
                    # encuentra/crea espacio para el mismo bloque; reutilizamos el existente.
                    if not coincidencias.exists() and espacio is not None:
                        coincidencias = Horario.objects.filter(
                            grupo=grupo,
                            asignatura=asignatura,
                            espacio__isnull=True,
                            dia_semana=dia_semana,
                            hora_inicio=hora_inicio,
                            hora_fin=hora_fin,
                        ).order_by('id')
                        if coincidencias.exists():
                            horario_base = coincidencias.first()
                            horario_base.espacio = espacio
                            horario_base.save(update_fields=['espacio'])
                            coincidencias = Horario.objects.filter(id=horario_base.id)

                    if coincidencias.exists():
                        horario = coincidencias.first()
                        created = False
                        if coincidencias.count() > 1:
                            duplicados_horario_reutilizados += 1
                    else:
                        horario = Horario.objects.create(
                            **lookup,
                            docente=docente,
                            cantidad_estudiantes=cantidad,
                            estado='pendiente',
                        )
                        created = True

                    if created:
                        horarios_creados += 1
                        continue

                    changed = False
                    if docente and horario.docente_id != docente.id:
                        horario.docente = docente
                        changed = True
                    if horario.cantidad_estudiantes != cantidad:
                        horario.cantidad_estudiantes = cantidad
                        changed = True
                    if horario.estado not in ('pendiente', 'aprobado', 'rechazado'):
                        horario.estado = 'pendiente'
                        changed = True

                    if changed:
                        horario.save()
                        horarios_actualizados += 1
                    else:
                        horarios_sin_cambio += 1

                except Exception as exc:
                    self.stdout.write(self.style.ERROR(f'  Error en horario {stg_horario.external_id}: {exc}'))
                    horarios_error += 1
        finally:
            if signal_validacion_desconectada or signal_fusionado_desconectada:
                try:
                    from django.db.models.signals import post_save, pre_save
                    from horario.signals import crear_horario_fusionado, validar_horario
                    if signal_validacion_desconectada:
                        pre_save.connect(validar_horario, sender=Horario)
                        self.stdout.write(self.style.SUCCESS('Validacion de solapamientos reactivada al finalizar ETL de horarios.'))
                    if signal_fusionado_desconectada:
                        post_save.connect(crear_horario_fusionado, sender=Horario)
                        self.stdout.write(self.style.SUCCESS('Generacion de HorarioFusionado reactivada al finalizar ETL de horarios.'))
                except Exception as exc:
                    self.stdout.write(self.style.WARNING(f'No fue posible reactivar signals de horarios: {exc}'))

        self.stdout.write(
            self.style.SUCCESS(
                'Horarios - '
                f'Creados: {horarios_creados}, '
                f'Actualizados: {horarios_actualizados}, '
                f'Sin cambio: {horarios_sin_cambio}, '
                f'Errores: {horarios_error}, '
                f'Duplicados reutilizados: {duplicados_horario_reutilizados}, '
                f'Grupo no encontrado: {grupo_no_encontrado}, '
                f'Asignatura no encontrada: {asignatura_no_encontrada}, '
                f'Espacio no encontrado: {espacio_no_encontrado}, '
                f'Espacio autocreado fallback: {espacio_autocreado}, '
                f'Espacio fallback sin sede resuelta: {espacio_autocreado_sede_no_resuelta}, '
                f'Horas por defecto aplicadas: {hora_default}'
            )
        )
