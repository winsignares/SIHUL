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
from sedes.models import Seccional, Sede
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
            self.migrate_estudiantes(dry_run, limit)
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

    @staticmethod
    def _resolve_sede(source_system, external_id):
        external = str(external_id or '').strip()
        if not external:
            return None
        return Sede.objects.filter(
            Q(source_system=source_system, external_id=external) |
            Q(external_id=external)
        ).first()

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
    def _parse_periodo_year(periodo_nombre):
        periodo_nombre = str(periodo_nombre or '').strip()
        if len(periodo_nombre) >= 4 and periodo_nombre[:4].isdigit():
            return int(periodo_nombre[:4])
        return datetime.now().year

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
        raw = stg_horario.raw_data or {}
        possible = None
        for key in ('dia_semana', 'dia', 'nombre_dia', 'dia_clase', 'day'):
            if key in raw and str(raw[key] or '').strip():
                possible = raw[key]
                break
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

    def migrate_periodos(self, dry_run=False, limit=None):
        self.stdout.write('=' * 60)
        self.stdout.write('ETAPA 1: Migrando Periodos Academicos')
        self.stdout.write('=' * 60)

        periodos_unicos = (
            StgOracleGrupoAcademico.objects
            .filter(estado_registro='valido')
            .exclude(periodo_academico__isnull=True)
            .exclude(periodo_academico='')
            .values_list('periodo_academico', flat=True)
            .distinct()
        )

        if limit:
            periodos_unicos = periodos_unicos[:limit]

        periodos_creados = 0
        periodos_existentes = 0

        for periodo_nombre in periodos_unicos:
            year = self._parse_periodo_year(periodo_nombre)
            fecha_inicio = datetime(year, 1, 15).date()
            fecha_fin = datetime(year, 12, 15).date()

            if dry_run:
                if PeriodoAcademico.objects.filter(nombre=periodo_nombre).exists():
                    periodos_existentes += 1
                else:
                    periodos_creados += 1
                continue

            _, created = PeriodoAcademico.objects.get_or_create(
                nombre=periodo_nombre,
                defaults={
                    'fecha_inicio': fecha_inicio,
                    'fecha_fin': fecha_fin,
                    'activo': True,
                },
            )
            if created:
                periodos_creados += 1
            else:
                periodos_existentes += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Periodos - Creados: {periodos_creados}, Existentes: {periodos_existentes}'
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
            # VW_DOCENTES actual solo incluye identificacion y nombre (sin ID_SEDE).
            # Si no existe dato de sede en staging, no aplicamos filtro a esta etapa.
            has_sede_data = stg_docentes.exclude(id_sede_oracle__isnull=True).exclude(id_sede_oracle='').exists()
            if has_sede_data:
                sedes_ids = list(Sede.objects.filter(seccional=seccional_filter).values_list('external_id', flat=True))
                sedes_ids = [self._to_text(s) for s in sedes_ids if self._to_text(s)]
                stg_docentes = stg_docentes.filter(id_sede_oracle__in=sedes_ids)
            else:
                self.stdout.write(
                    self.style.WARNING(
                        'Docentes: staging sin id_sede_oracle; se omite filtro de seccional en esta etapa.'
                    )
                )
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
                if not usuario and numero_doc:
                    usuario = Usuario.objects.filter(correo=f'{numero_doc}@docente.local').first()
                if not usuario and id_docente:
                    usuario = Usuario.objects.filter(correo=f'{id_docente}@docente.local').first()

                sede = self._resolve_sede(source_system, stg_docente.id_sede_oracle)
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
                if usuario.activo != activo:
                    usuario.activo = activo
                    usuario.is_active = activo
                    changed = True
                if rol_docente and usuario.rol_id != rol_docente.id:
                    usuario.rol = rol_docente
                    changed = True
                if sede and usuario.sede_id != sede.id:
                    usuario.sede = sede
                    changed = True
                if facultad and usuario.facultad_id != facultad.id:
                    usuario.facultad = facultad
                    changed = True

                correo_canon = self._to_text(usuario.correo).lower()
                if correo_pref and correo_canon != correo_pref:
                    usuario.correo = self._build_unique_email(correo_pref, current_user_id=usuario.id)
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

    def migrate_estudiantes(self, dry_run=False, limit=None):
        self.stdout.write('=' * 60)
        self.stdout.write('ETAPA 3B: Migrando Estudiantes')
        self.stdout.write('=' * 60)

        stg_estudiantes = StgOracleEstudiante.objects.filter(estado_registro='valido')
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
                if not usuario:
                    id_est = self._to_text(stg_estudiante.id_estudiante_oracle)
                    if id_est:
                        usuario = Usuario.objects.filter(correo=f'{id_est}@estudiante.local').first()

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
                    )
                    estudiantes_creados += 1
                    continue

                changed = False
                if usuario.nombre != nombre:
                    usuario.nombre = nombre
                    changed = True
                if rol_estudiante and usuario.rol_id != rol_estudiante.id:
                    usuario.rol = rol_estudiante
                    changed = True
                if not usuario.activo:
                    usuario.activo = True
                    usuario.is_active = True
                    changed = True

                correo_canon = self._to_text(usuario.correo).lower()
                if correo_canon != correo_pref:
                    usuario.correo = self._build_unique_email(correo_pref, current_user_id=usuario.id)
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

        for stg_espacio in stg_espacios:
            try:
                source_system = stg_espacio.source_system or 'ORACLE_SIU'
                sede = self._resolve_sede(source_system, stg_espacio.id_sede_oracle)
                if not sede:
                    sede_no_encontrada += 1
                    espacios_error += 1
                    continue

                tipo_nombre, tipo_desc = self._map_tipo_espacio(stg_espacio.tipo_espacio_oracle)
                tipo, created_tipo = TipoEspacio.objects.get_or_create(
                    nombre=tipo_nombre,
                    defaults={'descripcion': tipo_desc},
                )
                if created_tipo:
                    tipo_creado += 1

                nombre = self._to_text(stg_espacio.nombre_espacio_oracle) or self._to_text(stg_espacio.ident_aula_oracle)
                if not nombre:
                    nombre = f'Espacio {stg_espacio.external_id}'

                bloque = self._to_text(stg_espacio.bloque_oracle)
                ident = self._to_text(stg_espacio.ident_aula_oracle)
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
        hora_default = 0

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
        espacios_by_nombre = {}
        for e in espacios:
            espacios_by_nombre.setdefault(self._normalize_text(e.nombre), []).append(e)

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
                nom_aula = self._normalize_text(stg_horario.nom_aula_oracle)
                if nom_aula:
                    candidates_esp = espacios_by_nombre.get(nom_aula, [])
                    if len(candidates_esp) == 1:
                        espacio = candidates_esp[0]
                    elif len(candidates_esp) > 1:
                        id_sede = self._to_text(stg_horario.id_sede_oracle)
                        espacio = next(
                            (e for e in candidates_esp if self._to_text(e.sede.external_id) == id_sede),
                            candidates_esp[0],
                        )

                if not espacio:
                    espacio_no_encontrado += 1
                    horarios_error += 1
                    continue

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

                horario, created = Horario.objects.get_or_create(
                    grupo=grupo,
                    asignatura=asignatura,
                    espacio=espacio,
                    dia_semana=dia_semana,
                    hora_inicio=hora_inicio,
                    hora_fin=hora_fin,
                    defaults={
                        'docente': docente,
                        'cantidad_estudiantes': cantidad,
                        'estado': 'pendiente',
                    },
                )

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

        self.stdout.write(
            self.style.SUCCESS(
                'Horarios - '
                f'Creados: {horarios_creados}, '
                f'Actualizados: {horarios_actualizados}, '
                f'Sin cambio: {horarios_sin_cambio}, '
                f'Errores: {horarios_error}, '
                f'Grupo no encontrado: {grupo_no_encontrado}, '
                f'Asignatura no encontrada: {asignatura_no_encontrada}, '
                f'Espacio no encontrado: {espacio_no_encontrado}, '
                f'Horas por defecto aplicadas: {hora_default}'
            )
        )
